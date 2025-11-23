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
    provideTranslateLoader,
} from "../public-api";
import { provideTestableTranslateService, TestableTranslateService } from "./test-helpers";

const translations: TranslationObject = { TEST: "This is a test" };

@Injectable()
class FakeLoader implements TranslateLoader {
    getTranslation(): Observable<TranslationObject> {
        return of(translations);
    }
}

describe("TranslateLoader", () => {
    let translate: TestableTranslateService;

    it("should be able to provide TranslateStaticLoader", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({ loader: provideTranslateLoader(FakeLoader) }),
            ],
        });
        translate = TestBed.inject(TranslateService) as TestableTranslateService;

        expect(translate).toBeDefined();
        expect(translate.getCurrentLoader()).toBeDefined();
        expect(translate.getCurrentLoader() instanceof FakeLoader).toBeTruthy();

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
                provideTestableTranslateService({ loader: provideTranslateLoader(CustomLoader) }),
            ],
        });
        translate = TestBed.inject(TranslateService) as TestableTranslateService;

        expect(translate).toBeDefined();
        expect(translate.getCurrentLoader()).toBeDefined();
        expect(translate.getCurrentLoader() instanceof CustomLoader).toBeTruthy();

        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use("en");

        // this will request the translation from the CustomLoader
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is also a test");
        });
    });

    it("TranslateNoOpLoader should return empty object", () => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({
                    loader: provideTranslateLoader(TranslateNoOpLoader),
                }),
            ],
        });
        translate = TestBed.inject(TranslateService) as TestableTranslateService;

        expect(translate).toBeDefined();
        expect(translate.getCurrentLoader()).toBeDefined();
        expect(translate.getCurrentLoader() instanceof TranslateNoOpLoader).toBeTruthy();

        translate.use("en").subscribe((res: InterpolatableTranslationObject) => {
            expect(res as object).toEqual({});
        });
    });
});
