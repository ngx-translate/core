import { EnvironmentInjector, Injector } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Observable, of, Subject } from "rxjs";
import {
    MissingTranslationHandler,
    provideChildTranslateService,
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

describe("ordered fallback languages (#789)", () => {
    let service: TranslateService;
    let missing: jasmine.Spy;

    beforeEach(() => {
        missing = jasmine.createSpy("missing").and.returnValue("Missing");
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    missingTranslationHandler: {
                        provide: MissingTranslationHandler,
                        useValue: { handle: missing },
                    },
                }),
            ],
        });
        service = TestBed.inject(TranslateService);
        service.setTranslation("fr.customer", { WHEEL: "Cercle", EMPTY: "", NULL: null });
        service.setTranslation("fr", { WHEEL: "Roue", HELLO: "Bonjour {{name}}", NULL: null });
        service.setTranslation("en", { HELLO: "Hello", SAVE: "Save", NULL: "Present" });
        service.use("fr.customer");
        service.setFallbackLangs(["fr", "en"]);
    });

    it("resolves current language, each fallback, then the missing handler", async () => {
        expect(
            service.instant(["WHEEL", "HELLO", "SAVE", "EMPTY", "NULL"], { name: "Ada" }),
        ).toEqual({
            WHEEL: "Cercle",
            HELLO: "Bonjour Ada",
            SAVE: "Save",
            EMPTY: "",
            NULL: "Present",
        });
        expect(await service.getAsync("SAVE")).toBe("Save");
        expect(service.hasTranslationKey("SAVE")).toBeTrue();
        expect(service.hasTranslationKey("UNKNOWN")).toBeFalse();
        expect(missing).not.toHaveBeenCalled();
        expect(service.instant("UNKNOWN")).toBe("Missing");
        expect(missing).toHaveBeenCalledTimes(1);
    });

    it("keeps explicit-language lookups outside the fallback chain", async () => {
        expect(service.instant("SAVE", undefined, "fr")).toBe("Missing");
        expect(await service.getAsync("SAVE", undefined, "fr")).toBe("Missing");
        expect(service.hasTranslationKey("SAVE", "fr")).toBeFalse();
    });

    it("copies and deduplicates the chain while preserving its order", () => {
        const languages = ["en", "fr", "en"];
        service.setFallbackLangs(languages);
        languages.reverse();
        languages.push("de");
        expect(service.getFallbackLangs()).toEqual(["en", "fr"]);
        expect(service.getFallbackLang()).toBe("en");
        expect(service.fallbackLang()).toBe("en");
        expect(service.fallbackLangs()).toEqual(["en", "fr"]);
        expect(service.instant("HELLO")).toBe("Hello");
    });

    it("preserves the singular return value and event shape, replacing the full chain", () => {
        const event = jasmine.createSpy("fallback event");
        service.onFallbackLangChange.subscribe(event);
        service.setFallbackLang("en").subscribe((translations) => {
            expect(translations["SAVE"] as string).toBe("Save");
        });
        expect(service.getFallbackLangs()).toEqual(["en"]);
        expect(event).toHaveBeenCalledOnceWith({
            lang: "en",
            translations: { HELLO: "Hello", SAVE: "Save", NULL: "Present" },
        });
    });

    it("refreshes signals and observers for secondary fallback changes and reordering", () => {
        const translated = service.translate("SAVE");
        const refreshed: unknown[] = [];
        service.onTranslationRefresh.subscribe(() => refreshed.push(service.instant("SAVE")));
        expect(translated()).toBe("Save");
        service.setTranslation("en", { SAVE: "Save now" });
        expect(translated()).toBe("Save now");
        expect(refreshed).toEqual(["Save now"]);
        service.setTranslation("de", { SAVE: "Speichern" });
        expect(refreshed).toEqual(["Save now"]);
        service.setFallbackLangs(["fr", "de", "en"]);
        expect(translated()).toBe("Speichern");
        expect(refreshed).toEqual(["Save now", "Speichern"]);
        service.deleteLanguage("de");
        expect(translated()).toBe("Save now");
    });

    it("clears the chain and notifies observers", () => {
        const event = jasmine.createSpy("fallback event");
        service.onFallbackLangChange.subscribe(event);
        const translated = service.translate("SAVE");
        expect(translated()).toBe("Save");
        service.setFallbackLangs([]).subscribe((translations) => expect(translations).toEqual([]));
        expect(service.getFallbackLangs()).toEqual([]);
        expect(service.getFallbackLang()).toBeNull();
        expect(translated()).toBe("Missing");
        expect(event).toHaveBeenCalledOnceWith({ lang: "", langs: [], translations: {} });
    });
});

