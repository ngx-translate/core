import { Component, inject, signal, computed } from "@angular/core";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { defer, EMPTY, Observable, of, throwError, timer, zip } from "rxjs";
import { first, map, take, toArray } from "rxjs/operators";
import {
    InterpolationParameters,
    LangChangeEvent,
    provideChildTranslateService,
    provideTranslateLoader,
    provideTranslateService,
    TranslateLoader,
    TranslatePipe,
    TranslateService,
    Translation,
    TranslationChangeEvent,
    TranslationObject,
} from "../public-api";
import { provideTestableTranslateService, TestableTranslateService } from "./test-helpers";

let translations: TranslationObject = { TEST: "This is a test" };

interface FakeNavigator {
    languages?: string[];
    language?: string;
    browserLanguage?: string;
    userLanguage?: string;
}

class FakeLoader implements TranslateLoader {
    getTranslation(): Observable<TranslationObject> {
        return of(translations);
    }
}

export interface User {
    firstName: string;
    lastName?: string;
}

describe("TranslateService (Delayed loading)", () => {
    let translate: TestableTranslateService;

    class DelayedLoader implements TranslateLoader {
        getTranslation(lang: string): Observable<TranslationObject> {
            if (lang === "delay-10") {
                return timer(10).pipe(map(() => ({ x: "delay 10" })));
            } else if (lang === "delay-20") {
                return timer(20).pipe(map(() => ({ x: "delay 20" })));
            } else if (lang === "delay-0") {
                return of({ x: "no delay" });
            } else {
                throw new Error(`Unknown language: ${lang}`);
            }
        }
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({ loader: provideTranslateLoader(DelayedLoader) }),
            ],
        });
        translate = TestBed.inject(TranslateService) as TestableTranslateService;
    });

    it("currentLang should be the language, on which use() was called last - in order", fakeAsync(() => {
        const completionOrder: string[] = [];

        translate.use("delay-0").subscribe(() => completionOrder.push("delay-0"));
        expect(translate.getCurrentLang()).toEqual("delay-0");

        translate.use("delay-10").subscribe(() => completionOrder.push("delay-10"));
        expect(translate.getCurrentLang()).toEqual("delay-0"); // stays until loaded

        translate.use("delay-20").subscribe(() => completionOrder.push("delay-20"));
        expect(translate.getCurrentLang()).toEqual("delay-0"); // stays until loaded

        tick(50);

        expect(completionOrder).toEqual(["delay-0", "delay-10", "delay-20"]);

        expect(translate.getCurrentLang()).toEqual("delay-20");
    }));

    it("currentLang should be the language, on which use() was called last - reverse order", fakeAsync(() => {
        const completionOrder: string[] = [];

        expect(translate.getCurrentLang()).toBeUndefined();

        translate.use("delay-20").subscribe(() => completionOrder.push("delay-20"));
        expect(translate.getCurrentLang()).toEqual("delay-20");

        translate.use("delay-10").subscribe(() => completionOrder.push("delay-10"));
        expect(translate.getCurrentLang()).toEqual("delay-20"); // stays until completed

        translate.use("delay-0").subscribe(() => completionOrder.push("delay-0"));
        expect(translate.getCurrentLang()).toEqual("delay-0"); // this one completes immediately

        tick(50);

        expect(completionOrder).toEqual(["delay-0", "delay-10", "delay-20"]);

        expect(translate.getCurrentLang()).toEqual("delay-0");
    }));
});

