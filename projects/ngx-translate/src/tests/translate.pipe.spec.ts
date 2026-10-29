import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import {
    MissingTranslationHandler,
    provideTranslateLoader,
    provideTranslateService,
    TranslateLoader,
    TranslatePipe,
    TranslateService,
} from "../public-api";
import { DelayedFakeLoader } from "./test-helpers";

describe("TranslatePipe (unit)", () => {
    let translate: TranslateService;
    let translatePipe: TranslatePipe;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: provideTranslateLoader(DelayedFakeLoader),
                }),
                {
                    provide: TranslatePipe,
                    useClass: TranslatePipe,
                },
            ],
        });

        translate = TestBed.inject(TranslateService);
        translatePipe = TestBed.inject(TranslatePipe);
    });

    it("is defined", () => {
        expect(TranslatePipe).toBeDefined();
        expect(translatePipe).toBeDefined();
    });

    describe("transform()", () => {
        it("should translate a string", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.use("en");

            expect(translatePipe.transform("TEST")).toEqual("This is a test");
        });

        it("should return the translated value", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.use("en");

            const result = translatePipe.transform("TEST");
            expect(result).toEqual("This is a test");
        });

        it("should translate a string with object parameters", () => {
            translate.setTranslation("en", { TEST: "This is a test {{param}}" });
            translate.use("en");

            expect(translatePipe.transform("TEST", { param: "with param" })).toEqual(
                "This is a test with param",
            );
        });

        it("should translate a string with object as string parameters", () => {
            translate.setTranslation("en", { TEST: "This is a test {{param}}" });
            translate.use("en");

            expect(translatePipe.transform("TEST", '{param: "with param"}')).toEqual(
                "This is a test with param",
            );
            expect(translatePipe.transform("TEST", '{"param": "with param"}')).toEqual(
                "This is a test with param",
            );
            expect(translatePipe.transform("TEST", "{param: 'with param'}")).toEqual(
                "This is a test with param",
            );
            expect(translatePipe.transform("TEST", "{'param' : 'with param'}")).toEqual(
                "This is a test with param",
            );
        });

        it("should translate a string with object as multiple string parameters", () => {
            translate.setTranslation("en", { TEST: "This is a test {{param1}} {{param2}}" });
            translate.use("en");

            expect(
                translatePipe.transform("TEST", '{param1: "with param-1", param2: "and param-2"}'),
            ).toEqual("This is a test with param-1 and param-2");
            expect(
                translatePipe.transform(
                    "TEST",
                    '{"param1": "with param-1", "param2": "and param-2"}',
                ),
            ).toEqual("This is a test with param-1 and param-2");
            expect(
                translatePipe.transform("TEST", "{param1: 'with param-1', param2: 'and param-2'}"),
            ).toEqual("This is a test with param-1 and param-2");
            expect(
                translatePipe.transform(
                    "TEST",
                    "{'param1' : 'with param-1', 'param2': 'and param-2'}",
                ),
            ).toEqual("This is a test with param-1 and param-2");
        });

        it("should translate a string with object as nested string parameters", () => {
            translate.setTranslation("en", { TEST: "This is a test {{param.one}} {{param.two}}" });
            translate.use("en");

            expect(
                translatePipe.transform(
                    "TEST",
                    '{param: {one: "with param-1", two: "and param-2"}}',
                ),
            ).toEqual("This is a test with param-1 and param-2");
            expect(
                translatePipe.transform(
                    "TEST",
                    '{"param": {"one": "with param-1", "two": "and param-2"}}',
                ),
            ).toEqual("This is a test with param-1 and param-2");
            expect(
                translatePipe.transform(
                    "TEST",
                    "{param: {one: 'with param-1', two: 'and param-2'}}",
                ),
            ).toEqual("This is a test with param-1 and param-2");
            expect(
                translatePipe.transform(
                    "TEST",
                    "{'param' : {'one': 'with param-1', 'two': 'and param-2'}}",
                ),
            ).toEqual("This is a test with param-1 and param-2");
        });

        it("should update the value when the parameters change", () => {
            translate.setTranslation("en", { TEST: "This is a test {{param}}" });
            translate.use("en");

            expect(translatePipe.transform("TEST", { param: "with param" })).toEqual(
                "This is a test with param",
            );

            // same value, should return cached result
            expect(translatePipe.transform("TEST", { param: "with param" })).toEqual(
                "This is a test with param",
            );

            // different param: should return updated value
            expect(translatePipe.transform("TEST", { param: "with param2" })).toEqual(
                "This is a test with param2",
            );
        });

        it("should update when a Date parameter is replaced", () => {
            translate.setTranslation("en", { TEST: "Date: {{date}}" });
            translate.use("en");
            const first = new Date("2020-01-01T00:00:00Z");
            const second = new Date("2021-01-01T00:00:00Z");

            expect(translatePipe.transform("TEST", { date: first })).toBe(`Date: ${first}`);
            expect(translatePipe.transform("TEST", { date: second })).toBe(`Date: ${second}`);
        });

        it("should throw if you don't give an object parameter", () => {
            translate.setTranslation("en", { TEST: "This is a test {{param}}" });
            translate.use("en");
            const param = 'param: "with param"';

            expect(() => {
                translatePipe.transform("TEST", param);
            }).toThrowError(
                SyntaxError,
                `Wrong parameter in TranslatePipe. Expected a valid Object, received: ${param}`,
            );
            expect(() => translatePipe.transform("TEST", param)).toThrowMatching(
                (error) => error.cause instanceof SyntaxError,
            );
        });

        it("should return given falsy or non length query", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.use("en");

            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            expect(translatePipe.transform(null as any)).toBeNull();

            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            expect(translatePipe.transform(undefined as any)).toBeUndefined();

            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            expect(translatePipe.transform(1234 as any)).toBe(1234);
        });

        /*
        it("translate text with 'default' message id" , () => {
            prepare();

            const fixture = TestBed.createComponent(AppTranslationIdDefaultComponent);

            translate.setTranslation("en", {"default": "This is some default text"});

            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("default");
            translate.setFallbackLang('en');
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is some default text");
        });
         */
    });

    describe("explicit language", () => {
        beforeEach(() => {
            translate.setTranslation("en", { TEST: "Hello", FALLBACK_ONLY: "English fallback" });
            translate.setTranslation("fr", { TEST: "Bonjour" });
            translate.setTranslation("de", { TEST: "Hallo" });
            translate.setFallbackLang("en");
            translate.use("en");
        });

        it("should accept a language after omitted interpolation parameters", () => {
            const onLangChange = jasmine.createSpy("onLangChange");
            const subscription = translate.onLangChange.subscribe(onLangChange);

            expect(translatePipe.transform("TEST", undefined, "fr")).toBe("Bonjour");
            expect(translatePipe.transform("TEST", null, "de")).toBe("Hallo");
            expect(translate.getCurrentLang()).toBe("en");
            expect(onLangChange).not.toHaveBeenCalled();
            subscription.unsubscribe();
        });

        it("should preserve object and string interpolation parameters", () => {
            translate.setTranslation("fr", { TEST: "Bonjour {{name}}" });

            expect(translatePipe.transform("TEST", { name: "Ada" }, "fr")).toBe("Bonjour Ada");
            expect(translatePipe.transform("TEST", "{name: 'Bob'}", "fr")).toBe("Bonjour Bob");
        });

        it("should ignore trailing arguments while preserving the language and parameters", () => {
            translate.setTranslation("fr", { TEST: "Bonjour {{name}}" });

            expect(translatePipe.transform("TEST", { name: "Ada" }, "fr", "ignored", 123)).toBe(
                "Bonjour Ada",
            );
            expect(translatePipe.transform("TEST", undefined, undefined, "ignored")).toBe("Hello");
        });

        it("should update when only the language changes or the override is removed", () => {
            expect(translatePipe.transform("TEST")).toBe("Hello");
            expect(translatePipe.transform("TEST", undefined, "fr")).toBe("Bonjour");
            expect(translatePipe.transform("TEST", undefined, "de")).toBe("Hallo");
            expect(translatePipe.transform("TEST")).toBe("Hello");

            translate.use("fr");
            expect(translatePipe.transform("TEST")).toBe("Bonjour");
        });

        it("should keep the selected language across current and fallback language changes", () => {
            expect(translatePipe.transform("TEST", undefined, "fr")).toBe("Bonjour");

            translate.use("de");
            translate.setFallbackLang("de");
            expect(translatePipe.transform("TEST", undefined, "fr")).toBe("Bonjour");

            translate.setTranslation("fr", { TEST: "Salut" });
            expect(translatePipe.transform("TEST", undefined, "fr")).toBe("Salut");
        });

        it("should remove the language override with null and reuse the default-language signal", () => {
            expect(translatePipe.transform("TEST", undefined, "fr")).toBe("Bonjour");
            const createSignal = spyOn(translate, "translate").and.callThrough();

            expect(translatePipe.transform("TEST", undefined, null)).toBe("Hello");
            expect(translatePipe.transform("TEST")).toBe("Hello");
            expect(createSignal).toHaveBeenCalledOnceWith("TEST", undefined, undefined);

            translate.use("de");
            expect(translatePipe.transform("TEST", undefined, null)).toBe("Hallo");
        });

        it("should reuse the signal while the key, parameters and language are unchanged", () => {
            const createSignal = spyOn(translate, "translate").and.callThrough();

            expect(translatePipe.transform("TEST", { name: "Ada" }, "fr")).toBe("Bonjour");
            expect(translatePipe.transform("TEST", { name: "Ada" }, "fr")).toBe("Bonjour");
            expect(createSignal).toHaveBeenCalledTimes(1);
        });

        it("should use the missing handler instead of the current or fallback language", () => {
            expect(translatePipe.transform("FALLBACK_ONLY", undefined, "fr")).toBe("FALLBACK_ONLY");

            const handle = spyOn(
                TestBed.inject(MissingTranslationHandler),
                "handle",
            ).and.returnValue("Missing translation");
            expect(translatePipe.transform("FALLBACK_ONLY", { name: "Ada" }, "fr")).toBe(
                "Missing translation",
            );
            expect(handle).toHaveBeenCalledWith({
                key: "FALLBACK_ONLY",
                translateService: translate,
                interpolateParams: { name: "Ada" },
            });
        });

        it("should update when an unloaded language is registered without fetching it", () => {
            const load = spyOn(TestBed.inject(TranslateLoader), "getTranslation").and.callThrough();
            spyOn(console, "warn");

            expect(translatePipe.transform("TEST", undefined, "es")).toBe("TEST");
            expect(load).not.toHaveBeenCalled();

            translate.setTranslation("es", { TEST: "Hola" });
            expect(translatePipe.transform("TEST", undefined, "es")).toBe("Hola");
        });
    });

    describe("updates - sync", () => {
        it("on default lang change", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.setTranslation("fr", { TEST: "C'est un test" });
            translate.setFallbackLang("en");

            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.setFallbackLang("fr");

            expect(translatePipe.transform("TEST")).toEqual("C'est un test");
        });

        it("on lang change", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.setTranslation("fr", { TEST: "C'est un test" });
            translate.use("en");

            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.use("fr");

            expect(translatePipe.transform("TEST")).toEqual("C'est un test");
        });

        it("should update the translation if the language is reloaded", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.use("en");

            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.setTranslation("en", { TEST: "Another one!" });

            expect(translatePipe.transform("TEST")).toEqual("Another one!");
        });

        it("should update the translation if the default lang changes when using it as fallback", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.setTranslation("fr", { "no-test": "C'est un test" });
            translate.setFallbackLang("en");
            translate.use("fr");

            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.setTranslation("en", { TEST: "Another test" });

            expect(translatePipe.transform("TEST")).toEqual("Another test");
        });
    });

    describe("updates - async", () => {
        it("on default lang change", fakeAsync(() => {
            translate.setFallbackLang("en");
            tick(10);
            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.setFallbackLang("fr");
            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            tick(10);
            expect(translatePipe.transform("TEST")).toEqual("C'est un test");
        }));

        it("on lang change", fakeAsync(() => {
            translate.use("en");
            tick(10);
            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.use("fr");
            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            tick(10);
            expect(translatePipe.transform("TEST")).toEqual("C'est un test");
        }));
    });
});
