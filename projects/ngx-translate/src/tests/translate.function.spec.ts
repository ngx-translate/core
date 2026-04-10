import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import {
    provideTranslateLoader,
    provideTranslateService,
    translate,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

const translations: Record<string, TranslationObject> = {
    en: {
        HELLO: "Hello",
        GREETING: "Hello {{name}}",
        NESTED: {
            KEY: "Nested value",
        },
    },
    de: {
        HELLO: "Hallo",
        GREETING: "Hallo {{name}}",
    },
};

class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        return of(translations[lang] ?? {});
    }
}

describe("translate() standalone function", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: provideTranslateLoader(FakeLoader),
                    lang: "en",
                }),
            ],
        });

        // Trigger translation loading
        const service = TestBed.inject(TranslateService);
        service.use("en");
    });

    it("should resolve a static key", () => {
        TestBed.runInInjectionContext(() => {
            const result = translate("HELLO");
            TestBed.flushEffects();
            expect(result()).toBe("Hello");
        });
    });

    it("should interpolate params", () => {
        TestBed.runInInjectionContext(() => {
            const result = translate("GREETING", { name: "World" });
            TestBed.flushEffects();
            expect(result()).toBe("Hello World");
        });
    });

    it("should resolve nested keys", () => {
        TestBed.runInInjectionContext(() => {
            const result = translate("NESTED.KEY");
            TestBed.flushEffects();
            expect(result()).toBe("Nested value");
        });
    });

    it("should return the key when translation is missing", () => {
        TestBed.runInInjectionContext(() => {
            const result = translate("MISSING");
            TestBed.flushEffects();
            expect(result()).toBe("MISSING");
        });
    });

    it("should react to signal key changes", () => {
        TestBed.runInInjectionContext(() => {
            const key = signal("HELLO");
            const result = translate(key);
            TestBed.flushEffects();
            expect(result()).toBe("Hello");

            key.set("GREETING");
            TestBed.flushEffects();
            // No params, so interpolation placeholder stays
            expect(result()).toBe("Hello {{name}}");
        });
    });

    it("should react to signal param changes", () => {
        TestBed.runInInjectionContext(() => {
            const params = signal<Record<string, string>>({ name: "Alice" });
            const result = translate("GREETING", params);
            TestBed.flushEffects();
            expect(result()).toBe("Hello Alice");

            params.set({ name: "Bob" });
            TestBed.flushEffects();
            expect(result()).toBe("Hello Bob");
        });
    });

    it("should return translation from specified language", () => {
        const service = TestBed.inject(TranslateService);
        service.setFallbackLang("de");
        TestBed.runInInjectionContext(() => {
            const result = translate("HELLO", undefined, "de");
            TestBed.flushEffects();
            expect(result()).toBe("Hallo");
        });
    });

    it("should react to lang signal changes", () => {
        const service = TestBed.inject(TranslateService);
        service.setFallbackLang("de");
        TestBed.runInInjectionContext(() => {
            const lang = signal("de");
            const result = translate("HELLO", undefined, lang);
            TestBed.flushEffects();
            expect(result()).toBe("Hallo");

            lang.set("en");
            TestBed.flushEffects();
            expect(result()).toBe("Hello");
        });
    });
});
