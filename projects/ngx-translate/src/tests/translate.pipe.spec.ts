import { ChangeDetectorRef } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { Mock } from "ts-mocks";
import {
    provideTranslateLoader,
    provideTranslateService,
    TranslatePipe,
    TranslateService,
} from "../public-api";
import { DelayedFakeLoader } from "./test-helpers";

describe("TranslatePipe (unit)", () => {
    let translate: TranslateService;
    let ref: ChangeDetectorRef;
    let translatePipe: TranslatePipe;

    beforeEach(() => {
        ref = new Mock<ChangeDetectorRef>({
            markForCheck: () => {
                /*empty*/
            },
        }).Object;

        TestBed.configureTestingModule({
            providers: [
                provideTranslateService(),
                {
                    provide: ChangeDetectorRef,
                    useValue: ref,
                },
                {
                    provide: TranslatePipe,
                    useClass: TranslatePipe,
                },
                provideTranslateLoader(DelayedFakeLoader),
            ],
        });

        translate = TestBed.inject(TranslateService);
        translatePipe = TestBed.inject(TranslatePipe); // can't create the pipe with new because of DI

        spyOn(translatePipe, "updateValue").and.callThrough();
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

        it("should call markForChanges when it translates a string", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.use("en");

            translatePipe.transform("TEST");
            expect(ref.markForCheck).toHaveBeenCalled();
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
            expect(translatePipe.updateValue).toHaveBeenCalledTimes(1);

            // same value, shouldn't call 'updateValue' again
            expect(translatePipe.transform("TEST", { param: "with param" })).toEqual(
                "This is a test with param",
            );
            expect(translatePipe.updateValue).toHaveBeenCalledTimes(1);

            // different param: should call 'updateValue'
            expect(translatePipe.transform("TEST", { param: "with param2" })).toEqual(
                "This is a test with param2",
            );
            expect(translatePipe.updateValue).toHaveBeenCalledTimes(2);

            expect(ref.markForCheck).toHaveBeenCalledTimes(2);
        });

        it("should throw if you don't give an object parameter", () => {
            translate.setTranslation("en", { TEST: "This is a test {{param}}" });
            translate.use("en");
            const param = 'param: "with param"';

            expect(() => {
                translatePipe.transform("TEST", param);
            }).toThrowError(
                `Wrong parameter in TranslatePipe. Expected a valid Object, received: ${param}`,
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
            translate.setDefaultLang('en');
            fixture.detectChanges();
            expect(fixture.debugElement.nativeElement.innerHTML).toEqual("This is some default text");
        });
         */
    });

    describe("updates - sync", () => {
        it("on default lang change", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.setTranslation("fr", { TEST: "C'est un test" });
            translate.setDefaultLang("en");

            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.setDefaultLang("fr");

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
            translate.setDefaultLang("en");
            translate.use("fr");

            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.setTranslation("en", { TEST: "Another test" });

            expect(translatePipe.transform("TEST")).toEqual("Another test");
        });
    });

    describe("updates - async", () => {
        it("on default lang change", fakeAsync(() => {
            translate.setDefaultLang("en");
            tick(10);
            expect(translatePipe.transform("TEST")).toEqual("This is a test");

            translate.setDefaultLang("fr");
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
