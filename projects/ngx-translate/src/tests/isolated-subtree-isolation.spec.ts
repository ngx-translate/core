import { Injector } from "@angular/core";
import { Observable, of } from "rxjs";
import {
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

class FakeLoader implements TranslateLoader {
    constructor(private translations: TranslationObject = {}) {}
    getTranslation(): Observable<TranslationObject> {
        return of(this.translations);
    }
}

/**
 * An "isolated subtree" is a nested `provideTranslateService()` (not
 * `provideChildTranslateService()`). Both ends of the nesting are configured
 * as roots; the inner subtree must NOT see events, lookups, or language state
 * from its outer ancestor.
 */
describe("Isolated subtree isolation", () => {
    function setup() {
        const outerInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader() },
                }),
            ],
        });
        const outerService = outerInjector.get(TranslateService);

        const innerInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader() },
                }),
            ],
            parent: outerInjector,
        });
        const innerService = innerInjector.get(TranslateService);

        return { outerService, innerService };
    }

    it("inner.stream() does not emit when outer setTranslation updates the same lang", () => {
        const { outerService, innerService } = setup();

        innerService.setTranslation("en", {}, true);

        const emissions: unknown[] = [];
        innerService.stream("greeting", undefined, "en").subscribe((value) => {
            emissions.push(value);
        });

        // Snapshot the initial emission (inner has no "greeting" — key fallback).
        const initialCount = emissions.length;

        outerService.setTranslation("en", { greeting: "Hello" }, true);

        // The inner stream MUST NOT re-emit because of an outer-store change.
        expect(emissions.length).toBe(initialCount);
    });

    it("inner.instant(KEY, _, lang) does not borrow lookups from outer", () => {
        const { outerService, innerService } = setup();

        outerService.setTranslation("en", { greeting: "Hello" }, true);
        innerService.setTranslation("en", {}, true);

        // Inner has an "en" store, but no "greeting" key. It must NOT walk into the outer
        // store and return "Hello"; it must fall back to the key.
        expect(innerService.instant("greeting", undefined, "en")).toBe("greeting");
    });

    it("inner and outer have independent language state", () => {
        const { outerService, innerService } = setup();

        outerService.use("en");
        expect(outerService.getCurrentLang()).toBe("en");
        // Inner subtree owns its own currentLang — must be null until inner.use().
        expect(innerService.getCurrentLang()).toBeNull();

        innerService.use("fr");
        expect(innerService.getCurrentLang()).toBe("fr");
        // Outer must be unaffected by inner.use().
        expect(outerService.getCurrentLang()).toBe("en");
    });
});
