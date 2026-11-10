import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Observable, timer } from "rxjs";
import { map } from "rxjs/operators";
import {
    provideTranslateLoader,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";
import { provideTestableTranslateService } from "./test-helpers";

/**
 * Regression for https://github.com/ngx-translate/core/issues/842
 */
describe("TranslateService loader vs setTranslation race (#842)", () => {
    let translate: TranslateService;

    class SlowLoader implements TranslateLoader {
        getTranslation(lang: string): Observable<TranslationObject> {
            return timer(10).pipe(
                map(() => ({
                    FROM_LOADER: `${lang}-from-loader`,
                    TEST: "loader test",
                })),
            );
        }
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({ loader: provideTranslateLoader(SlowLoader) }),
            ],
        });
        translate = TestBed.inject(TranslateService);
    });

    it("keeps setTranslation merges when the loader completes later", fakeAsync(() => {
        translate.use("en");
        translate.setTranslation("en", { FROM_MANUAL: "manual" }, true);

        expect(translate.instant("FROM_MANUAL")).toBe("manual");
        expect(translate.instant("FROM_LOADER")).toBe("FROM_LOADER");

        tick(10);

        expect(translate.instant("FROM_MANUAL")).toBe("manual");
        expect(translate.instant("FROM_LOADER")).toBe("en-from-loader");
        expect(translate.instant("TEST")).toBe("loader test");
    }));

    it("reloadLang still replaces translations when nothing was added during the load", fakeAsync(() => {
        translate.use("en");
        tick(10);

        translate.setTranslation("en", { EXTRA: "extra" }, true);
        expect(translate.instant("EXTRA")).toBe("extra");

        translate.reloadLang("en");
        tick(10);

        expect(translate.instant("TEST")).toBe("loader test");
        expect(translate.instant("EXTRA")).toBe("EXTRA");
    }));
});
