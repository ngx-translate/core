import { Injector } from "@angular/core";
import { Observable, of } from "rxjs";
import {
    provideChildTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

class FakeLoader implements TranslateLoader {
    getTranslation(): Observable<TranslationObject> {
        return of({});
    }
}

/**
 * `provideChildTranslateService()` installed without any ancestor
 * `provideTranslateService()` crashes today: the constructor and `use()`
 * dereference `this.parent` under a non-null assertion even though no
 * actual parent service exists. After Fix 1's refactor, `parent === null`
 * whenever there is no parent — regardless of the config flag — and the
 * service self-handles as a root.
 */
describe("Child service without parent (misconfigured)", () => {
    function setup() {
        const injector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: { provide: TranslateLoader, useValue: new FakeLoader() },
                }),
            ],
        });
        return injector.get(TranslateService);
    }

    it("use(lang) does not throw", () => {
        const svc = setup();
        expect(() => svc.use("en")).not.toThrow();
    });

    it("setFallbackLang(lang) does not throw", () => {
        const svc = setup();
        expect(() => svc.setFallbackLang("en")).not.toThrow();
    });

    it("getCurrentLang() does not throw and returns null initially", () => {
        const svc = setup();
        expect(() => svc.getCurrentLang()).not.toThrow();
        expect(svc.getCurrentLang()).toBeNull();
    });

    it("currentLang signal does not throw on read", () => {
        const svc = setup();
        expect(() => svc.currentLang()).not.toThrow();
    });

    it("fallbackLang signal does not throw on read", () => {
        const svc = setup();
        expect(() => svc.fallbackLang()).not.toThrow();
    });
});