describe("fallback chain loading", () => {
    let service: TranslateService;
    let loads: Map<string, Subject<TranslationObject>>;
    let loader: jasmine.Spy<TranslateLoader["getTranslation"]>;

    beforeEach(() => {
        loads = new Map();
        loader = jasmine.createSpy("getTranslation").and.callFake((lang: string) => {
            const pending = new Subject<TranslationObject>();
            loads.set(lang, pending);
            return pending;
        });
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: { getTranslation: loader } },
                }),
            ],
        });
        service = TestBed.inject(TranslateService);
        service.setTranslation("fr.customer", {});
        service.use("fr.customer");
        spyOn(console, "warn");
    });

    function resolve(lang: string, translations: TranslationObject): void {
        loads.get(lang)!.next(translations);
        loads.get(lang)!.complete();
    }

    it("waits for all fallbacks, returns dictionaries in order, and shares requests", async () => {
        const result = jasmine.createSpy("result");
        service.setFallbackLangs(["fr", "en", "fr"]).subscribe(result);
        const translated = service.getAsync("SAVE");
        expect(service.isLoading()).toBeTrue();
        resolve("en", { SAVE: "Save" });
        expect(result).not.toHaveBeenCalled();
        expect(service.isLoading()).toBeTrue();
        resolve("fr", {});
        expect(service.isLoading()).toBeFalse();
        expect(result).toHaveBeenCalledOnceWith([{}, { SAVE: "Save" }]);
        expect(await translated).toBe("Save");
        expect(loader).toHaveBeenCalledTimes(2);
    });

    it("keeps the previous chain on failure and allows another attempt", () => {
        service.setTranslation("de", { SAVE: "Speichern" });
        service.setFallbackLang("de");
        const error = jasmine.createSpy("error");
        service.setFallbackLangs(["fr", "en"]).subscribe({ error });
        resolve("fr", {});
        const failure = new Error("load failed");
        loads.get("en")!.error(failure);
        expect(error).toHaveBeenCalledOnceWith(failure);
        expect(service.isLoading()).toBeFalse();
        expect(service.getFallbackLangs()).toEqual(["de"]);
        service.setFallbackLangs(["fr", "en"]);
        resolve("en", { SAVE: "Save" });
        expect(service.getFallbackLangs()).toEqual(["fr", "en"]);
        expect(service.instant("SAVE")).toBe("Save");
    });

    it("does not let an older chain replace a newer request", () => {
        service.setFallbackLangs(["fr", "en"]);
        service.setFallbackLangs(["de", "en"]);
        resolve("en", { SAVE: "Save" });
        resolve("de", { SAVE: "Speichern" });
        resolve("fr", { SAVE: "Enregistrer" });
        expect(service.getFallbackLangs()).toEqual(["de", "en"]);
        expect(service.instant("SAVE")).toBe("Speichern");
    });

    it("does not restore a cleared chain when its loads finish", () => {
        service.setFallbackLangs(["fr", "en"]);
        service.setFallbackLangs([]);
        resolve("fr", {});
        resolve("en", { SAVE: "Save" });
        expect(service.getFallbackLangs()).toEqual([]);
        expect(service.instant("SAVE")).toBe("SAVE");
    });

    for (const completedFirst of [false, true]) {
        it(`does not activate a chain containing a deleted language (loaded: ${completedFirst})`, () => {
            service.setTranslation("de", {});
            service.setFallbackLang("de");
            const event = jasmine.createSpy("event");
            service.onFallbackLangChange.subscribe(event);
            service.setFallbackLangs(["fr", "en"]);
            if (completedFirst) resolve("fr", {});
            service.deleteLanguage("fr");
            resolve("en", { SAVE: "Save" });
            expect(service.getFallbackLangs()).toEqual(["de"]);
            expect(service.getTranslations("fr")).toBeUndefined();
            expect(event).not.toHaveBeenCalled();
        });
    }

    it("resolves pending lookups after one fallback is deleted", async () => {
        service.setFallbackLangs(["fr", "en"]);
        const translated = service.getAsync("SAVE");
        service.deleteLanguage("fr");
        resolve("en", { SAVE: "Save" });
        expect(await translated).toBe("Save");
    });

    it("does not wait for fallback loads for an explicit-language lookup", async () => {
        service.setFallbackLangs(["fr", "en"]);
        expect(await service.getAsync("SAVE", undefined, "fr.customer")).toBe("SAVE");
    });

    it("settles lookups when the last pending loader completes without a value", async () => {
        service.setFallbackLangs(["fr", "en"]);
        const translated = service.getAsync("SAVE");
        resolve("en", { SAVE: "Save" });
        loads.get("fr")!.complete();
        expect(await translated).toBe("Save");
        expect(service.isLoading()).toBeFalse();
    });

    it("retries a failed fallback using the existing retry policy", fakeAsync(() => {
        let attempts = 0;
        const injector = Injector.create({
            providers: [
                provideTranslateService({
                    retry: 1,
                    fallbackLangs: ["fr", "en"],
                    loader: {
                        provide: TranslateLoader,
                        useValue: {
                            getTranslation: (lang: string) =>
                                new Observable<TranslationObject>((subscriber) => {
                                    if (lang === "en" && ++attempts === 1)
                                        subscriber.error(new Error("retry"));
                                    else {
                                        subscriber.next(lang === "en" ? { SAVE: "Save" } : {});
                                        subscriber.complete();
                                    }
                                }),
                        },
                    },
                }),
            ],
        });
        const retried = injector.get(TranslateService);
        expect(retried.isLoading()).toBeTrue();
        tick(100);
        expect(attempts).toBe(2);
        expect(retried.isLoading()).toBeFalse();
        expect(retried.instant("SAVE")).toBe("Save");
        // Angular <20 types Injector.create() as Injector, without destroy().
        (injector as EnvironmentInjector).destroy();
    }));
});

