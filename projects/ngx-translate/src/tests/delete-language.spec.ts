import { finalize, firstValueFrom, of, Subject } from "rxjs";
import { EnvironmentInjector, Injector } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import {
    ITranslateService,
    provideChildTranslateService,
    provideTranslateLoader,
    provideTranslateService,
    TranslateCompiler,
    TranslateLoader,
    Translation,
    TranslationObject,
    TranslateService,
} from "../public-api";
import { DelayedFakeLoader, provideTestableTranslateService } from "./test-helpers";

/** Resolves the first emission of get() as a promise. */
const getOnce = (
    translate: ITranslateService,
    key: string | string[],
    lang?: string,
): Promise<Translation> => firstValueFrom(translate.get(key, undefined, lang));

/*
 * getTranslations() returns DeepReadonly<...>; flatten for value assertions so
 * toEqual doesn't recurse the mapped type (TS2589).
 */
type PlainTranslations = Record<string, unknown>;

/** Throws if called — runtime-created languages never hit the loader. */
class CustomLangLoader {
    getTranslation(): never {
        throw new Error("should not be called for runtime-created languages");
    }
}

describe("TranslateService.deleteLanguage", () => {
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({ loader: provideTranslateLoader(CustomLangLoader) }),
            ],
        });
        translate = TestBed.inject(TranslateService);
    });

    it("should remove the language's translations from the store", () => {
        translate.setTranslation("custom", { HELLO: "Hello" });
        expect(translate.getTranslations("custom") as PlainTranslations).toEqual({
            HELLO: "Hello",
        });

        translate.deleteLanguage("custom");

        expect(translate.getTranslations("custom")).toBeUndefined();
    });

    it("should unregister the language from getLangs()", () => {
        translate.setTranslation("custom", { HELLO: "Hello" });
        expect(translate.getLangs()).toContain("custom");

        translate.deleteLanguage("custom");

        expect(translate.getLangs()).not.toContain("custom");
    });

    it("should resolve lookups for the deleted language through the missing-translation handler", async () => {
        translate.setTranslation("custom", { HELLO: "Hello" });

        expect(await getOnce(translate, "HELLO", "custom")).toEqual("Hello");

        translate.deleteLanguage("custom");

        expect(await getOnce(translate, "HELLO", "custom")).toEqual("HELLO");
    });

    it("should refresh translation-change subscribers when the current language is deleted", () => {
        translate.setTranslation("custom", { HELLO: "Hello" });
        translate.use("custom");
        const values: Translation[] = [];
        const subscription = translate
            .getStreamOnTranslationChange("HELLO")
            .subscribe((value) => values.push(value));

        translate.deleteLanguage("custom");

        expect(values).toEqual(["Hello", "HELLO"]);
        subscription.unsubscribe();
    });

    it("should refresh streams for an explicitly requested language when it is deleted", () => {
        translate.setTranslation("custom", { HELLO: "Hello" });
        const values: Translation[] = [];
        const subscription = translate
            .stream("HELLO", undefined, "custom")
            .subscribe((value) => values.push(value));

        translate.deleteLanguage("custom");

        expect(values).toEqual(["Hello", "HELLO"]);
        subscription.unsubscribe();
    });

    it("should notify subscribers after the language has been fully deleted", () => {
        translate.setTranslation("custom", { HELLO: "Hello" });
        translate.use("custom");
        const events: unknown[] = [];
        const langChange = jasmine.createSpy("langChange");
        const langSubscription = translate.onLangChange.subscribe(langChange);
        const subscription = translate.onTranslationChange.subscribe((event) => {
            events.push(event);
            expect(translate.getTranslations("custom")).toBeUndefined();
            expect(translate.getLangs()).not.toContain("custom");
        });

        translate.deleteLanguage("custom");

        expect(events).toEqual([{ lang: "custom", translations: {} }]);
        expect(langChange).not.toHaveBeenCalled();
        subscription.unsubscribe();
        langSubscription.unsubscribe();
    });

    it("should refresh subscribers when current or fallback translations are deleted", () => {
        translate.setTranslation("custom", { HELLO: "Hello" });
        translate.setTranslation("fallback", { HELLO: "Fallback" });
        translate.use("custom");
        translate.setFallbackLang("fallback");
        const values: Translation[] = [];
        const refreshed: Translation[] = [];
        const subscription = translate
            .getStreamOnTranslationChange("HELLO")
            .subscribe((value) => values.push(value));
        const refreshSubscription = translate.onTranslationRefresh.subscribe(() => {
            refreshed.push(translate.instant("HELLO"));
        });

        translate.deleteLanguage("custom");
        translate.deleteLanguage("fallback");

        expect(values).toEqual(["Hello", "Fallback", "HELLO"]);
        expect(refreshed).toEqual(["Fallback", "HELLO"]);
        expect(translate.getFallbackLang()).toBe("fallback");
        subscription.unsubscribe();
        refreshSubscription.unsubscribe();
    });

    it("should support the full runtime lifecycle: create, use, delete, re-create", async () => {
        // User creates their own language version at runtime
        translate.setTranslation("user-lang", { TITLE: "My title" });
        translate.use("user-lang");
        expect(translate.getCurrentLang()).toEqual("user-lang");
        expect(await getOnce(translate, "TITLE")).toEqual("My title");

        // ...and deletes it when no longer needed
        translate.deleteLanguage("user-lang");
        expect(translate.getLangs()).not.toContain("user-lang");
        expect(translate.getTranslations("user-lang")).toBeUndefined();

        // A fresh version can be created afterwards
        translate.setTranslation("user-lang", { TITLE: "New title" });
        expect(translate.getLangs()).toContain("user-lang");
        expect(await getOnce(translate, "TITLE")).toEqual("New title");
    });

    it("should keep the current language when deleting the language in use", () => {
        translate.setTranslation("custom", { HELLO: "Hello" });
        translate.use("custom");
        expect(translate.getCurrentLang()).toEqual("custom");

        translate.deleteLanguage("custom");

        /*
         * The pointer is kept (no reset, no onLangChange) — matching the
         * pre-v18 `delete translate.translations[lang]` behavior. Lookups now
         * resolve through the missing-translation handler.
         */
        expect(translate.getCurrentLang()).toEqual("custom");
        expect(translate.getTranslations("custom")).toBeUndefined();
    });

    it("should unregister a language that was only registered via addLangs", () => {
        translate.addLangs(["registered-only"]);
        expect(translate.getLangs()).toContain("registered-only");

        translate.deleteLanguage("registered-only");

        expect(translate.getLangs()).not.toContain("registered-only");
        expect(translate.getTranslations("registered-only")).toBeUndefined();
    });

    it("should be a no-op for a language that does not exist", () => {
        const translationChange = jasmine.createSpy("translationChange");
        const subscription = translate.onTranslationChange.subscribe(translationChange);

        expect(() => translate.deleteLanguage("never-existed")).not.toThrow();
        expect(translate.getLangs()).not.toContain("never-existed");
        expect(translationChange).not.toHaveBeenCalled();
        subscription.unsubscribe();
    });

    it("should not affect other languages", () => {
        translate.setTranslation("keep", { HELLO: "Hello" });
        translate.setTranslation("drop", { HELLO: "Hello" });

        translate.deleteLanguage("drop");

        expect(translate.getLangs()).toContain("keep");
        expect(translate.getTranslations("keep") as PlainTranslations).toEqual({ HELLO: "Hello" });
    });

    it("should return the key for array lookups after deletion", async () => {
        translate.setTranslation("custom", { HELLO: "Hello" });
        // An array of keys always resolves to an object keyed by each input key
        const before = (await getOnce(translate, ["HELLO"], "custom")) as Translation;
        expect(before).toEqual({ HELLO: "Hello" });

        translate.deleteLanguage("custom");

        const after = (await getOnce(translate, ["HELLO"], "custom")) as Translation;
        expect(after).toEqual({ HELLO: "HELLO" });
    });
});

