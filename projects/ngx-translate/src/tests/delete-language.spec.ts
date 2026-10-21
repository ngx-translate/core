import { firstValueFrom } from "rxjs";
import { EnvironmentInjector, Injector } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
    ITranslateService,
    provideChildTranslateService,
    provideTranslateLoader,
    provideTranslateService,
    Translation,
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
        const langChange = vi.fn().mockName("langChange");
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
        const translationChange = vi.fn().mockName("translationChange");
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

    it("should flip isLoading() to false immediately", () => {
        vi.useFakeTimers();
        translate.use("en");
        expect(translate.isLoading()).toBe(true);

        translate.deleteLanguage("en");

        expect(translate.isLoading()).toBe(false);

        vi.advanceTimersByTime(20);
    });

    it("should let use() re-create the deleted language with a fresh load", () => {
        vi.useFakeTimers();
        translate.use("en");
        vi.advanceTimersByTime(9);
        expect(translate.getTranslations("en") as PlainTranslations).toEqual({
            TEST: "This is a test",
        });

        translate.deleteLanguage("en");
        expect(translate.getTranslations("en")).toBeUndefined();

        translate.use("en").subscribe();
        vi.advanceTimersByTime(9);

        expect(translate.getTranslations("en") as PlainTranslations).toEqual({
            TEST: "This is a test",
        });
    });
});

describe("TranslateService.deleteLanguage (hierarchical)", () => {
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