describe("TranslateService", () => {
    let translate: TestableTranslateService;

    const fakeNavigator: FakeNavigator = window.navigator as unknown as FakeNavigator;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTestableTranslateService({ loader: provideTranslateLoader(FakeLoader) }),
            ],
        });
        translate = TestBed.inject(TranslateService) as TestableTranslateService;
    });

    afterEach(() => {
        translations = { TEST: "This is a test" };
    });

    it("is defined", () => {
        expect(TranslateService).toBeDefined();
        expect(translate).toBeDefined();
    });

    it("should be able to get translations", () => {
        translations = { TEST: "This is a test", TEST2: "This is another test" };
        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is a test");
        });

        // this will request the translation from downloaded translations without making a request to the backend
        translate.get("TEST2").subscribe((res: Translation) => {
            expect(res).toEqual("This is another test");
        });
    });

    it("translates text using 'default' translation Id", () => {
        translations = { default: "Default text" };
        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("default").subscribe((res: Translation) => {
            expect(res).toEqual("Default text");
        });
    });

    it("should be able to get an array translations", () => {
        translations = { TEST: "This is a test", TEST2: "This is another test2" };
        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get(["TEST", "TEST2"]).subscribe((res: Translation) => {
            expect(res as object).toEqual(translations);
        });
    });

    it("should fallback to the default language", () => {
        translations = {};
        translate.use("fr");

        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("TEST");

            translate.setFallbackLang("nl");
            translate.setTranslation("nl", { TEST: "Dit is een test" });

            translate.get("TEST").subscribe((res2: Translation) => {
                expect(res2).toEqual("Dit is een test");
                expect(translate.getFallbackLang()).toEqual("nl");
            });
        });
    });

    it("should return fallback lang if key in current lang is null", () => {
        translations = {};
        translate.use("fr");
        translate.setFallbackLang("nl");

        translate.setTranslation("fr", { TEST: null });
        translate.setTranslation("nl", { TEST: "Dit is een test" });

        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("Dit is een test");
        });
    });

    it("should use the default language by default", () => {
        translate.setFallbackLang("nl");
        translate.setTranslation("nl", { TEST: "Dit is een test" });

        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("Dit is een test");
        });
    });

    it("should return the key when it doesn't find a translation", () => {
        translate.use("en");

        translate.get("TEST2").subscribe((res: Translation) => {
            expect(res).toEqual("TEST2");
        });
    });

    it("should return the key when you haven't defined any translation", () => {
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("TEST");
        });
    });

    it("should return an empty value", () => {
        translate.setFallbackLang("en");
        translate.setTranslation("en", { TEST: "" });

        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("");
        });
    });

    it("should be able to get translations with params", () => {
        translations = { TEST: "This is a test {{param}}" };
        translate.use("en");

        translate.get("TEST", { param: "with param" }).subscribe((res: Translation) => {
            expect(res).toEqual("This is a test with param");
        });
    });

    it("should be able to get translations with nested params", () => {
        translations = { TEST: "This is a test {{param.value}}" };
        translate.use("en");

        translate.get("TEST", { param: { value: "with param" } }).subscribe((res: Translation) => {
            expect(res).toEqual("This is a test with param");
        });
    });

    it("Should ignore if you forget the key", () => {
        translate.use("en");

        const key: Record<string, string> = {};
        translate.get(key["x"]).subscribe((res: Translation) => {
            expect(res).toEqual("");
        });

        translate.get("").subscribe((res: Translation) => {
            expect(res).toEqual("");
        });
    });

    it("should be able to get translations with nested keys", () => {
        translations = {
            TEST: { TEST: "This is a test" },
            TEST2: { TEST2: { TEST2: "This is another test" } },
        };
        translate.use("en");

        translate.get("TEST.TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is a test");
        });

        translate.get("TEST2.TEST2.TEST2").subscribe((res: Translation) => {
            expect(res).toEqual("This is another test");
        });
    });

    it("should merge translations if option shouldMerge is true", (done: DoneFn) => {
        translations = {};
        translate.setTranslation("en", { TEST: { sub1: "value1" } }, true);
        translate.setTranslation("en", { TEST: { sub2: "value2" } }, true);
        translate.use("en");

        translate.get("TEST").subscribe((res: Translation) => {
            expect(res as object).toEqual({ sub1: "value1", sub2: "value2" });
            expect(translations as object).toEqual({});
            done();
        });
    });

    it("shouldn't call the current loader if you set the translation yourself", (done: DoneFn) => {
        translations = {};
        translate.setTranslation("en", { TEST: "This is a test" });
        translate.use("en");

        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is a test");
            expect(translations as object).toEqual({});
            done();
        });
    });

    describe("getStreamOnTranslationChange", () => {
        it("throws error if empty key is provided for stream", () => {
            expect(() => {
                translate.getStreamOnTranslationChange("");
            }).toThrowError('Parameter "key" is required and cannot be empty');
        });

        it("should be able to get a stream array", (done: DoneFn) => {
            const tr = { TEST: "This is a test", TEST2: "This is a test2" };
            translate.setTranslation("en", tr);
            translate.use("en");

            translate
                .getStreamOnTranslationChange(["TEST", "TEST2"])
                .subscribe((res: Translation) => {
                    expect(res as object).toEqual(tr);
                    done();
                });
        });

        it("returns a function", (done: DoneFn) => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.use("en");

            translate.getStreamOnTranslationChange(["TEST"]).subscribe((res: Translation) => {
                expect(res as object).toEqual({ TEST: "This is a test" });
                done();
            });
        });

        it("should initially return the same value for getStreamOnTranslationChange and non-streaming get", (done: DoneFn) => {
            translations = { TEST: "This is a test" };
            translate.use("en");

            zip(translate.getStreamOnTranslationChange("TEST"), translate.get("TEST")).subscribe(
                (value: Translation[]) => {
                    const [streamed, nonStreamed] = value;
                    expect(streamed).toEqual("This is a test");
                    expect(nonStreamed).toEqual("This is a test");
                    done();
                },
            );
        });

        it("should be able to stream a translation on translation change", (done: DoneFn) => {
            translations = { TEST: "This is a test" };
            translate.use("en");

            translate
                .getStreamOnTranslationChange("TEST")
                .pipe(take(3), toArray())
                .subscribe((res: Translation[]) => {
                    const expected = [
                        "This is a test",
                        "I changed the test value!",
                        "I changed it again!",
                    ];
                    expect(res).toEqual(expected);
                    done();
                });

            translate.setTranslation("en", { TEST: "I changed the test value!" });
            translate.setTranslation("en", { TEST: "I changed it again!" });
        });

        it("should interpolate the same param into each streamed value when get stream on translation change", (done: DoneFn) => {
            translations = { TEST: "This is a test {{param}}" };
            translate.use("en");

            translate
                .getStreamOnTranslationChange("TEST", { param: "with param" })
                .subscribe((res: Translation) => {
                    const expected = "This is a test with param";
                    expect(res).toEqual(expected);
                    done();
                });
        });
    });

    it("should be able to stream a translation for the current language", (done: DoneFn) => {
        translations = { TEST: "This is a test" };
        translate.use("en");

        translate.stream("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is a test");
            done();
        });
    });

    it("should be able to stream a translation of an array for the current language", (done: DoneFn) => {
        const tr = { TEST: "This is a test", TEST2: "This is a test2" };
        translate.setTranslation("en", tr);
        translate.use("en");

        translate.stream(["TEST", "TEST2"]).subscribe((res: Translation) => {
            expect(res as object).toEqual(tr);
            done();
        });
    });

    it("should initially return the same value for streaming and non-streaming get", (done: DoneFn) => {
        translations = { TEST: "This is a test" };
        translate.use("en");

        zip(translate.stream("TEST"), translate.get("TEST")).subscribe((value: Translation[]) => {
            const [streamed, nonStreamed] = value as string[];
            expect(streamed).toEqual("This is a test");
            expect(streamed).toEqual(nonStreamed);
            done();
        });
    });

    it("should update streaming translations on language change", (done: DoneFn) => {
        translations = { TEST: "This is a test" };
        translate.use("en");

        translate
            .stream("TEST")
            .pipe(take(3), toArray())
            .subscribe((res: Translation[]) => {
                const expected = ["This is a test", "Dit is een test", "This is a test"];
                expect(res).toEqual(expected);
                done();
            });

        translate.setTranslation("nl", { TEST: "Dit is een test" });
        translate.use("nl");
        translate.use("en");
    });

    it("should update lazy streaming translations on translation change", (done: DoneFn) => {
        translations = { TEST: "This is a test" };
        translate.use("en");

        const translation$ = translate.getStreamOnTranslationChange("TEST");

        translate.setTranslation("en", { TEST: "This is a test2" });

        translation$.pipe(first()).subscribe((res: Translation) => {
            const expected = "This is a test2";
            expect(res).toEqual(expected);
            done();
        });
    });

    it("should update lazy streaming translations on language change", (done: DoneFn) => {
        translations = { TEST: "This is a test" };
        translate.use("en");

        const translation$ = translate.stream("TEST");

        translate.setTranslation("nl", { TEST: "Dit is een test" });
        translate.use("nl");

        translation$.pipe(first()).subscribe((res: Translation) => {
            const expected = "Dit is een test";
            expect(res).toEqual(expected);
            done();
        });
    });

    it("should update streaming translations of an array on language change", (done: DoneFn) => {
        const en = { TEST: "This is a test", TEST2: "This is a test2" };
        const nl = { TEST: "Dit is een test", TEST2: "Dit is een test2" };
        translate.setTranslation("en", en);
        translate.use("en");

        translate
            .stream(["TEST", "TEST2"])
            .pipe(take(3), toArray())
            .subscribe((res: Translation[]) => {
                const expected = [en, nl, en];
                expect(res).toEqual(expected);
                done();
            });

        translate.setTranslation("nl", nl);
        translate.use("nl");
        translate.use("en");
    });

    it("should interpolate the same param into each streamed value", (done: DoneFn) => {
        translations = { TEST: "This is a test {{param}}" };
        translate.use("en");

        translate
            .stream("TEST", { param: "with param" })
            .pipe(take(3), toArray())
            .subscribe((res: Translation[]) => {
                const expected = [
                    "This is a test with param",
                    "Dit is een test with param",
                    "This is a test with param",
                ];
                expect(res).toEqual(expected);
                done();
            });

        translate.setTranslation("nl", { TEST: "Dit is een test {{param}}" });
        translate.use("nl");
        translate.use("en");
    });

    describe("instant()", () => {
        it("should accept an object for interpolation", () => {
            translate.setTranslation("en", { TEST: "user={{firstName}}" });
            translate.use("en");

            const user: User = {
                firstName: "John",
            };

            expect(translate.instant("TEST", user)).toEqual("user=John");
        });

        it("should accept a record for interpolation", () => {
            translate.setTranslation("en", { TEST: "user={{firstName}}" });
            translate.use("en");

            const values: InterpolationParameters = { firstName: "John" };

            expect(translate.instant("TEST", values)).toEqual("user=John");
        });

        it("should accept a record for interpolation", () => {
            translate.setTranslation("en", { TEST: "user={{firstName}}" });
            translate.use("en");

            expect(translate.instant("TEST", { firstName: "John" })).toEqual("user=John");
        });

        it("should be able to get instant translations", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.use("en");

            expect(translate.instant("TEST")).toEqual("This is a test");
        });

        it("should be able to get instant translations of an array", () => {
            const tr = { TEST: "This is a test", TEST2: "This is a test2" };
            translate.setTranslation("en", tr);
            translate.use("en");

            expect(translate.instant(["TEST", "TEST2"]) as object).toEqual(tr);
        });

        it("should return the key if instant translations are not available", () => {
            translate.setTranslation("en", { TEST: "This is a test" });
            translate.use("en");

            expect(translate.instant("TEST2")).toEqual("TEST2");
        });

        it("should be able to get instant translations of an array", () => {
            const tr = { TEST: "This is a test", TEST2: "This is a test2" };
            translate.setTranslation("en", tr);
            translate.use("en");

            expect(translate.instant(["TEST", "TEST2"]) as object).toEqual(tr);
        });

        it("should be able interpolate parameters in array", () => {
            const tr = { TEST: "Hello {{value}} 1!", TEST2: "Hello {{value}} 2!" };
            translate.setTranslation("en", tr);
            translate.use("en");

            expect(translate.instant(["TEST", "TEST2"], { value: "world" }) as object).toEqual({
                TEST: "Hello world 1!",
                TEST2: "Hello world 2!",
            });
        });

        it("should be able to return sub-trees", () => {
            const tr = { a: { b: { x: "X", y: "Y" } } };
            translate.setTranslation("en", tr);
            translate.use("en");

            expect(translate.instant("a.b") as object).toEqual({ x: "X", y: "Y" });
        });

        it("should be able to interpolate in sub-trees", () => {
            const tr = { a: { b: { x: "{{value}} 1", y: "{{value}} 2" } } };
            translate.setTranslation("en", tr);
            translate.use("en");

            expect(translate.instant("a.b", { value: "world" }) as object).toEqual({
                x: "world 1",
                y: "world 2",
            });
        });

        it("should be able to return arrays", () => {
            const tr = { a: { b: ["X", "Y"] } };
            translate.setTranslation("en", tr);
            translate.use("en");

            expect(translate.instant("a.b") as string[]).toEqual(["X", "Y"]);
        });

        it("ignores null values in nested results", () => {
            const tr = { a: { aa: "test", bb: null } };
            translate.setTranslation("en", tr);
            translate.use("en");
            expect(translate.instant("a") as object).toEqual({ aa: "test" });
        });

        it("returns key when asking for null value directly", () => {
            const tr = { a: { aa: "test", bb: null } };
            translate.setTranslation("en", tr);
            translate.use("en");
            expect(translate.instant("a.bb")).toEqual("a.bb");
        });

        it("should  interpolate in arrays", () => {
            const tr = { a: { b: ["{{value}} 1", "{{value}} 2"] } };
            translate.setTranslation("en", tr);
            translate.use("en");

            expect(translate.instant("a.b", { value: "world" }) as string[]).toEqual([
                "world 1",
                "world 2",
            ]);
        });
    });

    describe("set()", () => {
        it("should set translations with nested key (string)", () => {
            translate.setTranslation("en", { profile: "test" });
            translate.use("en");
            translate.set("profile.name", "Profile Name", "en");
            expect(translate.instant("profile.name")).toEqual("Profile Name");
        });

        it("should set translations with nested key (object)", () => {
            translate.setTranslation("en", { profile: "test" });
            translate.use("en");
            translate.set("a.b", { c: { d: "setting nested object" } }, "en");
            expect(translate.instant("a.b.c.d")).toEqual("setting nested object");
        });

        it("should trigger an event when the translation value changes", () => {
            translate.setTranslation("en", {});
            translate.onTranslationChange.subscribe((event: TranslationChangeEvent) => {
                expect(event.translations).toBeDefined();
                expect(event.translations["TEST"] as string).toEqual("This is a test");
                expect(event.lang).toBe("en");
            });
            translate.set("TEST", "This is a test", "en");
        });

        it("should set the translation of the current language", () => {
            translate.setTranslation("en", {});
            translate.use("en");

            translate.onTranslationChange.subscribe((event: TranslationChangeEvent) => {
                expect(event.translations).toBeDefined();
                expect(event.translations["TEST"] as string).toEqual("This is a test");
                expect(event.lang).toBe("en");
            });
            translate.set("TEST", "This is a test");
        });

        it("should translate 'default'", () => {
            translate.setTranslation("en", { default: "This is the default message" });
            translate.use("en");

            expect(translate.instant("default")).toEqual("This is the default message");
        });
    });

    it("should trigger an event when the lang changes", () => {
        const tr: TranslationObject = { TEST: "This is a test" };
        translate.setTranslation("en", tr);
        translate.onLangChange.subscribe((event: LangChangeEvent) => {
            expect(event.lang).toBe("en");
            expect(event.translations as unknown).toEqual(tr);
        });
        translate.use("en");
    });

    it("should be able to reset a lang", (done: DoneFn) => {
        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("This is a test");

            // reset the lang as if it was never initiated
            translate.resetLang("en");

            expect(translate.instant("TEST")).toEqual("TEST");

            translate.get("TEST").subscribe((res2: Translation) => {
                expect(res2).toEqual("TEST"); // because the loader is "pristine" as if it was never called
                done();
            });
        });
    });

    it("should be able to reload a lang", () => {
        translations = {};
        translate.use("en");

        // this will request the translation from the loader
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res).toEqual("TEST");

            translations = { TEST: "This is a test 2" };

            // reset the lang as if it was never initiated
            translate.reloadLang("en").subscribe(() => {
                expect(translate.instant("TEST")).toEqual("This is a test 2");
            });
        });
    });

    it("should be able to add new languages", () => {
        translate.addLangs(["pl", "es"]);
        expect(translate.getLangs()).toEqual(["pl", "es"]);
        translate.addLangs(["fr"]);
        translate.addLangs(["pl", "fr"]);
        expect(translate.getLangs()).toEqual(["pl", "es", "fr"]);

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.use("en").subscribe(() => {
            expect(translate.getLangs()).toEqual(["pl", "es", "fr", "en"]);
            translate.addLangs(["de"]);
            expect(translate.getLangs()).toEqual(["pl", "es", "fr", "en", "de"]);
        });
    });

    it("should be able to get the browserLang", () => {
        const browserLang = translate.getBrowserLang();
        expect(browserLang).toBeDefined();
        expect(typeof browserLang === "string").toBeTruthy();
    });

    it("should be able to get the browserCultureLang", () => {
        const browserCultureLand = translate.getBrowserCultureLang();
        expect(browserCultureLand).toBeDefined();
        expect(typeof browserCultureLand === "string").toBeTruthy();
    });

    it("should not make duplicate getTranslation calls", fakeAsync(() => {
        let getTranslationCalls = 0;
        spyOn(translate.getCurrentLoader(), "getTranslation").and.callFake(() => {
            getTranslationCalls += 1;
            return timer(1000).pipe(map(() => translations));
        });
        translate.use("en");
        translate.use("en");

        tick(1001);

        expect(getTranslationCalls).toEqual(1);
    }));

    it("should subscribe to the loader just once", () => {
        let subscriptions = 0;
        spyOn(translate.getCurrentLoader(), "getTranslation").and.callFake(() => {
            return defer(() => {
                subscriptions++;
                return of(translations);
            });
        });
        translate.use("en");
        translate.use("en");
        translate.use("en").subscribe();
        translate.use("en").subscribe();

        expect(subscriptions).toEqual(1);
    });

    it("should compile translations only once, even when subscribing to translations while translations are loading", fakeAsync(() => {
        spyOn(translate.getCurrentLoader(), "getTranslation").and.callFake(() => {
            return timer(1000).pipe(map(() => translations));
        });

        let translateCompilerCallCount = 0;
        spyOn(translate.getCompiler(), "compile").and.callFake((value) => {
            ++translateCompilerCallCount;
            return value;
        });
        spyOn(translate.getCompiler(), "compileTranslations").and.callFake((value) => {
            ++translateCompilerCallCount;
            return value;
        });

        translate.setFallbackLang("en-US");
        translate.get("TEST1").subscribe();
        translate.get("TEST2").subscribe();
        translate.get("TEST3").subscribe();
        translate.get("TEST4").subscribe();

        tick(1001);

        expect(translateCompilerCallCount).toBe(1);
    }));

    it("throws error if empty key is provided for stream", () => {
        expect(() => {
            translate.stream("");
        }).toThrowError('Parameter "key" required');
    });

    describe("getBrowserLang()", () => {
        it("should return undefined when window is undefined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window, "navigator", "get").and.returnValue(void 0);
            expect(translate.getBrowserLang()).toBeUndefined();
        });

        it("should return undefined if window is undefined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window, "navigator", "get").and.returnValue(void 0);

            expect(translate.getBrowserLang()).toBeUndefined();
        });

        it("should return undefined if window.navigator is undefined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window, "navigator", "get").and.returnValue(void 0);

            expect(translate.getBrowserLang()).toBeUndefined();
        });

        it("should return the first language from window.navigator.languages", () => {
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(["fr-FR", "en-US"]);

            expect(translate.getBrowserLang()).toBe("fr");
        });

        it("should accept _ as separator in language codes", () => {
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(["fr_FR", "en_US"]);

            expect(translate.getBrowserLang()).toBe("fr");
        });

        it("should return window.navigator.language if window.navigator.languages is not defined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);
            spyOnProperty(window.navigator, "language", "get").and.returnValue("es-ES");

            expect(translate.getBrowserLang()).toBe("es");
        });

        it("should return window.navigator.browserLanguage if other properties are not defined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);
            (window.navigator as unknown as FakeNavigator).browserLanguage = "de-DE";

            expect(translate.getBrowserLang()).toBe("de");
        });

        it("should return window.navigator.userLanguage if other properties are not defined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);

            fakeNavigator.browserLanguage = undefined;
            fakeNavigator.userLanguage = "it-IT";

            expect(translate.getBrowserLang()).toBe("it");
        });

        it("should return undefined if all navigator properties are undefined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);
            fakeNavigator.browserLanguage = undefined;
            fakeNavigator.userLanguage = undefined;

            expect(translate.getBrowserLang()).toBeUndefined();
        });

        it("should handle language codes with underscores", () => {
            spyOnProperty(window.navigator, "language", "get").and.returnValue("en_US");
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(["en_US"]);

            expect(translate.getBrowserLang()).toBe("en");
        });
    });

    describe("getBrowserCultureLang", () => {
        it("should return undefined if window is undefined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window, "navigator", "get").and.returnValue(undefined);

            expect(translate.getBrowserCultureLang()).toBeUndefined();
        });

        it("should return undefined if window.navigator is undefined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window, "navigator", "get").and.returnValue(undefined);

            expect(translate.getBrowserCultureLang()).toBeUndefined();
        });

        it("should return the first language from window.navigator.languages", () => {
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(["fr-FR", "en-US"]);

            expect(translate.getBrowserCultureLang()).toBe("fr-FR");
        });

        it("should return window.navigator.language if window.navigator.languages is not defined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);
            spyOnProperty(window.navigator, "language", "get").and.returnValue("es-ES");

            expect(translate.getBrowserCultureLang()).toBe("es-ES");
        });

        it("should return window.navigator.browserLanguage if other properties are not defined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);
            fakeNavigator.browserLanguage = "de-DE";

            expect(translate.getBrowserCultureLang()).toBe("de-DE");
        });

        it("should return window.navigator.userLanguage if other properties are not defined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);
            fakeNavigator.browserLanguage = undefined;
            fakeNavigator.userLanguage = "it-IT";

            expect(translate.getBrowserCultureLang()).toBe("it-IT");
        });

        it("should return undefined if all navigator properties are undefined", () => {
            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "languages", "get").and.returnValue(undefined);

            // @ts-expect-error we simulate that the property does not exist - lint does not like this
            spyOnProperty(window.navigator, "language", "get").and.returnValue(undefined);

            fakeNavigator.browserLanguage = undefined;
            fakeNavigator.userLanguage = undefined;

            expect(translate.getBrowserCultureLang()).toBeUndefined();
        });
    });
});