describe("TranslateService.deleteLanguage during in-flight loading", () => {
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({
                    loader: provideTranslateLoader(DelayedFakeLoader),
                }),
            ],
        });
        translate = TestBed.inject(TranslateService);
    });

    it("should stop loading immediately and keep the language deleted", fakeAsync(() => {
        translate.use("en");
        expect(translate.isLoading()).toBeTrue();

        translate.deleteLanguage("en");

        expect(translate.isLoading()).toBeFalse();

        tick(20);
        expect(translate.getLangs()).not.toContain("en");
        expect(translate.getTranslations("en")).toBeUndefined();
        expect(translate.instant("TEST")).toBe("TEST");
    }));

    it("should let use() re-create the deleted language with a fresh load", fakeAsync(() => {
        translate.use("en");
        tick(9);
        expect(translate.getTranslations("en") as PlainTranslations).toEqual({
            TEST: "This is a test",
        });

        translate.deleteLanguage("en");
        expect(translate.getTranslations("en")).toBeUndefined();

        translate.use("en").subscribe();
        tick(9);

        expect(translate.getTranslations("en") as PlainTranslations).toEqual({
            TEST: "This is a test",
        });
    }));
});

describe("TranslateService.deleteLanguage cancellation", () => {
    let translate: TranslateService;
    let pending: Subject<TranslationObject>;
    let loader: jasmine.Spy<TranslateLoader["getTranslation"]>;
    let teardown: jasmine.Spy;

    beforeEach(() => {
        pending = new Subject<TranslationObject>();
        teardown = jasmine.createSpy("loader teardown");
        loader = jasmine
            .createSpy("getTranslation")
            .and.returnValue(pending.pipe(finalize(teardown)));
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: { getTranslation: loader } },
                }),
            ],
        });
        translate = TestBed.inject(TranslateService);
        translate.setTranslation("en", { HELLO: "Hello" });
        translate.use("en");
        translate.setFallbackLang("en");
    });

    it("should complete shared loads and pending lookups without restoring the language", () => {
        const next = jasmine.createSpy("next");
        const lookupNext = jasmine.createSpy("lookup next");
        const error = jasmine.createSpy("error");
        const complete = jasmine.createSpy("complete").and.callFake(() => {
            expect(translate.isLoading()).toBeFalse();
            expect(translate.getLangs()).not.toContain("fr");
            expect(translate.getTranslations("fr")).toBeUndefined();
        });
        const langChange = jasmine.createSpy("langChange");
        translate.onLangChange.subscribe(langChange);
        translate.addLangs(["fr"]);
        translate.use("fr").subscribe({ next, error, complete });
        translate.use("fr").subscribe({ next, error, complete });
        translate.get("HELLO", undefined, "fr").subscribe({ next: lookupNext, error, complete });

        translate.deleteLanguage("fr");
        pending.next({ HELLO: "Bonjour" });
        pending.complete();

        expect(loader).toHaveBeenCalledTimes(1);
        expect(teardown).toHaveBeenCalledTimes(1);
        expect(complete).toHaveBeenCalledTimes(3);
        expect(next).not.toHaveBeenCalled();
        expect(lookupNext).toHaveBeenCalledOnceWith("HELLO");
        expect(error).not.toHaveBeenCalled();
        expect(langChange).not.toHaveBeenCalled();
        expect(translate.getLangs()).not.toContain("fr");
        expect(translate.getTranslations("fr")).toBeUndefined();
        expect(translate.getCurrentLang()).toBe("en");
    });

    for (const method of ["use", "reloadLang"] as const) {
        it(`should allow a fresh ${method} without stale writes or loading-state changes`, () => {
            const fresh = new Subject<TranslationObject>();
            loader.and.returnValues(pending, fresh);
            const cancelled = translate.use("fr");
            translate.deleteLanguage("fr");

            translate[method]("fr").subscribe();
            pending.next({ HELLO: "Stale" });
            expect(translate.isLoading()).toBeTrue();
            expect(translate.getTranslations("fr")).toBeUndefined();

            fresh.next({ HELLO: "Fresh" });
            fresh.complete();
            pending.next({ HELLO: "Stale after fresh load" });
            pending.complete();
            const next = jasmine.createSpy("late next");
            const complete = jasmine.createSpy("late complete");
            cancelled.subscribe({ next, complete });

            expect(loader).toHaveBeenCalledTimes(2);
            expect(translate.isLoading()).toBeFalse();
            expect(translate.instant("HELLO", undefined, "fr")).toBe("Fresh");
            expect(next).not.toHaveBeenCalled();
            expect(complete).toHaveBeenCalledTimes(1);
        });
    }

    it("should cancel older loads even after reset and reload cleared their registry entries", () => {
        const fresh = new Subject<TranslationObject>();
        loader.and.returnValues(pending, fresh);
        const complete = jasmine.createSpy("complete");
        translate.use("fr").subscribe({ complete });
        translate.reloadLang("fr").subscribe({ complete });

        translate.deleteLanguage("fr");
        pending.next({ HELLO: "Old" });
        fresh.next({ HELLO: "Newer" });

        expect(pending.observed).toBeFalse();
        expect(fresh.observed).toBeFalse();
        expect(complete).toHaveBeenCalledTimes(2);
        expect(translate.getTranslations("fr")).toBeUndefined();
        expect(translate.getCurrentLang()).toBe("en");
    });

    it("should keep other languages loading", () => {
        const other = new Subject<TranslationObject>();
        loader.and.returnValues(pending, other);
        translate.reloadLang("fr");
        translate.reloadLang("de");

        translate.deleteLanguage("fr");

        expect(translate.isLoading()).toBeTrue();
        expect(other.observed).toBeTrue();
        other.next({ HELLO: "Hallo" });
        other.complete();
        expect(translate.isLoading()).toBeFalse();
        expect(translate.instant("HELLO", undefined, "de")).toBe("Hallo");
    });

    it("should prevent a delayed fallback-language change", () => {
        const fallbackChange = jasmine.createSpy("fallbackChange");
        translate.onFallbackLangChange.subscribe(fallbackChange);
        translate.setFallbackLang("fr");

        translate.deleteLanguage("fr");
        pending.next({ HELLO: "Bonjour" });

        expect(translate.getFallbackLang()).toBe("en");
        expect(fallbackChange).not.toHaveBeenCalled();
        expect(translate.getTranslations("fr")).toBeUndefined();
    });

    it("should preserve current and fallback pointers when deleting their pending catalog", () => {
        translate.reloadLang("en");

        translate.deleteLanguage("en");

        expect(translate.getCurrentLang()).toBe("en");
        expect(translate.getFallbackLang()).toBe("en");
        expect(translate.getTranslations("en")).toBeUndefined();
    });

    it("should resolve pending lookups through the normal language lookup rules", async () => {
        translate.use("fr");
        const current = translate.getAsync("HELLO");
        const explicit = translate.getAsync("HELLO", undefined, "fr");

        translate.deleteLanguage("fr");

        await expectAsync(current).toBeResolvedTo("Hello");
        await expectAsync(explicit).toBeResolvedTo("HELLO");
    });

    it("should resolve a pending lookup using fallback translations after deleting the current catalog", async () => {
        translate.setTranslation("de", { HELLO: "Hallo {{name}}" });
        translate.setFallbackLang("de");
        translate.reloadLang("en");
        const result = translate.getAsync(["HELLO"], { name: "Ada" });

        translate.deleteLanguage("en");

        await expectAsync(result).toBeResolvedTo({ HELLO: "Hallo Ada" });
    });

    for (const method of ["stream", "getStreamOnTranslationChange"] as const) {
        it(`should emit the remaining translation and keep ${method} subscribed`, () => {
            translate.use("fr");
            const values: Translation[] = [];
            const subscription = translate[method]("HELLO").subscribe((value) =>
                values.push(value),
            );

            translate.deleteLanguage("fr");

            expect(values).toEqual(["Hello"]);
            expect(subscription.closed).toBeFalse();
            translate.setTranslation("en", { HELLO: "Updated" });
            translate.use("en");
            expect(values).toEqual(["Hello", "Updated"]);
            subscription.unsubscribe();
        });
    }

    it("should still reject pending lookups when loading fails without deletion", async () => {
        spyOn(console, "warn");
        const failure = new Error("load failed");
        translate.use("fr");
        const result = translate.getAsync("HELLO");

        pending.error(failure);

        await expectAsync(result).toBeRejectedWith(failure);
        expect(translate.getCurrentLang()).toBe("en");
        expect(translate.isLoading()).toBeFalse();
    });

    it("should not replay a partial result from a cancelled load observable", () => {
        const load = translate.use("fr");
        pending.next({ HELLO: "Bonjour" });

        translate.deleteLanguage("fr");
        const next = jasmine.createSpy("next");
        const complete = jasmine.createSpy("complete");
        load.subscribe({ next, complete });

        expect(next).not.toHaveBeenCalled();
        expect(complete).toHaveBeenCalledTimes(1);
        expect(teardown).toHaveBeenCalledTimes(1);
    });

    it("should preserve completed load snapshots without restoring the deleted catalog", async () => {
        const beforeCompletion = translate.use("fr");
        pending.next({ HELLO: "Bonjour" });
        pending.complete();
        const afterCompletion = translate.use("fr");

        translate.deleteLanguage("fr");

        expect((await firstValueFrom(beforeCompletion)) as PlainTranslations).toEqual({
            HELLO: "Bonjour",
        });
        expect((await firstValueFrom(afterCompletion)) as PlainTranslations).toEqual({
            HELLO: "Bonjour",
        });
        expect(loader).toHaveBeenCalledTimes(1);
        expect(translate.getTranslations("fr")).toBeUndefined();
        expect(translate.getLangs()).not.toContain("fr");
        expect(translate.isLoading()).toBeFalse();
    });

    it("should allow a fresh load from a cancellation completion callback", () => {
        const fresh = new Subject<TranslationObject>();
        loader.and.returnValues(pending, fresh);
        translate.use("fr").subscribe({ complete: () => translate.use("fr") });

        translate.deleteLanguage("fr");

        expect(translate.isLoading()).toBeTrue();
        fresh.next({ HELLO: "Fresh" });
        fresh.complete();
        expect(translate.instant("HELLO")).toBe("Fresh");
        expect(translate.isLoading()).toBeFalse();
    });

    it("should allow a completion callback to recreate the language synchronously", () => {
        loader.and.returnValues(pending, of({ HELLO: "Fresh" }));
        translate.use("fr").subscribe({ complete: () => translate.use("fr") });

        translate.deleteLanguage("fr");

        expect(pending.observed).toBeFalse();
        expect(translate.getLangs()).toContain("fr");
        expect(translate.getCurrentLang()).toBe("fr");
        expect(translate.instant("HELLO")).toBe("Fresh");
        expect(translate.isLoading()).toBeFalse();
    });

    it("should invalidate stale writes before deletion notifies translation subscribers", () => {
        const fresh = new Subject<TranslationObject>();
        loader.and.returnValues(pending, fresh);
        translate.use("fr");
        translate.setTranslation("fr", { HELLO: "Manual" });
        translate.onTranslationChange.subscribe((event) => {
            if (event.lang === "fr" && Object.keys(event.translations).length === 0) {
                pending.next({ HELLO: "Stale" });
                translate.use("fr");
            }
        });

        translate.deleteLanguage("fr");

        expect(translate.getTranslations("fr")).toBeUndefined();
        expect(translate.getCurrentLang()).toBe("en");
        expect(translate.isLoading()).toBeTrue();
        fresh.next({ HELLO: "Fresh" });
        fresh.complete();
        expect(translate.instant("HELLO")).toBe("Fresh");
    });

    it("should discard a result when a custom compiler deletes the language", () => {
        translate.use("fr");
        spyOn(TestBed.inject(TranslateCompiler), "compileTranslations").and.callFake(
            (translations, lang) => {
                translate.deleteLanguage(lang);
                return translations;
            },
        );

        pending.next({ HELLO: "Stale" });

        expect(translate.getTranslations("fr")).toBeUndefined();
        expect(translate.getCurrentLang()).toBe("en");
        expect(translate.isLoading()).toBeFalse();
    });

    it("should settle loading when the loader deletes the language synchronously", () => {
        loader.and.callFake((lang) => {
            translate.deleteLanguage(lang);
            return of({ HELLO: "Stale" });
        });
        const next = jasmine.createSpy("next");
        const complete = jasmine.createSpy("complete");

        translate.use("fr").subscribe({ next, complete });

        expect(next).not.toHaveBeenCalled();
        expect(complete).toHaveBeenCalledTimes(1);
        expect(translate.isLoading()).toBeFalse();
        expect(translate.getTranslations("fr")).toBeUndefined();
        loader.and.returnValue(of({ HELLO: "Fresh" }));
        translate.use("fr");
        expect(translate.instant("HELLO")).toBe("Fresh");
        expect(translate.isLoading()).toBeFalse();
    });

    it("should suppress a loader error triggered by deletion notifications", () => {
        spyOn(console, "warn");
        const injector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: { getTranslation: loader } },
                }),
            ],
        });
        const service = injector.get(TranslateService);
        const error = jasmine.createSpy("error");
        const complete = jasmine.createSpy("complete");
        try {
            service.use("fr").subscribe({ error, complete });
            service.setTranslation("fr", { HELLO: "Manual" });
            service.onTranslationChange.subscribe(() => pending.error(new Error("too late")));

            service.deleteLanguage("fr");

            expect(error).not.toHaveBeenCalled();
            expect(complete).toHaveBeenCalledTimes(1);
            expect(console.warn).not.toHaveBeenCalled();
            expect(service.getCurrentLang()).toBe("fr");
            expect(service.getTranslations("fr")).toBeUndefined();
            expect(service.isLoading()).toBeFalse();
        } finally {
            (injector as EnvironmentInjector).destroy();
        }
    });

    it("should complete a retained failed load after deletion without replaying its error", () => {
        spyOn(console, "warn");
        const failure = new Error("load failed");
        const error = jasmine.createSpy("error");
        const load = translate.use("fr");
        load.subscribe({ error });
        pending.error(failure);
        expect(error).toHaveBeenCalledOnceWith(failure);

        translate.deleteLanguage("fr");
        const complete = jasmine.createSpy("complete");
        load.subscribe({ error, complete });

        expect(error).toHaveBeenCalledTimes(1);
        expect(complete).toHaveBeenCalledTimes(1);
        expect(translate.isLoading()).toBeFalse();
    });
});

