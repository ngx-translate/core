import { Injector, ValueProvider } from "@angular/core";
import { Observable, of } from "rxjs";
import {
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslateServiceConfig,
    TRANSLATE_SERVICE_CONFIG,
    TranslationObject,
} from "../public-api";

/** Succeeds for en/fr/de and records which languages were requested. */
class RecordingDictLoader implements TranslateLoader {
    readonly requested: string[] = [];

    getTranslation(lang: string): Observable<TranslationObject> {
        this.requested.push(lang);
        const translations: Record<string, TranslationObject> = {
            en: { TEST: "This is a test" },
            fr: { TEST: "C'est un test" },
            de: { DE_ONLY: "Nur Deutsch" },
        };
        return of(translations[lang] ?? {});
    }
}

function buildService(
    loader: RecordingDictLoader,
    config: Parameters<typeof provideTranslateService>[0] = {},
): TranslateService {
    const injector = Injector.create({
        providers: [
            provideTranslateService({
                loader: { provide: TranslateLoader, useValue: loader },
                ...config,
            }),
        ],
    });
    return injector.get(TranslateService);
}

describe("provideTranslateService({ langs })", () => {
    beforeEach(() => {
        spyOn(console, "warn");
    });

    it("forwards langs to the TRANSLATE_SERVICE_CONFIG provider", () => {
        const providers = provideTranslateService({ langs: ["de", "en"] });
        const configProvider = providers.find(
            (provider) => (provider as ValueProvider).provide === TRANSLATE_SERVICE_CONFIG,
        ) as ValueProvider;
        const config = configProvider.useValue as TranslateServiceConfig;
        expect(config.langs).toEqual(["de", "en"]);
    });

    it("registers declared langs in the store at construction time", () => {
        const loader = new RecordingDictLoader();
        const svc = buildService(loader, { langs: ["de", "en"] });

        expect(svc.getLangs()).toEqual(["de", "en"]);
    });

    it("only registers the languages — it does not trigger any load", () => {
        const loader = new RecordingDictLoader();
        const svc = buildService(loader, { langs: ["de", "en"] });

        expect(loader.requested).toEqual([]);
        expect(svc.isLoading()).toBe(false);
        expect(svc.getTranslations("de")).toBeUndefined();
    });

    it("dedupes repeated entries like addLangs() does", () => {
        const loader = new RecordingDictLoader();
        const svc = buildService(loader, { langs: ["en", "de", "en"] });

        expect(svc.getLangs()).toEqual(["en", "de"]);
    });

    it("leaves the langs store empty when omitted or set to an empty array", () => {
        const loader = new RecordingDictLoader();
        const omitted = buildService(loader);
        expect(omitted.getLangs()).toEqual([]);

        const empty = buildService(loader, { langs: [] });
        expect(empty.getLangs()).toEqual([]);
    });

    it("replaces the provideAppInitializer addLangs pattern (#1581)", (done) => {
        const loader = new RecordingDictLoader();
        const svc = buildService(loader, {
            langs: ["de", "en"],
            fallbackLang: "en",
            lang: "en",
        });

        expect(svc.getLangs()).toEqual(["de", "en"]);
        svc.get("TEST").subscribe((res) => {
            expect(res).toEqual("This is a test");
            expect(svc.getCurrentLang()).toBe("en");
            done();
        });
    });

    it("falls back to the fallbackLang for keys missing from the active declared lang", (done) => {
        const loader = new RecordingDictLoader();
        const svc = buildService(loader, {
            langs: ["de", "en"],
            fallbackLang: "en",
            lang: "de",
        });

        // "TEST" only exists in "en"; current lang is "de".
        svc.get("TEST").subscribe((res) => {
            expect(res).toEqual("This is a test");
            done();
        });
    });

    it("lets use() activate a declared lang afterwards", (done) => {
        const loader = new RecordingDictLoader();
        const svc = buildService(loader, { langs: ["de", "en"], fallbackLang: "en" });

        svc.use("de").subscribe({
            next: () => {
                expect(svc.getCurrentLang()).toBe("de");
                svc.get("DE_ONLY").subscribe((res) => {
                    expect(res).toEqual("Nur Deutsch");
                    done();
                });
            },
            error: () => done.fail("de load should succeed"),
        });
    });
});