describe("TranslateService (isolate)", () => {
    const translationsRoot = {
        en: { test: "en-root" },
        de: { test: "de-root" },
    };

    const translationsChild = {
        en: { test: "en-child" },
        de: { test: "de-child" },
    };

    class StaticTranslateLoader implements TranslateLoader {
        constructor(private translations: Record<string, TranslationObject>) { }

        getTranslation(lang: string): Observable<TranslationObject> {
            const translations = this.translations[lang];
            if (translations) {
                return of(translations);
            } else {
                return EMPTY;
            }
        }
    }

    @Component({
        standalone: true,
        selector: "app-isolated-child",
        template: ` <div class="isolated-child">{{ "test" | translate }}</div> `,
        imports: [TranslatePipe],
        providers: [
            provideTranslateService({
                loader: {
                    provide: TranslateLoader,
                    useFactory: () => new StaticTranslateLoader(translationsChild),
                },
            }),
        ],
    })
    class IsolatedChildComponent {
        constructor() {
            const translate = inject(TranslateService);
            translate.use("de");
        }
    }

    @Component({
        standalone: true,
        selector: "app-shared-child",
        template: ` <div class="shared-child">{{ "test" | translate }}</div> `,
        imports: [TranslatePipe],
        providers: [provideChildTranslateService()],
    })
    class SharedChildComponent { }

    @Component({
        standalone: true,
        imports: [IsolatedChildComponent, SharedChildComponent, TranslatePipe],
        selector: "app-test",
        template: `
            <div class="root">{{ "test" | translate }}</div>
            <app-isolated-child />
            <app-shared-child />
        `,
    })
    class AppTestComponent {
        constructor() {
            const translate = inject(TranslateService);
            translate.use("en");
        }
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService(),
                {
                    provide: TranslateLoader,
                    useFactory: () => new StaticTranslateLoader(translationsRoot),
                },
            ],
        }).compileComponents();
    });

    it("switches root and child component independently", async () => {
        const fixture = TestBed.createComponent(AppTestComponent);

        const app = fixture.nativeElement;

        fixture.detectChanges();

        expect(app.querySelector("div.root").textContent).toEqual("en-root");
        expect(app.querySelector("div.isolated-child").textContent).toEqual("de-child");
        expect(app.querySelector("div.shared-child").textContent).toEqual("en-root");

        // switch root
        TestBed.inject(TranslateService).use("de");
        fixture.detectChanges();

        expect(app.querySelector("div.root").textContent).toEqual("de-root");
        expect(app.querySelector("div.isolated-child").textContent).toEqual("de-child");
        expect(app.querySelector("div.shared-child").textContent).toEqual("de-root");
    });
});

