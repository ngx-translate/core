import { Injector } from "@angular/core";
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

describe("Chain walk regression (root + non-isolated child + grandchild)", () => {
    function setup() {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
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

        const grandchildInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
            parent: childInjector,
        });
        const grandchildService = grandchildInjector.get(TranslateService);

        return { rootService, childService, grandchildService };
    }

    it("grandchild.stream(KEY, _, lang) emits the value the root sets", (done) => {
        const { rootService, grandchildService } = setup();
        rootService.setTranslation("en", { greeting: "Hello" }, true);

        const emissions: unknown[] = [];
        grandchildService.stream("greeting", undefined, "en").subscribe((value) => {
            emissions.push(value);
        });

        expect(emissions).toContain("Hello");
        done();
    });

    it("setTranslation on root re-emits to grandchild.stream(KEY, _, lang)", (done) => {
        const { rootService, grandchildService } = setup();
        rootService.setTranslation("en", { greeting: "Hello" }, true);

        const emissions: unknown[] = [];
        grandchildService.stream("greeting", undefined, "en").subscribe((value) => {
            emissions.push(value);
        });

        // Reset the captured emissions to focus on the post-subscription update.
        emissions.length = 0;
        rootService.setTranslation("en", { greeting: "Hi" }, true);

        expect(emissions).toContain("Hi");
        done();
    });

    it("grandchild.getParent() walks back to root through the chain", () => {
        const { rootService, childService, grandchildService } = setup();
        // getParent() returns the immediate parent. Walk explicitly through the chain to root.
        expect(grandchildService.getParent()).toBe(childService);
        expect(childService.getParent()).toBe(rootService);
        expect(rootService.getParent()).toBeNull();
    });

    it("getRoot() returns the topmost service in the chain", () => {
        const { rootService, childService, grandchildService } = setup();
        expect(rootService.getRoot()).toBe(rootService);
        expect(childService.getRoot()).toBe(rootService);
        expect(grandchildService.getRoot()).toBe(rootService);
    });

    it("getRoot() stops at an isolated subtree boundary", () => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);

        // Nested provideTranslateService() creates an isolated subtree — its
        // root's getParent() returns null, so getRoot() returns itself.
        const isolatedInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader({}) },
                }),
            ],
            parent: rootInjector,
        });
        const isolatedService = isolatedInjector.get(TranslateService);

        expect(isolatedService.getParent()).toBeNull();
        expect(isolatedService.getRoot()).toBe(isolatedService);
        expect(rootService.getRoot()).toBe(rootService);
    });
});
