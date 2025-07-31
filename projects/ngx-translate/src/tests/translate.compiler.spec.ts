import { Injectable } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Observable, of } from "rxjs";
import {
    InterpolatableTranslationObject,
    TranslateCompiler,
    TranslateLoader,
    TranslateNoOpCompiler,
    TranslateService,
    Translation,
    TranslationObject,
    provideTranslateCompiler,
    provideTranslateLoader,
    provideTranslateService,
} from "../public-api";

const translations: TranslationObject = { LOAD: "This is a test" };

@Injectable()
class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        void lang;
        return of(translations);
    }
}

describe("TranslateCompiler", () => {
    let translate: TranslateService;

    describe("with default TranslateNoOpCompiler", () => {
        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService(),
                    provideTranslateLoader(FakeLoader),
                    provideTranslateCompiler(TranslateNoOpCompiler),
                ],
            });
            translate = TestBed.inject(TranslateService);

            translate.use("en");
        });

        it("should use the correct compiler", () => {
            expect(translate).toBeDefined();
            expect(translate.compiler).toBeDefined();
            expect(translate.compiler instanceof TranslateNoOpCompiler).toBeTruthy();
        });

        it("should use the compiler on loading translations", () => {
            translate.get("LOAD").subscribe((res: Translation) => {
                expect(res).toBe("This is a test");
            });
        });

        it("should use the compiler on manually adding a translation object", () => {
            translate.setTranslation("en", { "SET-TRANSLATION": "A manually added translation" });
            expect(translate.instant("SET-TRANSLATION")).toBe("A manually added translation");
        });

        it("should use the compiler on manually adding a single translation", async () => {
            await translate.set("SET", "Another manually added translation", "en");
            expect(translate.instant("SET")).toBe("Another manually added translation");
        });
    });

    describe("with a custom compiler implementation", () => {
        class CustomCompiler implements TranslateCompiler {
            compile(value: string, lang: string): string {
                void lang;
                return value + "|compiled";
            }

            compileTranslations(
                translation: InterpolatableTranslationObject,
                lang: string,
            ): InterpolatableTranslationObject {
                void lang;
                return Object.keys(translation).reduce(
                    (acc: InterpolatableTranslationObject, key) => {
                        acc[key] = () => translation[key] + "|compiled";
                        return acc;
                    },
                    {},
                );
            }
        }

        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({}),
                    provideTranslateLoader(FakeLoader),
                    provideTranslateCompiler(CustomCompiler),
                ],
            });
            translate = TestBed.inject(TranslateService);

            translate.use("en");
        });

        it("should use the correct compiler", () => {
            expect(translate).toBeDefined();
            expect(translate.compiler).toBeDefined();
            expect(translate.compiler instanceof CustomCompiler).toBeTruthy();
        });

        it("should use the compiler on loading translations", () => {
            translate.get("LOAD").subscribe((res: Translation) => {
                expect(res).toBe("This is a test|compiled");
            });
        });

        it("should use the compiler on manually adding a translation object", () => {
            translate.setTranslation("en", { "SET-TRANSLATION": "A manually added translation" });
            expect(translate.instant("SET-TRANSLATION")).toBe(
                "A manually added translation|compiled",
            );
        });

        it("should use the compiler on manually adding a single translation", async () => {
            await translate.set("SET", "Another manually added translation", "en");
            expect(translate.instant("SET")).toBe("Another manually added translation|compiled");
        });
    });
});