describe("TranslateService.deleteLanguage (hierarchical)", () => {
    describe("ancestor request ordering", () => {
        let rootInjector: Injector;
        let childInjector: Injector;
        let root: TranslateService;
        let rootLoad: Subject<TranslationObject>;
        let childLoad: Subject<TranslationObject>;
        let freshChildLoad: Subject<TranslationObject>;
        let childLoader: jasmine.Spy<TranslateLoader["getTranslation"]>;

        beforeEach(() => {
            rootLoad = new Subject<TranslationObject>();
            childLoad = new Subject<TranslationObject>();
            freshChildLoad = new Subject<TranslationObject>();
            childLoader = jasmine
                .createSpy("child loader")
                .and.returnValues(childLoad, freshChildLoad);
            rootInjector = Injector.create({
                providers: [
                    provideTranslateService({
                        loader: {
                            provide: TranslateLoader,
                            useValue: { getTranslation: () => rootLoad },
                        },
                    }),
                ],
            });
            root = rootInjector.get(TranslateService);
            childInjector = Injector.create({
                parent: rootInjector,
                providers: [
                    provideChildTranslateService({
                        loader: {
                            provide: TranslateLoader,
                            useValue: { getTranslation: childLoader },
                        },
                    }),
                ],
            });
        });

        afterEach(() => {
            (childInjector as EnvironmentInjector).destroy();
            (rootInjector as EnvironmentInjector).destroy();
        });

        for (const method of ["use", "setFallbackLang"] as const) {
            it(`should ignore an older parent ${method} and accept a later explicit request`, () => {
                root[method]("fr");
                const child = childInjector.get(TranslateService);
                expect(childLoader).toHaveBeenCalledTimes(1);

                child.deleteLanguage("fr");

                expect(childLoad.observed).toBeFalse();
                expect(rootLoad.observed).toBeTrue();
                rootLoad.next({ HELLO: "Parent" });
                rootLoad.complete();
                expect(root.getLangs()).toContain("fr");
                expect(child.getTranslations("fr")).toBeUndefined();
                expect(childLoader).toHaveBeenCalledTimes(1);
                expect(child.isLoading()).toBeFalse();

                root[method]("fr");
                expect(childLoader).toHaveBeenCalledTimes(2);
                freshChildLoad.next({ HELLO: "Child" });
                freshChildLoad.complete();
                expect(child.getTranslations("fr") as PlainTranslations).toEqual({
                    HELLO: "Child",
                });
            });

            it(`should accept a new parent ${method} even when it shares the older pending load`, () => {
                root[method]("fr");
                const child = childInjector.get(TranslateService);
                child.deleteLanguage("fr");

                root[method]("fr");
                rootLoad.next({ HELLO: "Parent" });
                rootLoad.complete();

                expect(childLoader).toHaveBeenCalledTimes(2);
                freshChildLoad.next({ HELLO: "Child" });
                freshChildLoad.complete();
                expect(child.getLangs()).toContain("fr");
                expect(child.isLoading()).toBeFalse();
            });
        }

        it("should not treat an unrelated newer request as permission to restore an older language", () => {
            root.setFallbackLang("fr");
            const child = childInjector.get(TranslateService);
            child.deleteLanguage("fr");
            childLoader.and.returnValue(of({}));

            root.setTranslation("de", { HELLO: "Hallo" });
            root.use("de");
            rootLoad.next({ HELLO: "Bonjour" });
            rootLoad.complete();

            expect(childLoader.calls.allArgs()).toEqual([["fr"], ["de"]]);
            expect(child.getTranslations("fr")).toBeUndefined();
            expect(root.getFallbackLang()).toBe("fr");
            expect(child.getCurrentLang()).toBe("de");
        });
    });

    for (const scope of ["root", "child", "isolated"] as const) {
        it(`should cancel only loads owned by the ${scope} service`, () => {
            const rootLoad = new Subject<TranslationObject>();
            const childLoad = new Subject<TranslationObject>();
            const isolatedLoad = new Subject<TranslationObject>();
            const rootInjector = Injector.create({
                providers: [
                    provideTranslateService({
                        loader: {
                            provide: TranslateLoader,
                            useValue: { getTranslation: () => rootLoad },
                        },
                    }),
                ],
            });
            const childInjector = Injector.create({
                providers: [
                    provideChildTranslateService({
                        loader: {
                            provide: TranslateLoader,
                            useValue: { getTranslation: () => childLoad },
                        },
                    }),
                ],
                parent: rootInjector,
            });
            const isolatedInjector = Injector.create({
                providers: [
                    provideTranslateService({
                        loader: {
                            provide: TranslateLoader,
                            useValue: { getTranslation: () => isolatedLoad },
                        },
                    }),
                ],
                parent: rootInjector,
            });
            const services = {
                root: rootInjector.get(TranslateService),
                child: childInjector.get(TranslateService),
                isolated: isolatedInjector.get(TranslateService),
            };
            const loads = { root: rootLoad, child: childLoad, isolated: isolatedLoad };

            try {
                Object.values(services).forEach((service) => service.reloadLang("fr"));
                services[scope].deleteLanguage("fr");

                expect(services.root.isLoading()).toBe(scope !== "root");
                expect(services.child.isLoading()).toBeTrue();
                expect(services.isolated.isLoading()).toBe(scope !== "isolated");
                for (const key of ["root", "child", "isolated"] as const) {
                    expect(loads[key].observed).toBe(key !== scope);
                    loads[key].next({ HELLO: key });
                    loads[key].complete();
                    if (key === scope) {
                        expect(services[key].getTranslations("fr")).toBeUndefined();
                    } else {
                        expect(services[key].getLangs()).toContain("fr");
                    }
                }
                Object.values(services).forEach((service) =>
                    expect(service.isLoading()).toBeFalse(),
                );
            } finally {
                (isolatedInjector as EnvironmentInjector).destroy();
                (childInjector as EnvironmentInjector).destroy();
                (rootInjector as EnvironmentInjector).destroy();
            }
        });
    }

    it("should refresh child streams as child and parent translations are deleted", () => {
        const rootInjector = Injector.create({
            providers: [provideTranslateService()],
        });
        const root = rootInjector.get(TranslateService);
        const childInjector = Injector.create({
            providers: [provideChildTranslateService()],
            parent: rootInjector,
        });
        const child = childInjector.get(TranslateService);
        root.setTranslation("custom", { HELLO: "Parent" });
        child.setTranslation("custom", { HELLO: "Child" });
        root.use("custom");
        const values: Translation[] = [];
        const refreshed: Translation[] = [];
        const subscription = child
            .stream("HELLO", undefined, "custom")
            .subscribe((value) => values.push(value));
        const refreshSubscription = child.onTranslationRefresh.subscribe(() => {
            refreshed.push(child.instant("HELLO"));
        });

        child.deleteLanguage("custom");
        root.deleteLanguage("custom");

        expect(values).toEqual(["Child", "Parent", "HELLO"]);
        expect(refreshed).toEqual(["Parent", "HELLO"]);
        subscription.unsubscribe();
        refreshSubscription.unsubscribe();
        // Angular <20 types Injector.create() as Injector, without destroy().
        (childInjector as EnvironmentInjector).destroy();
        (rootInjector as EnvironmentInjector).destroy();
    });

    it("should delete the language only on the calling (child) service", () => {
        /*
         * 1. Root service — children must be created in a separate injector
         * with `parent`, mirroring the translate.hierarchy.spec.ts pattern
         */
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({ loader: provideTranslateLoader(CustomLangLoader) }),
            ],
        });
        const root = rootInjector.get(TranslateService);

        // 2. Child service
        const childInjector = Injector.create({
            providers: [provideChildTranslateService()],
            parent: rootInjector,
        });
        const child = childInjector.get(TranslateService);
        expect(child).not.toBe(root);

        child.setTranslation("child-lang", { HELLO: "Hello" });
        root.setTranslation("root-lang", { HELLO: "Hello" });
        expect(child.getLangs()).toContain("child-lang");
        expect(root.getLangs()).toContain("root-lang");

        child.deleteLanguage("child-lang");

        expect(child.getLangs()).not.toContain("child-lang");
        expect(child.getTranslations("child-lang")).toBeUndefined();
        // The root's own language is untouched
        expect(root.getLangs()).toContain("root-lang");
        expect(root.getTranslations("root-lang") as PlainTranslations).toEqual({ HELLO: "Hello" });
    });
});
