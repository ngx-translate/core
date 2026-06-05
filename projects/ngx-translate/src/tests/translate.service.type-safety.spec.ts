import { TestBed } from "@angular/core/testing"
import { provideTranslateLoader, TranslateService, TranslationObject } from "../public-api"
import { provideTestableTranslateService, FakeLoader } from "./test-helpers"

const translations: TranslationObject = {a: "A", b: {"a": "BA", "b": "BB"}, c: "C"}
type MyKeys = "a" | "b.a" | "b.b" | "c";

describe('Checking key-typed TranslateService', () => {
    it('should not have typescript errors', () => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({
                    loader: provideTranslateLoader(FakeLoader),
                }),
            ],
        });
        const translate = TestBed.inject<TranslateService<MyKeys>>(TranslateService<MyKeys>);
        translate.setTranslation("en", translations);
        translate.use("en");

        translate.instant('a');
        translate.stream('b.a');
        translate.get('b.b');

        // @ts-expect-error
        translate.get('c.c');
        // @ts-expect-error
        translate.get('b');

        expect(translate.instant('a')).toBe("A");
    })
})