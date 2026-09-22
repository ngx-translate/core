import { Injectable, Injector, Type } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import {
    MissingTranslationHandler,
    MissingTranslationHandlerParams,
    provideChildTranslateService,
    provideMissingTranslationHandler,
    provideTranslateLoader,
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

@Injectable()
class MultiLangLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        const translations: Record<string, TranslationObject> = {
            en: {
                HELLO: "Hello",
                EMPTY: "",
                SUBTREE: { NESTED: "Nested value" },
            },
            de: {
                HALLO: "Hallo",
                HELLO: "Hallo (de)",
                ONLY_NULL: "Wert",
            },
            fr: {
                BONJOUR: "Bonjour",
            },
        };

        return of(translations[lang] ?? {});
    }
}

/** Records every invocation so tests can assert hasTranslationKey() stays side-effect free. */
@Injectable()
class RecordingHandler implements MissingTranslationHandler {
    calls = 0;

    handle(params: MissingTranslationHandlerParams): string {
        this.calls++;
        void params;
        return "handled";
    }
}

function createRootAndChild(): { root: TranslateService; child: TranslateService } {
    const rootInjector = Injector.create({
        providers: [provideTranslateService({ loader: provideTranslateLoader(MultiLangLoader) })],
    });
    const root = rootInjector.get(TranslateService);
    root.use("en");

    const childInjector = Injector.create({
        providers: [provideChildTranslateService()],
        parent: rootInjector,
    });
    const child = childInjector.get(TranslateService);

    return { root, child };
}

describe("TranslateService.hasTranslationKey", () => {
    let translate: TranslateService;
    let handler: RecordingHandler;

    const prepare = (handlerClass: Type<MissingTranslationHandler> = RecordingHandler) => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: provideTranslateLoader(MultiLangLoader),
                    missingTranslationHandler: provideMissingTranslationHandler(handlerClass),
                }),
            ],
        });
        translate = TestBed.inject(TranslateService);
        handler = TestBed.inject(MissingTranslationHandler) as RecordingHandler;
        translate.use("en");
        translate.setFallbackLang("de");
    };

    it("returns true for an existing key in the current language", () => {
        prepare();

        expect(translate.hasTranslationKey("HELLO")).toBeTrue();
    });

    it("returns false for a missing key without invoking the missing-translation handler", () => {
        prepare();

        expect(translate.hasTranslationKey("MISSING")).toBeFalse();
        expect(handler.calls).toEqual(0);

        /*
         * Sanity check: instant() on the same key DOES invoke the handler —
         * hasTranslationKey() must not.
         */
        translate.instant("MISSING");
        expect(handler.calls).toEqual(1);
    });

    it("returns true when only the fallback language has the key", () => {
        prepare();

        expect(translate.hasTranslationKey("HALLO")).toBeTrue();
    });

    it("counts an empty string as an existing translation", () => {
        prepare();

        expect(translate.hasTranslationKey("EMPTY")).toBeTrue();
        expect(translate.instant("EMPTY")).toEqual("");
    });

    it("counts an explicit null as missing", () => {
        prepare();
        translate.setTranslation("en", { NULL_KEY: null });

        expect(translate.hasTranslationKey("NULL_KEY")).toBeFalse();
    });

    it("resolves an explicit null through the fallback language", () => {
        prepare();
        translate.setTranslation("en", { ONLY_NULL: null });

        // "en" has null, "de" has a real value → the key exists
        expect(translate.hasTranslationKey("ONLY_NULL")).toBeTrue();
    });

    it("supports nested (dotted) keys and sub-trees", () => {
        prepare();

        expect(translate.hasTranslationKey("SUBTREE")).toBeTrue();
        expect(translate.hasTranslationKey("SUBTREE.NESTED")).toBeTrue();
        expect(translate.hasTranslationKey("SUBTREE.MISSING")).toBeFalse();
    });

    it("with per-call lang looks up the specified language directly", () => {
        prepare();

        // "de" has HELLO even though the current language is "en"
        expect(translate.hasTranslationKey("HELLO", "de")).toBeTrue();

        // EMPTY only exists in "en"; lang="de" bypasses the current language
        // and the fallback chain entirely
        expect(translate.hasTranslationKey("EMPTY", "de")).toBeFalse();

        // "fr" is neither current nor fallback. Per-call lang does not
        // auto-load a language (same as instant()); preload it into the store
        // with reloadLang, which does not change the current language
        translate.reloadLang("fr").subscribe();
        expect(translate.hasTranslationKey("BONJOUR", "fr")).toBeTrue();
        expect(translate.hasTranslationKey("BONJOUR")).toBeFalse();
    });

    it("returns false for an empty or undefined key without throwing", () => {
        prepare();

        expect(translate.hasTranslationKey("")).toBeFalse();
        expect(() => translate.hasTranslationKey(undefined as unknown as string)).not.toThrow();
        expect(translate.hasTranslationKey(undefined as unknown as string)).toBeFalse();
    });

    it("returns the same result for repeated calls (handler stays uninvoked)", () => {
        prepare();

        expect(translate.hasTranslationKey("HELLO")).toBeTrue();
        expect(translate.hasTranslationKey("HELLO")).toBeTrue();
        expect(translate.hasTranslationKey("MISSING")).toBeFalse();
        expect(translate.hasTranslationKey("MISSING")).toBeFalse();
        expect(handler.calls).toEqual(0);
    });
});

describe("TranslateService.hasTranslationKey (hierarchical)", () => {
    it("bubbles the lookup up the parent service chain", () => {
        const { root: _root, child } = createRootAndChild();

        // Child's own store is empty; the key resolves in the root
        expect(child.hasTranslationKey("HELLO")).toBeTrue();
        expect(child.hasTranslationKey("MISSING_EVERYWHERE")).toBeFalse();
    });

    it("sees child-local translations that the parent cannot see", () => {
        const { root, child } = createRootAndChild();

        // The child's current language is the root's ("en"); writing on the
        // child stores into the child's own store for that language
        child.setTranslation("en", { CHILD_KEY: "Child value" });

        expect(child.hasTranslationKey("CHILD_KEY")).toBeTrue();
        expect(root.hasTranslationKey("CHILD_KEY")).toBeFalse();
    });
});