describe("TranslateService (Error Conditions and Recovery)", () => {
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: provideTranslateLoader(FakeLoader),
                }),
            ],
        });
        translate = TestBed.inject(TranslateService);
    });

    describe("Invalid Parameter Handling", () => {
        it("should handle null parameters gracefully", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            translate.get(null as any).subscribe((res: Translation) => {
                expect(res).toEqual("");
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            translate.get(undefined as any).subscribe((res: Translation) => {
                expect(res).toEqual("");
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            translate.get(123 as any).subscribe((res: Translation) => {
                expect(res).toEqual("");
            });
        });

        it("should handle array with invalid elements", () => {
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                translate.get([null, undefined, ""] as any);
            }).toThrow();
        });

        it("should handle deeply nested invalid parameters", () => {
            const invalidParams = {
                nested: {
                    value: null,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    circular: {} as any,
                },
            };
            invalidParams.nested.circular = invalidParams;

            translate.setTranslation("en", { TEST: "Test {{nested.value}}" });
            translate.use("en");

            translate.get("TEST", invalidParams).subscribe((res: Translation) => {
                // Should handle gracefully without crashing
                expect(res).toBeDefined();
            });
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty translation object", () => {
            translate.setTranslation("en", {});
            translate.use("en");

            translate.get("ANY_KEY").subscribe((res: Translation) => {
                expect(res).toEqual("ANY_KEY");
            });
        });

        it("should handle translation with circular references", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const circularTranslation: any = { key: "value" };
            circularTranslation.self = circularTranslation;

            expect(() => {
                translate.setTranslation("en", circularTranslation);
            }).not.toThrow();
        });

        it("should handle very long translation keys", () => {
            const longKey = "a".repeat(10000);
            translate.setTranslation("en", { [longKey]: "Long key translation" });
            translate.use("en");

            translate.get(longKey).subscribe((res: Translation) => {
                expect(res).toEqual("Long key translation");
            });
        });

        it("should handle special characters in translation keys", () => {
            const specialKey = "key.with.dots-and_underscores@symbols#hash";
            translate.setTranslation("en", { [specialKey]: "Special key translation" });
            translate.use("en");

            translate.get(specialKey).subscribe((res: Translation) => {
                expect(res).toEqual("Special key translation");
            });
        });
    });

    describe("Error handling & configuration", () => {
        class ErrorLoader implements TranslateLoader {
            getTranslation(): Observable<TranslationObject> {
                return new Observable((observer) => {
                    observer.error(new Error("Load failed"));
                });
            }
        }

        it("should handle loader error in use", (done) => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        loader: provideTranslateLoader(ErrorLoader),
                    }),
                ],
            });

            const errorTranslate = TestBed.inject(TranslateService);

            errorTranslate.use("en").subscribe({
                next: () => {
                    // Should not reach here
                    done.fail("Expected error but got success");
                },
                error: (err) => {
                    expect(err.message).toBe("Load failed");
                    done();
                },
            });
        });

        it("should handle loader error in setFallbackLang", (done) => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        loader: provideTranslateLoader(ErrorLoader),
                    }),
                ],
            });

            const errorTranslate = TestBed.inject(TranslateService);

            errorTranslate.setFallbackLang("en").subscribe({
                next: () => {
                    // Should not reach here
                    done.fail("Expected error but got success");
                },
                error: (err) => {
                    expect(err.message).toBe("Load failed");
                    done();
                },
            });
        });

        it("should handle configuration with lang in constructor", () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        loader: provideTranslateLoader(FakeLoader),
                        lang: "en",
                    }),
                ],
            });

            const configTranslate = TestBed.inject(TranslateService);
            expect(configTranslate.getCurrentLang()).toBe("en");
        });

        it("should handle configuration with fallbackLang in constructor", () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        loader: provideTranslateLoader(FakeLoader),
                        fallbackLang: "en",
                    }),
                ],
            });

            const configTranslate = TestBed.inject(TranslateService);
            expect(configTranslate.getFallbackLang()).toBe("en");
        });
    });
});

