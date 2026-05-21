import { Injector } from "@angular/core";
import { Observable, Subject } from "rxjs";
import {
    provideChildTranslateService,
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

/**
 * Controllable loader: each call to getTranslation(lang) returns a Subject the
 * test can resolve or reject in any order. One subject per (loader, lang) — if
 * a test needs two services loading the same language independently, give each
 * its own loader instance.
 */
class ControllableLoader implements TranslateLoader {
    private subjects = new Map<string, Subject<TranslationObject>>();

    getTranslation(lang: string): Observable<TranslationObject> {
        const subject = new Subject<TranslationObject>();
        this.subjects.set(lang, subject);
        return subject.asObservable();
    }

    resolve(lang: string, translations: TranslationObject = {}): void {
        const subject = this.subjects.get(lang);
        if (!subject) throw new Error(`No pending load for "${lang}"`);
        subject.next(translations);
        subject.complete();
        this.subjects.delete(lang);
    }

    reject(lang: string, err: Error = new Error(`Load failed for ${lang}`)): void {
        const subject = this.subjects.get(lang);
        if (!subject) throw new Error(`No pending load for "${lang}"`);
        subject.error(err);
        this.subjects.delete(lang);
    }
}

/**
 * Queue-based loader: keeps a FIFO queue of pending subjects per language so
 * back-to-back loads of the same language can be resolved independently. Used
 * by T3b to script the resetLang + reloadLang race deterministically.
 */
class QueuingLoader implements TranslateLoader {
    private queue = new Map<string, Subject<TranslationObject>[]>();

    getTranslation(lang: string): Observable<TranslationObject> {
        const s = new Subject<TranslationObject>();
        const q = this.queue.get(lang) ?? [];
        q.push(s);
        this.queue.set(lang, q);
        return s.asObservable();
    }

    resolveFirst(lang: string, translations: TranslationObject = {}): void {
        const q = this.queue.get(lang);
        if (!q || q.length === 0) throw new Error(`No pending load for "${lang}"`);
        const s = q.shift()!;
        s.next(translations);
        s.complete();
    }

    pendingCount(lang: string): number {
        return this.queue.get(lang)?.length ?? 0;
    }
}

/**
 * Failing loader: errors synchronously on getTranslation for languages in
 * `failFor`, succeeds with empty translations for everything else. Used by
 * the child-side warn tests.
 */
class FailingLoader implements TranslateLoader {
    constructor(private failFor: Set<string>) {}

    getTranslation(lang: string): Observable<TranslationObject> {
        return new Observable((sub) => {
            if (this.failFor.has(lang)) {
                sub.error(new Error(`Load failed for ${lang}`));
            } else {
                sub.next({});
                sub.complete();
            }
        });
    }
}

function makeRoot(loader: TranslateLoader): { svc: TranslateService; injector: Injector } {
    const injector = Injector.create({
        providers: [
            provideTranslateService({
                loader: { provide: TranslateLoader, useValue: loader },
            }),
        ],
    });
    return { svc: injector.get(TranslateService), injector };
}

function makeChild(
    parent: Injector,
    loader: TranslateLoader,
): { svc: TranslateService; injector: Injector } {
    const injector = Injector.create({
        providers: [
            provideChildTranslateService({
                loader: { provide: TranslateLoader, useValue: loader },
            }),
        ],
        parent,
    });
    return { svc: injector.get(TranslateService), injector };
}

describe("isLoading — downward inheritance", () => {
    beforeEach(() => spyOn(console, "warn"));

    it("root loads, child sees true; resolve flips both false", () => {
        const rootLoader = new ControllableLoader();
        const childLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        const { svc: child } = makeChild(rootInj, childLoader);

        root.use("de");
        expect(root.isLoading()).toBe(true);
        expect(child.isLoading()).toBe(true);

        // Root resolves first; the child's onLangChange handler then fires a
        // local load on its own loader. Both must be resolved for child to
        // settle.
        rootLoader.resolve("de");
        childLoader.resolve("de");
        expect(root.isLoading()).toBe(false);
        expect(child.isLoading()).toBe(false);
    });

    it("child constructor init load: child true, root false", () => {
        const rootLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        root.use("en");
        rootLoader.resolve("en");
        expect(root.isLoading()).toBe(false);

        const childLoader = new ControllableLoader();
        const { svc: child } = makeChild(rootInj, childLoader);

        // Child constructor fired loadOrExtendLanguage('en') — its own loader
        // is in flight while the root's calm.
        expect(root.isLoading()).toBe(false);
        expect(child.isLoading()).toBe(true);

        childLoader.resolve("en");
        expect(child.isLoading()).toBe(false);
    });

    it("sibling subtrees are isolated", () => {
        const rootLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        root.use("en");
        rootLoader.resolve("en");

        const loaderA = new ControllableLoader();
        const loaderB = new ControllableLoader();
        const { svc: childA } = makeChild(rootInj, loaderA);
        const { svc: childB } = makeChild(rootInj, loaderB);
        loaderA.resolve("en");
        loaderB.resolve("en");

        // Both calm. Now A loads 'de' on its own subtree via reloadLang which
        // forces a local fetch (use() delegates up to root).
        childA.reloadLang("de");

        expect(childA.isLoading()).toBe(true);
        expect(childB.isLoading()).toBe(false);
        expect(root.isLoading()).toBe(false);

        loaderA.resolve("de");
        expect(childA.isLoading()).toBe(false);
    });

    it("lang-change cascade: root phase then child phase", () => {
        const rootLoader = new ControllableLoader();
        const childLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        const { svc: child } = makeChild(rootInj, childLoader);

        root.use("de");
        // Phase 1: root's load in flight — both see true via inheritance.
        expect(root.isLoading()).toBe(true);
        expect(child.isLoading()).toBe(true);

        rootLoader.resolve("de");
        // Phase 3: root settled, child's onLangChange handler fired its own
        // load. Root calm, child still loading.
        expect(root.isLoading()).toBe(false);
        expect(child.isLoading()).toBe(true);

        childLoader.resolve("de");
        expect(child.isLoading()).toBe(false);
    });

    it("fallback-lang-change cascade: symmetric to use()", () => {
        const rootLoader = new ControllableLoader();
        const childLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        const { svc: child } = makeChild(rootInj, childLoader);

        root.setFallbackLang("de");
        expect(root.isLoading()).toBe(true);
        expect(child.isLoading()).toBe(true);

        rootLoader.resolve("de");
        expect(root.isLoading()).toBe(false);
        expect(child.isLoading()).toBe(true);

        childLoader.resolve("de");
        expect(child.isLoading()).toBe(false);
    });

    // T1 — three-level hierarchy
    // Asserts inheritance is multi-level: grandchild sees root's loading state
    // before resolve, and all three settle to false once each level's cascaded
    // load is resolved (root → child → grandchild via onLangChange handlers).
    it("T1: 3-level hierarchy — grandchild inherits loading state from root", () => {
        const rootLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        const childLoader = new ControllableLoader();
        const { svc: child, injector: childInj } = makeChild(rootInj, childLoader);
        const grandchildLoader = new ControllableLoader();
        const { svc: grandchild } = makeChild(childInj, grandchildLoader);

        root.use("de");
        expect(root.isLoading()).toBe(true);
        expect(child.isLoading()).toBe(true);
        expect(grandchild.isLoading()).toBe(true);

        // Resolve in order: root, then the cascaded child + grandchild loads
        // that fired via onLangChange.
        rootLoader.resolve("de");
        childLoader.resolve("de");
        grandchildLoader.resolve("de");

        expect(root.isLoading()).toBe(false);
        expect(child.isLoading()).toBe(false);
        expect(grandchild.isLoading()).toBe(false);
    });

    // T2 — set-based dedup
    it("T2: same-language back-to-back use() — isLoading toggles once", () => {
        const loader = new ControllableLoader();
        const { svc: root } = makeRoot(loader);

        const observed: boolean[] = [root.isLoading()];
        root.use("de");
        observed.push(root.isLoading());
        // Second call against same language dedups via the in-flight registry —
        // `loadAndCompileTranslations.get()` returns the existing entry, no new
        // load is created.
        root.use("de");
        observed.push(root.isLoading());
        loader.resolve("de");
        observed.push(root.isLoading());

        expect(observed).toEqual([false, true, true, false]);
    });

    // T3 — resetLang clears immediately
    it("T3: resetLang flips isLoading false synchronously", () => {
        const loader = new ControllableLoader();
        const { svc: root } = makeRoot(loader);

        root.use("de");
        expect(root.isLoading()).toBe(true);
        root.resetLang("de");
        // Synchronous flip even though the underlying loader hasn't emitted.
        expect(root.isLoading()).toBe(false);

        // The late-arriving resolve must NOT flip isLoading back to true; the
        // entry was cleared and the finalize is a no-op via clearIfOwner.
        loader.resolve("de");
        expect(root.isLoading()).toBe(false);
    });

    // T3b — resetLang + reloadLang race + stale-finalize protection
    // Uses QueuingLoader so obsA and obsB get distinct subjects per lang and
    // can be resolved independently — pins the race deterministically.
    it("T3b: resetLang + reloadLang race — old finalize does not clobber new entry", () => {
        const loader = new QueuingLoader();
        const { svc: root } = makeRoot(loader);

        root.use("de"); // obsA enters the registry
        expect(root.isLoading()).toBe(true);
        expect(loader.pendingCount("de")).toBe(1);

        root.resetLang("de"); // clears registry entry; obsA still mid-flight underneath
        expect(root.isLoading()).toBe(false);

        root.reloadLang("de"); // obsB created + registered (obsA still in queue)
        expect(root.isLoading()).toBe(true);
        expect(loader.pendingCount("de")).toBe(2);

        // Resolve obsA first. Its finalize fires clearIfOwner('de', obsA) —
        // must be a no-op because the current registry entry is obsB.
        loader.resolveFirst("de");
        expect(root.isLoading()).toBe(true);

        // Now resolve obsB — its tap/finalize clear the entry; isLoading flips.
        loader.resolveFirst("de");
        expect(root.isLoading()).toBe(false);
    });

    // T4 — no flicker for already-loaded lang
    it("T4: already-loaded language — use() does not flicker isLoading", () => {
        const loader = new ControllableLoader();
        const { svc: root } = makeRoot(loader);

        root.use("en");
        loader.resolve("en");
        expect(root.isLoading()).toBe(false);

        const observed: boolean[] = [];
        root.use("en");
        observed.push(root.isLoading());

        // No load was triggered (translations already in store); isLoading must
        // never have flipped true between call and inspection.
        expect(observed).toEqual([false]);
    });

    it("child constructor: currentLang load failure warns once", () => {
        const rootLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        root.use("de");
        rootLoader.resolve("de");

        const childLoader = new FailingLoader(new Set(["de"]));
        makeChild(rootInj, childLoader);

        const warn = console.warn as jasmine.Spy;
        expect(warn).toHaveBeenCalledTimes(1);
        const msg = warn.calls.argsFor(0)[0] as string;
        expect(msg).toContain("child failed to load");
        expect(msg).toContain("de");
    });

    it("child constructor: onLangChange handler failure warns once", () => {
        const rootLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        root.use("en");
        rootLoader.resolve("en");

        const childLoader = new FailingLoader(new Set(["fr"]));
        makeChild(rootInj, childLoader);
        // Initial child load of 'en' succeeds; subsequent root.use('fr') triggers
        // the child's onLangChange handler, which fails.
        const warnBefore = (console.warn as jasmine.Spy).calls.count();
        root.use("fr");
        rootLoader.resolve("fr");
        const warns = (console.warn as jasmine.Spy).calls
            .all()
            .map((c) => c.args[0] as string)
            .slice(warnBefore);
        const childWarn = warns.find((m) => m.includes("child failed to load"));
        expect(childWarn).toBeDefined();
        expect(childWarn).toContain("fr");
    });

    // T5
    it("T5: child constructor fallbackLang failure warns; currentLang === fallbackLang dedups to one warn", () => {
        const rootLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        root.use("en");
        root.setFallbackLang("xx");
        rootLoader.resolve("en");
        rootLoader.resolve("xx");

        // Child fails 'xx' but succeeds 'en'.
        const childLoaderA = new FailingLoader(new Set(["xx"]));
        const warnA = (console.warn as jasmine.Spy).calls.count();
        makeChild(rootInj, childLoaderA);
        const warnsA = (console.warn as jasmine.Spy).calls
            .all()
            .slice(warnA)
            .map((c) => c.args[0] as string)
            .filter((m) => m.includes("child failed to load"));
        expect(warnsA.length).toBe(1);
        expect(warnsA[0]).toContain("xx");

        // Now reconfigure: currentLang === fallbackLang === 'yy', both fail.
        // Build a fresh root for this leg to avoid state coupling.
        const root2Loader = new ControllableLoader();
        const { svc: root2, injector: root2Inj } = makeRoot(root2Loader);
        root2.use("yy");
        root2.setFallbackLang("yy");
        // root2's use+setFallbackLang against ControllableLoader is pending; reject.
        root2Loader.reject("yy");

        const childLoaderB = new FailingLoader(new Set(["yy"]));
        const warnB = (console.warn as jasmine.Spy).calls.count();
        makeChild(root2Inj, childLoaderB);
        const warnsB = (console.warn as jasmine.Spy).calls
            .all()
            .slice(warnB)
            .map((c) => c.args[0] as string)
            .filter((m) => m.includes("child failed to load"));
        expect(warnsB.length).toBe(1); // not 2 — dedup guard fired
    });

    // T6
    it("T6: onFallbackLangChange handler failure warns with contextual message", () => {
        const rootLoader = new ControllableLoader();
        const { svc: root, injector: rootInj } = makeRoot(rootLoader);
        root.use("en");
        rootLoader.resolve("en");

        const childLoader = new FailingLoader(new Set(["xx"]));
        makeChild(rootInj, childLoader);

        const warnBefore = (console.warn as jasmine.Spy).calls.count();
        root.setFallbackLang("xx");
        rootLoader.resolve("xx"); // root succeeds for tracking purposes
        const warns = (console.warn as jasmine.Spy).calls
            .all()
            .slice(warnBefore)
            .map((c) => c.args[0] as string)
            .filter((m) => m.includes("child failed to load"));
        expect(warns.length).toBe(1);
        expect(warns[0]).toContain("xx");
    });
});
