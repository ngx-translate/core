import { EnvironmentInjector, Injector } from "@angular/core";
import { Observable, of } from "rxjs";
import {
    provideChildTranslateService,
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

class FakeLoader implements TranslateLoader {
    constructor(private translations: TranslationObject) {}
    getTranslation(): Observable<TranslationObject> {
        return of(this.translations);
    }
}

describe("TranslateService Hierarchy", () => {
    it("should bubble up translation lookup (C -> B -> A)", () => {
        // 1. Root Service (A)
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({
                            ROOT_KEY: "root-val",
                            COMMON_KEY: "root-common",
                        }),
                    },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);
        rootService.use("en");

        // 2. Child Service (B)
        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({
                            CHILD_KEY: "child-val",
                            COMMON_KEY: "child-common",
                        }),
                    },
                }),
            ],
            parent: rootInjector,
        });
        const childService = childInjector.get(TranslateService);

        // 3. Grandchild Service (C)
        const grandchildInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ GRANDCHILD_KEY: "grandchild-val" }),
                    },
                }),
            ],
            parent: childInjector,
        });
        const grandchildService = grandchildInjector.get(TranslateService);

        // Verify root
        expect(rootService.instant("ROOT_KEY")).toBe("root-val");
        expect(rootService.instant("CHILD_KEY")).toBe("CHILD_KEY");

        // Verify child
        expect(childService.instant("CHILD_KEY")).toBe("child-val");
        expect(childService.instant("ROOT_KEY")).toBe("root-val"); // bubbles up
        expect(childService.instant("COMMON_KEY")).toBe("child-common"); // shadowed

        // Verify grandchild
        expect(grandchildService.instant("GRANDCHILD_KEY")).toBe("grandchild-val");
        expect(grandchildService.instant("CHILD_KEY")).toBe("child-val"); // bubbles up to B
        expect(grandchildService.instant("ROOT_KEY")).toBe("root-val"); // bubbles up to A
    });

    it("should delegate language changes to root", () => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    lang: "en",
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);

        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
            parent: rootInjector,
        });
        const childService = childInjector.get(TranslateService);

        expect(rootService.getCurrentLang()).toBe("en");
        expect(childService.getCurrentLang()).toBe("en");

        childService.use("fr");

        expect(rootService.getCurrentLang()).toBe("fr");
        expect(childService.getCurrentLang()).toBe("fr");
    });

    it("should maintain sibling isolation", () => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ ROOT: "root" }),
                    },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);
        rootService.use("en");

        const sibling1Injector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ SIB1: "sib1" }),
                    },
                }),
            ],
            parent: rootInjector,
        });
        const sib1Service = sibling1Injector.get(TranslateService);

        const sibling2Injector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ SIB2: "sib2" }),
                    },
                }),
            ],
            parent: rootInjector,
        });
        const sib2Service = sibling2Injector.get(TranslateService);

        expect(sib1Service.instant("SIB1")).toBe("sib1");
        expect(sib1Service.instant("ROOT")).toBe("root");
        expect(sib1Service.instant("SIB2")).toBe("SIB2"); // No access to sibling

        expect(sib2Service.instant("SIB2")).toBe("sib2");
        expect(sib2Service.instant("ROOT")).toBe("root");
        expect(sib2Service.instant("SIB1")).toBe("SIB1"); // No access to sibling
    });

    it("should share currentLang signal reference between parent and child", () => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    lang: "en",
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ TEST: "test" }),
                    },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);

        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
            parent: rootInjector,
        });
        const childService = childInjector.get(TranslateService);

        expect(childService.currentLang).toBe(rootService.currentLang);
        expect(childService.fallbackLang).toBe(rootService.fallbackLang);
    });

    it("should traverse parent with explicit lang parameter", () => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ ROOT_KEY: "root-val" }),
                    },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);
        rootService.use("en");

        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ CHILD_KEY: "child-val" }),
                    },
                }),
            ],
            parent: rootInjector,
        });
        const childService = childInjector.get(TranslateService);

        // Child doesn't have ROOT_KEY, parent does — should traverse with explicit lang
        expect(childService.instant("ROOT_KEY", undefined, "en")).toEqual("root-val");
    });

    it("child.instant(_, _, lang) does not warn when ancestor has the lang loaded", () => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ GREETING: "Hallo" }),
                    },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);
        rootService.setTranslation("de", { GREETING: "Hallo" });

        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ GREETING: "Hello" }),
                    },
                }),
            ],
            parent: rootInjector,
        });
        const childService = childInjector.get(TranslateService);
        childService.setTranslation("en", { GREETING: "Hello" });

        const warnSpy = spyOn(console, "warn");

        const result = childService.instant("GREETING", undefined, "de");

        expect(result).toBe("Hallo");
        expect(warnSpy).not.toHaveBeenCalledWith(
            jasmine.stringContaining("no translations are loaded"),
        );
    });

    it("child.stream(_, _, lang) re-emits when ancestor store updates that lang", (done) => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({}),
                    },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);

        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({}),
                    },
                }),
            ],
            parent: rootInjector,
        });
        const childService = childInjector.get(TranslateService);

        const emissions: unknown[] = [];

        childService.stream("GREETING", undefined, "de").subscribe((val) => {
            emissions.push(val);
        });

        // Trigger root to update "de" — child's stream must pick this up
        rootService.setTranslation("de", { GREETING: "Hallo" });

        expect(emissions).toContain("Hallo");
        done();
    });

    it("should propagate parent translation changes to child translate() signal", () => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new FakeLoader({ KEY: "root-value" }),
                    },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);
        rootService.use("en");

        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
            parent: rootInjector,
        });
        const childService = childInjector.get(TranslateService);

        expect(childService.instant("KEY")).toBe("root-value");

        rootService.setTranslation("en", { KEY: "updated-value" });

        expect(childService.instant("KEY")).toBe("updated-value");
    });

    it("completes child store translationChange$ when child injector is destroyed", (done) => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
        });

        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
            parent: rootInjector,
        });
        const childService = childInjector.get(TranslateService);

        // onTranslationChange proxies the child's own store.translationChange$
        let completed = false;
        childService.onTranslationChange.subscribe({
            complete: () => {
                completed = true;
                expect(completed).toBeTrue();
                done();
            },
        });

        // Destroying the child injector fires DestroyRef.onDestroy() on the child
        // store, which completes _translationChange$. The root is unaffected.
        // Cast: Angular <20 typed Injector.create() as Injector (no .destroy());
        // the runtime instance is an EnvironmentInjector on every supported version.
        (childInjector as EnvironmentInjector).destroy();
    });
});