describe("TranslateService.translate() Signal", () => {
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideTranslateService({ loader: provideTranslateLoader(FakeLoader) })],
        });
        translate = TestBed.inject(TranslateService);
    });

    describe("with static key", () => {
        it("should return a signal with the translated value", () => {
            translate.setTranslation("en", { HELLO: "Hello" });
            translate.use("en");

            const result = translate.translate("HELLO");

            expect(result()).toEqual("Hello");
        });

        it("should return key when translation is not found", () => {
            translate.setTranslation("en", {});
            translate.use("en");

            const result = translate.translate("MISSING_KEY");

            expect(result()).toEqual("MISSING_KEY");
        });

        it("should return empty string for empty key", () => {
            translate.use("en");

            const result = translate.translate("");

            expect(result()).toEqual("");
        });

        it("should handle nested keys", () => {
            translate.setTranslation("en", { page: { title: "Page Title" } });
            translate.use("en");

            const result = translate.translate("page.title");

            expect(result()).toEqual("Page Title");
        });
    });

    describe("with static params", () => {
        it("should interpolate parameters", () => {
            translate.setTranslation("en", { GREETING: "Hello, {{name}}!" });
            translate.use("en");

            const result = translate.translate("GREETING", { name: "World" });

            expect(result()).toEqual("Hello, World!");
        });

        it("should handle nested parameters", () => {
            translate.setTranslation("en", { MSG: "User: {{user.name}}" });
            translate.use("en");

            const result = translate.translate("MSG", { user: { name: "John" } });

            expect(result()).toEqual("User: John");
        });

        it("should handle multiple parameters", () => {
            translate.setTranslation("en", { MSG: "{{first}} and {{second}}" });
            translate.use("en");

            const result = translate.translate("MSG", { first: "One", second: "Two" });

            expect(result()).toEqual("One and Two");
        });
    });

    describe("with reactive key (Signal)", () => {
        it("should update when key signal changes", () => {
            translate.setTranslation("en", {
                KEY1: "Value 1",
                KEY2: "Value 2",
            });
            translate.use("en");

            const keySignal = signal("KEY1");
            const result = translate.translate(keySignal);

            expect(result()).toEqual("Value 1");

            keySignal.set("KEY2");
            expect(result()).toEqual("Value 2");
        });

        it("should handle dynamic key with params", () => {
            translate.setTranslation("en", {
                HELLO: "Hello, {{name}}!",
                BYE: "Goodbye, {{name}}!",
            });
            translate.use("en");

            const keySignal = signal("HELLO");
            const result = translate.translate(keySignal, { name: "User" });

            expect(result()).toEqual("Hello, User!");

            keySignal.set("BYE");
            expect(result()).toEqual("Goodbye, User!");
        });
    });

    describe("with reactive params (Signal)", () => {
        it("should update when params signal changes", () => {
            translate.setTranslation("en", { GREETING: "Hello, {{name}}!" });
            translate.use("en");

            const paramsSignal = signal<Record<string, string>>({ name: "Alice" });
            const result = translate.translate("GREETING", paramsSignal);

            expect(result()).toEqual("Hello, Alice!");

            paramsSignal.set({ name: "Bob" });
            expect(result()).toEqual("Hello, Bob!");
        });

        it("should handle undefined params signal value", () => {
            translate.setTranslation("en", { MSG: "Message: {{value}}" });
            translate.use("en");

            const paramsSignal = signal<Record<string, string> | undefined>(undefined);
            const result = translate.translate("MSG", paramsSignal);

            expect(result()).toEqual("Message: {{value}}");

            paramsSignal.set({ value: "test" });
            expect(result()).toEqual("Message: test");
        });
    });

    describe("with both reactive key and params", () => {
        it("should update when either signal changes", () => {
            translate.setTranslation("en", {
                HELLO: "Hello, {{name}}!",
                BYE: "Goodbye, {{name}}!",
            });
            translate.use("en");

            const keySignal = signal("HELLO");
            const paramsSignal = signal<Record<string, string>>({ name: "User" });
            const result = translate.translate(keySignal, paramsSignal);

            expect(result()).toEqual("Hello, User!");

            // Change params
            paramsSignal.set({ name: "Friend" });
            expect(result()).toEqual("Hello, Friend!");

            // Change key
            keySignal.set("BYE");
            expect(result()).toEqual("Goodbye, Friend!");
        });
    });

    describe("reactivity to language changes", () => {
        it("should update when language changes", () => {
            translate.setTranslation("en", { TEST: "English" });
            translate.setTranslation("de", { TEST: "German" });
            translate.use("en");

            const result = translate.translate("TEST");

            expect(result()).toEqual("English");

            translate.use("de");
            expect(result()).toEqual("German");
        });

        it("should update with params when language changes", () => {
            translate.setTranslation("en", { GREETING: "Hello, {{name}}!" });
            translate.setTranslation("de", { GREETING: "Hallo, {{name}}!" });
            translate.use("en");

            const result = translate.translate("GREETING", { name: "World" });

            expect(result()).toEqual("Hello, World!");

            translate.use("de");
            expect(result()).toEqual("Hallo, World!");
        });
    });

    describe("reactivity to translation changes", () => {
        it("should update when translations are modified", () => {
            translate.setTranslation("en", { TEST: "Original" });
            translate.use("en");

            const result = translate.translate("TEST");

            expect(result()).toEqual("Original");

            translate.setTranslation("en", { TEST: "Updated" });
            expect(result()).toEqual("Updated");
        });

        it("should update when using set()", () => {
            translate.setTranslation("en", { TEST: "Original" });
            translate.use("en");

            const result = translate.translate("TEST");

            expect(result()).toEqual("Original");

            translate.set("TEST", "Modified", "en");
            expect(result()).toEqual("Modified");
        });
    });

    describe("reactivity to fallback language changes", () => {
        it("should update when fallback language changes", () => {
            translate.setTranslation("en", {});
            translate.setTranslation("de", { TEST: "German fallback" });
            translate.setTranslation("fr", { TEST: "French fallback" });
            translate.use("en");
            translate.setFallbackLang("de");

            const result = translate.translate("TEST");

            expect(result()).toEqual("German fallback");

            translate.setFallbackLang("fr");
            expect(result()).toEqual("French fallback");
        });
    });

    describe("with array keys", () => {
        it("should return an object with multiple translations", () => {
            translate.setTranslation("en", {
                KEY1: "Value 1",
                KEY2: "Value 2",
            });
            translate.use("en");

            const result = translate.translate(["KEY1", "KEY2"] as unknown as string);

            expect(result()).toEqual({ KEY1: "Value 1", KEY2: "Value 2" });
        });
    });

    describe("edge cases", () => {
        it("should handle rapid signal changes", () => {
            translate.setTranslation("en", {
                A: "Alpha",
                B: "Beta",
                C: "Charlie",
            });
            translate.use("en");

            const keySignal = signal("A");
            const result = translate.translate(keySignal);

            keySignal.set("B");
            keySignal.set("C");
            keySignal.set("A");
            keySignal.set("B");

            expect(result()).toEqual("Beta");
        });

        it("should work with computed signals as key", () => {
            translate.setTranslation("en", {
                "greeting.formal": "Good day",
                "greeting.casual": "Hey",
            });
            translate.use("en");

            const isFormal = signal(true);
            const keySignal = computed(() => (isFormal() ? "greeting.formal" : "greeting.casual"));
            const result = translate.translate(keySignal);

            expect(result()).toEqual("Good day");

            isFormal.set(false);
            expect(result()).toEqual("Hey");
        });

        it("should work with computed signals as params", () => {
            translate.setTranslation("en", { MSG: "Count: {{count}}" });
            translate.use("en");

            const count = signal(0);
            const paramsSignal = computed(() => ({ count: count() }));
            const result = translate.translate("MSG", paramsSignal);

            expect(result()).toEqual("Count: 0");

            count.set(5);
            expect(result()).toEqual("Count: 5");

            count.set(100);
            expect(result()).toEqual("Count: 100");
        });
    });
});

