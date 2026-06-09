import { fakeAsync, tick } from "@angular/core/testing";
import { Injector } from "@angular/core";
import { Observable, timer } from "rxjs";
import { map } from "rxjs/operators";
import {
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

describe("translate() signal late async load", () => {
    // A translate() signal created BEFORE the loader resolves must re-emit the
    // translated value once the late load lands — without re-creating the signal.
    it("flips from key to translated value when the load completes", fakeAsync(() => {
        const injector = Injector.create({
            providers: [
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useValue: new DelayedLoader({ en: { TEST: "This is a test" } }),
                    },
                }),
            ],
        });
        const service = injector.get(TranslateService);
        service.use("en"); // load in flight

        const sig = service.translate("TEST");

        // Before the load resolves, the signal returns the key.
        expect(sig()).toBe("TEST");

        tick(20);

        // Same signal instance now reflects the loaded translation.
        expect(sig()).toBe("This is a test");
    }));
});
