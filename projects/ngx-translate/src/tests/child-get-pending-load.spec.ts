import { fakeAsync, tick } from "@angular/core/testing";
import { Injector } from "@angular/core";
import { Observable, timer } from "rxjs";
import { map } from "rxjs/operators";
import {
    provideChildTranslateService,
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

class DelayedLoader implements TranslateLoader {
    constructor(
        private translations: Record<string, TranslationObject>,
        private delayMs = 10,
    ) {}
    getTranslation(lang: string): Observable<TranslationObject> {
        return timer(this.delayMs).pipe(map(() => this.translations[lang] ?? {}));
    }
}

describe("child get() awaits in-flight load", () => {
    // Regression for the bug where a child service's get() never awaited its own
    // in-flight load: get() looked at `this.lastUseLanguage`, which a child never
    // sets (use() delegates to the root). The fix reads the root's requested lang.
    // The key here exists ONLY in the child's translations, so bubbling to the
    // root cannot mask a missing await.
    it("emits the child's translated value once its load completes, not the key", fakeAsync(() => {
        const rootInjector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new DelayedLoader({ en: { ROOT_KEY: "root-val" } }),
                    },
                }),
            ],
        });
        const rootService = rootInjector.get(TranslateService);
        // Optimistically sets currentLang/lastUseLanguage to "en"; load in flight.
        rootService.use("en");

        const childInjector = Injector.create({
            providers: [
                provideChildTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new DelayedLoader({ en: { CHILD_KEY: "child-val" } }),
                    },
                }),
            ],
            parent: rootInjector,
        });
        // Child constructor sees currentLang "en" and begins loading it.
        const childService = childInjector.get(TranslateService);

        const emissions: unknown[] = [];
        // Loads are still in flight at this point.
        childService.get("CHILD_KEY").subscribe((value) => emissions.push(value));

        // Nothing should have resolved synchronously to the key.
        expect(emissions).toEqual([]);

        tick(20); // resolve both loads

        expect(emissions).toEqual(["child-val"]);
    }));
});