describe("TranslateService.onTranslationRefresh", () => {
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideTranslateService({ loader: provideTranslateLoader(FakeLoader) })],
        });
        translate = TestBed.inject(TranslateService);
    });

    it("should emit when language changes", (done) => {
        translate.setTranslation("en", { TEST: "English" });
        translate.setTranslation("fr", { TEST: "French" });
        translate.use("en");

        translate.onTranslationRefresh.subscribe(() => {
            expect(translate.getCurrentLang()).toEqual("fr");
            done();
        });

        translate.use("fr");
    });

    it("should emit when current language translations are updated", (done) => {
        translate.setTranslation("en", { TEST: "Original" });
        translate.use("en");

        translate.onTranslationRefresh.subscribe(() => {
            expect(translate.instant("TEST")).toEqual("Updated");
            done();
        });

        translate.setTranslation("en", { TEST: "Updated" });
    });

    it("should emit when fallback language translations are updated", (done) => {
        translate.setTranslation("en", {});
        translate.setTranslation("de", { TEST: "German" });
        translate.use("en");
        translate.setFallbackLang("de");

        // Skip initial emissions, wait for translation update
        let emitCount = 0;
        translate.onTranslationRefresh.subscribe(() => {
            emitCount++;
            if (emitCount === 1) {
                expect(translate.instant("TEST")).toEqual("Updated German");
                done();
            }
        });

        translate.setTranslation("de", { TEST: "Updated German" });
    });

    it("should emit when fallback language changes", (done) => {
        translate.setTranslation("en", {});
        translate.setTranslation("de", { TEST: "German" });
        translate.setTranslation("fr", { TEST: "French" });
        translate.use("en");
        translate.setFallbackLang("de");

        translate.onTranslationRefresh.subscribe(() => {
            expect(translate.getFallbackLang()).toEqual("fr");
            done();
        });

        translate.setFallbackLang("fr");
    });

    it("should NOT emit when unrelated language translations are updated", (done) => {
        translate.setTranslation("en", { TEST: "English" });
        translate.setTranslation("fr", { TEST: "French" });
        translate.use("en");

        let emitted = false;
        translate.onTranslationRefresh.subscribe(() => {
            emitted = true;
        });

        // Update French translations while English is current (and no fallback)
        translate.setTranslation("fr", { TEST: "Updated French" });

        // Give it a moment then check
        setTimeout(() => {
            expect(emitted).toBe(false);
            done();
        }, 50);
    });
});

