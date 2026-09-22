import { firstValueFrom } from "rxjs";
import { Injector } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import {
    provideChildTranslateService,
    provideTranslateLoader,
    provideTranslateService,
    Translation,
    TranslateService,
} from "../public-api";
import { DelayedFakeLoader, provideTestableTranslateService } from "./test-helpers";

/** Resolves the first emission of get() as a promise. */
const getOnce = (
    translate: TranslateService,
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
        expect(() => translate.deleteLanguage("never-existed")).not.toThrow();
        expect(translate.getLangs()).not.toContain("never-existed");
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

    it("should flip isLoading() to false immediately", fakeAsync(() => {
        translate.use("en");
        expect(translate.isLoading()).toBeTrue();

        translate.deleteLanguage("en");

        expect(translate.isLoading()).toBeFalse();

        tick(20);
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

describe("TranslateService.deleteLanguage (hierarchical)", () => {
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
