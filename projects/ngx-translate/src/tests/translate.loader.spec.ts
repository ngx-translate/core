import { Injectable } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import {
    InterpolatableTranslationObject,
    TranslateNoOpLoader,
    TranslateLoader,
    TranslateService,
    Translation,
    TranslationObject,
    provideTranslateService,
    provideTranslateLoader,
} from "../public-api";

const translations: TranslationObject = { TEST: "This is a test" };

@Injectable()
class FakeLoader implements TranslateLoader {
    getTranslation(): Observable<TranslationObject> {
        return of(translations);
    }
}

describe("TranslateLoader", () => {
    let translate: TranslateService;

    it("should be able to provide TranslateStaticLoader", () => {
        TestBed.configureTestingModule({
            providers: [provideTranslateService({}), provideTranslateLoader(FakeLoader)],
        });
        translate = TestBed.inject(TranslateService);

        expect(translate).toBeDefined();
        expect(translate.currentLoader).toBeDefined();
        expect(translate.currentLoader instanceof FakeLoader).toBeTruthy();

        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is a test");
        });
    });

    it("should be able to provide any TranslateLoader", () => {
        class CustomLoader implements TranslateLoader {
            getTranslation(): Observable<TranslationObject> {
                return of({ TEST: "This is also a test" });
            }
        }

        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({}),
                { provide: TranslateLoader, useClass: CustomLoader },
            ],
        });
        translate = TestBed.inject(TranslateService);

        expect(translate).toBeDefined();
        expect(translate.currentLoader).toBeDefined();
        expect(translate.currentLoader instanceof CustomLoader).toBeTruthy();

        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use("en");

        // this will request the translation from the CustomLoader
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is also a test");
        });
    });

    it("TranslateNoOpLoader should return empty object", () => {
        TestBed.configureTestingModule({
            providers: [provideTranslateService(), provideTranslateLoader(TranslateNoOpLoader)],
        });
        translate = TestBed.inject(TranslateService);

        expect(translate).toBeDefined();
        expect(translate.currentLoader).toBeDefined();
        expect(translate.currentLoader instanceof TranslateNoOpLoader).toBeTruthy();

        translate.use("en").subscribe((res: InterpolatableTranslationObject) => {
            expect(res as object).toEqual({});
        });
    });
});