describe("TranslateService.currentLang signal", () => {
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({ loader: provideTranslateLoader(FakeLoader) }),
            ],
        });
        translate = TestBed.inject(TranslateService);
    });

    it("should return a Signal that reflects the current language", () => {
        translate.use("en");
        const langSignal = translate.currentLang;
        expect(langSignal()).toBe("en");
    });

    it("should update when use() is called", fakeAsync(() => {
        translate.use("en");
        const langSignal = translate.currentLang;
        expect(langSignal()).toBe("en");

        translate.use("fr");
        tick();
        expect(langSignal()).toBe("fr");
    }));

    it("should be the same reference on repeated access", () => {
        expect(translate.currentLang).toBe(translate.currentLang);
    });
});

describe("TranslateService.fallbackLang signal", () => {
    let translate: TranslateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({ loader: provideTranslateLoader(FakeLoader) }),
            ],
        });
        translate = TestBed.inject(TranslateService);
    });

    it("should return null initially", () => {
        expect(translate.fallbackLang()).toBeNull();
    });

    it("should update when setFallbackLang() is called", fakeAsync(() => {
        translate.setFallbackLang("en");
        tick();
        expect(translate.fallbackLang()).toBe("en");
    }));

    it("should be the same reference on repeated access", () => {
        expect(translate.fallbackLang).toBe(translate.fallbackLang);
    });
});

describe("error logging", () => {
    it("should warn when loader fails in use()", () => {
        const spy = spyOn(console, "warn");
        const error = new Error("Load failed");

        const errorLoader = {
            getTranslation: () => throwError(() => error),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: errorLoader },
                }),
            ],
        });

        const service = TestBed.inject(TranslateService);
        service.use("en").subscribe({ error: () => {} });

        expect(spy).toHaveBeenCalledWith(
            "@ngx-translate: error loading translations",
            error,
        );
    });

    it("should warn when loader fails in loadAndCompileTranslations()", () => {
        const spy = spyOn(console, "warn");
        const error = new Error("Load failed");

        const errorLoader = {
            getTranslation: () => throwError(() => error),
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({
                    loader: { provide: TranslateLoader, useValue: errorLoader },
                }),
            ],
        });

        const service = TestBed.inject(TranslateService);
        service.use("en");

        expect(spy).toHaveBeenCalledWith(
            "@ngx-translate: error loading translations",
            error,
        );
    });
});
