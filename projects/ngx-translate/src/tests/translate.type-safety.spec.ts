import { TestBed } from "@angular/core/testing"
import { provideTranslateLoader, TranslatePipe, TranslateService, TranslationObject } from "../public-api"
import { provideTestableTranslateService, FakeLoader } from "./test-helpers"

const translations: TranslationObject = {a: "A", b: {"a": "BA", "b": "BB"}, c: "C"}
type MyKeys = "a" | "b.a" | "b.b" | "c";

describe('Key type safety tests', () => {
    it('should not have typescript errors when using TranslateService', () => {
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

    it('should not have typescript errors when using TranslatePipe', () => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({
                    loader: provideTranslateLoader(FakeLoader),
                }),
                {
                    provide: TranslatePipe,
                    useClass: TranslatePipe,
                }
            ],
        });
        const translate = TestBed.inject<TranslateService<MyKeys>>(TranslateService<MyKeys>);
        const translatePipe = TestBed.inject<TranslatePipe<MyKeys>>(TranslatePipe<MyKeys>);
        translate.setTranslation("en", translations);
        translate.use("en");

        translatePipe.transform('a');
        translatePipe.transform('b.a');
        translatePipe.transform('b.b');

        // @ts-expect-error
        translatePipe.transform('c.c');
        // @ts-expect-error
        translatePipe.transform('b');

        expect(translatePipe.transform('b.a')).toBe("BA");
    })
})