describe("fallback chain configuration and hierarchy", () => {
    it("loads the configured chain and gives it precedence over the singular option", () => {
        const loader = jasmine.createSpy("getTranslation").and.returnValue(of({}));
        const injector = Injector.create({
            providers: [
                provideTranslateService({
                    fallbackLang: "de",
                    fallbackLangs: ["fr", "en"],
                    loader: { provide: TranslateLoader, useValue: { getTranslation: loader } },
                }),
            ],
        });
        expect(injector.get(TranslateService).getFallbackLangs()).toEqual(["fr", "en"]);
        expect(loader.calls.allArgs()).toEqual([["fr"], ["en"]]);
        (injector as EnvironmentInjector).destroy();
        const empty = Injector.create({
            providers: [provideTranslateService({ fallbackLang: "de", fallbackLangs: [] })],
        });
        expect(empty.get(TranslateService).getFallbackLang()).toBeNull();
        (empty as EnvironmentInjector).destroy();
    });

    it("loads every fallback in connected children, delegates changes, and isolates subtrees", () => {
        const root = Injector.create({
            providers: [
                provideTranslateService({ lang: "fr.customer", fallbackLangs: ["fr", "en"] }),
            ],
        });
        const parent = root.get(TranslateService);
        parent.setTranslation("fr.customer", { SAVE: "Root current", PARENT: "Parent" });
        const loader = jasmine
            .createSpy("child loader")
            .and.callFake((lang: string) => of(lang === "en" ? { SAVE: "Child fallback" } : {}));
        const childInjector = Injector.create({
            parent: root,
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: { getTranslation: loader } },
                }),
            ],
        });
        const child = childInjector.get(TranslateService);
        expect(loader.calls.allArgs()).toEqual([["fr.customer"], ["fr"], ["en"]]);
        expect(child.instant("SAVE")).toBe("Child fallback");
        expect(child.instant("PARENT")).toBe("Parent");
        expect(child.fallbackLangs).toBe(parent.fallbackLangs);
        const isolatedInjector = Injector.create({
            parent: root,
            providers: [provideTranslateService({ fallbackLangs: ["it"] })],
        });
        const isolated = isolatedInjector.get(TranslateService);
        child.setFallbackLangs(["de", "en"]);
        expect(parent.getFallbackLangs()).toEqual(["de", "en"]);
        expect(child.getFallbackLangs()).toEqual(["de", "en"]);
        expect(loader).toHaveBeenCalledWith("de");
        expect(isolated.getFallbackLangs()).toEqual(["it"]);
        expect(isolated.instant("PARENT")).toBe("PARENT");
        child.setFallbackLangs([]);
        expect(loader).not.toHaveBeenCalledWith("");
        (isolatedInjector as EnvironmentInjector).destroy();
        (childInjector as EnvironmentInjector).destroy();
        (root as EnvironmentInjector).destroy();
    });

    it("waits for child fallbacks started by a parent event", async () => {
        const rootLoads = new Map<string, Subject<TranslationObject>>();
        const root = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: {
                            getTranslation: (lang: string) => {
                                const load = new Subject<TranslationObject>();
                                rootLoads.set(lang, load);
                                return load;
                            },
                        },
                    },
                }),
            ],
        });
        const parent = root.get(TranslateService);
        parent.setTranslation("fr.customer", {});
        parent.use("fr.customer");
        const loads = new Map<string, Subject<TranslationObject>>();
        const childInjector = Injector.create({
            parent: root,
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: {
                            getTranslation: (lang: string) => {
                                if (lang === "fr.customer") return of({});
                                const load = new Subject<TranslationObject>();
                                loads.set(lang, load);
                                return load;
                            },
                        },
                    },
                }),
            ],
        });
        const child = childInjector.get(TranslateService);
        parent.setFallbackLangs(["fr", "en"]);
        const translated = child.getAsync("SAVE");
        expect(loads.size).toBe(0);
        rootLoads.get("en")!.next({ SAVE: "Parent English" });
        rootLoads.get("en")!.complete();
        rootLoads.get("fr")!.next({});
        rootLoads.get("fr")!.complete();
        loads.get("en")!.next({ SAVE: "Child English" });
        loads.get("en")!.complete();
        loads.get("fr")!.next({});
        loads.get("fr")!.complete();
        expect(await translated).toBe("Child English");
        (childInjector as EnvironmentInjector).destroy();
        (root as EnvironmentInjector).destroy();
    });
});
