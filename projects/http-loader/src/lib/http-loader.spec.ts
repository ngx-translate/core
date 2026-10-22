import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { TranslateService, Translation } from "@ngx-translate/core";
import {
    provideTranslateHttpLoader,
    provideTranslateMultiHttpLoader,
    TranslateHttpLoader,
    TranslateHttpLoaderConfig,
    TranslateMultiHttpLoaderConfig,
} from "../public-api";
import { MarkerInterceptor } from "../test-helper/marker-interceptor";
import {
    provideTestableTranslateService,
    TestableTranslateService,
} from "../test-helper/testable-translate-service";

describe("TranslateHttpLoader (HttpClient)", () => {
    let translate: TestableTranslateService;
    let http: HttpTestingController;

    const prepareMulti = (config: Partial<TranslateMultiHttpLoaderConfig> = {}) => {
        TestBed.configureTestingModule({
            providers: [
                MarkerInterceptor,
                {
                    provide: HTTP_INTERCEPTORS,
                    useExisting: MarkerInterceptor,
                    multi: true,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                provideTestableTranslateService({
                    loader: provideTranslateMultiHttpLoader(config),
                }),
            ],
        });

        translate = TestBed.inject(TranslateService) as TestableTranslateService;
        http = TestBed.inject(HttpTestingController);
    };

    const prepareSingle = (config: Partial<TranslateHttpLoaderConfig> = {}) => {
        TestBed.configureTestingModule({
            providers: [
                MarkerInterceptor,
                {
                    provide: HTTP_INTERCEPTORS,
                    useExisting: MarkerInterceptor,
                    multi: true,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                provideTestableTranslateService({
                    loader: provideTranslateHttpLoader(config),
                }),
            ],
        });

        translate = TestBed.inject(TranslateService) as TestableTranslateService;
        http = TestBed.inject(HttpTestingController);
    };

    afterEach(() => {
        http.verify();
    });

    it("should be able to provide TranslateHttpLoader", () => {
        prepareSingle();
        expect(TranslateHttpLoader).toBeDefined();
        expect(translate.getCurrentLoader()).toBeDefined();
        expect(translate.getCurrentLoader() instanceof TranslateHttpLoader).toBeTruthy();
    });

    describe("Config", () => {
        it("uses prefix", () => {
            prepareSingle({ prefix: "XXXX/" });
            translate.use("en");
            http.expectOne("XXXX/en.json").flush({});
            expect(true).toBeTruthy(); // http.expectOne() is not detected by jasmine...
        });

        it("uses multipleHttpLoader prefix", () => {
            prepareMulti({ resources: ["XXXX/", "YYYY/"] });
            translate.use("en");
            http.expectOne("XXXX/en.json").flush({});
            http.expectOne("YYYY/en.json").flush({});
            expect(true).toBeTruthy(); // http.expectOne() is not detected by jasmine...
        });

        it("uses suffix", () => {
            prepareSingle({ suffix: ".XXXX" });
            translate.use("en");
            http.expectOne("/assets/i18n/en.XXXX").flush({});
            expect(true).toBeTruthy(); // http.expectOne() is not detected by jasmine...
        });

        it("uses multipleHttpLoader suffix", () => {
            prepareMulti({ resources: [{ prefix: "/assets/i18n/", suffix: ".XXXX" }] });
            translate.use("en");
            http.expectOne("/assets/i18n/en.XXXX").flush({});
            expect(true).toBeTruthy(); // http.expectOne() is not detected by jasmine...
        });

        it("uses cache buster", () => {
            prepareSingle({ enforceLoading: true });
            translate.use("en");
            http.expectOne((req) =>
                req.url.startsWith("/assets/i18n/en.json?enforceLoading="),
            ).flush({});
            expect(true).toBeTruthy(); // http.expectOne() is not detected by jasmine...
        });
    });

    it("should be able to get translations", () => {
        prepareSingle();

        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res as string).toEqual("This is a test");
        });

        // mock response after the xhr request, otherwise it will be undefined
        http.expectOne("/assets/i18n/en.json").flush({
            TEST: "This is a test",
            TEST2: "This is another test",
        });

        // this will request the translation from downloaded translations without making a request to the backend
        translate.get("TEST2").subscribe((res: Translation) => {
            expect(res as string).toEqual("This is another test");
        });
    });

    it("should be able to get translations from multipleHttpLoader", () => {
        prepareMulti();

        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res as string).toEqual("This is a test");
        });

        // mock response after the xhr request, otherwise it will be undefined
        http.expectOne("/assets/i18n/en.json").flush({
            TEST: "This is a test",
            TEST2: "This is another test",
        });

        // this will request the translation from downloaded translations without making a request to the backend
        translate.get("TEST2").subscribe((res: Translation) => {
            expect(res as string).toEqual("This is another test");
        });
    });

    it("should trigger MarkerInterceptor when loading translations", () => {
        prepareSingle();

        translate.use("en").subscribe();

        const req = http.expectOne("/assets/i18n/en.json");
        req.flush({ HELLO: "Hello" });

        expect(req.request.headers.get("X-Test-Header")).toBe("marker");
    });

    it("should trigger MarkerInterceptor when loading translations with multipleHttpLoader", () => {
        prepareMulti();

        translate.use("en").subscribe();

        const req = http.expectOne("/assets/i18n/en.json");
        req.flush({ HELLO: "Hello" });

        expect(req.request.headers.get("X-Test-Header")).toBe("marker");
    });

    it("should be able to reload a lang", () => {
        prepareSingle();

        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res as string).toEqual("This is a test");

            // reset the lang as if it was never initiated
            translate.reloadLang("en").subscribe(() => {
                expect(translate.instant("TEST") as string).toEqual("This is a test 2");
            });

            http.expectOne("/assets/i18n/en.json").flush({ TEST: "This is a test 2" });
        });

        // mock response after the xhr request, otherwise it will be undefined
        http.expectOne("/assets/i18n/en.json").flush({ TEST: "This is a test" });
    });

    it("should be able to reload a lang with multipleHttpLoader", () => {
        prepareMulti();

        translate.use("en");

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res as string).toEqual("This is a test");

            // reset the lang as if it was never initiated
            translate.reloadLang("en").subscribe(() => {
                expect(translate.instant("TEST") as string).toEqual("This is a test 2");
            });

            http.expectOne("/assets/i18n/en.json").flush({ TEST: "This is a test 2" });
        });

        // mock response after the xhr request, otherwise it will be undefined
        http.expectOne("/assets/i18n/en.json").flush({ TEST: "This is a test" });
    });

    it("should be able to reset a lang", (done: DoneFn) => {
        prepareSingle();

        translate.use("en");
        spyOn(http, "expectOne").and.callThrough();

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res as string).toEqual("This is a test");
            expect(http.expectOne).toHaveBeenCalledTimes(1);

            // reset the lang as if it was never initiated
            translate.resetLang("en");

            expect(translate.instant("TEST") as string).toEqual("TEST");

            // use set timeout because no request is really made and we need to trigger zone to resolve the observable
            setTimeout(() => {
                translate.get("TEST").subscribe((res2: Translation) => {
                    expect(res2 as string).toEqual("TEST"); // because the loader is "pristine" as if it was never called
                    expect(http.expectOne).toHaveBeenCalledTimes(1);
                    done();
                });
            }, 10);
        });

        // mock response after the xhr request, otherwise it will be undefined
        http.expectOne("/assets/i18n/en.json").flush({ TEST: "This is a test" });
    });

    it("should be able to reset a lang from MultiHttpLoader", (done: DoneFn) => {
        prepareMulti();

        translate.use("en");
        spyOn(http, "expectOne").and.callThrough();

        // this will request the translation from the backend because we use a static files loader for TranslateService
        translate.get("TEST").subscribe((res: Translation) => {
            expect(res as string).toEqual("This is a test");
            expect(http.expectOne).toHaveBeenCalledTimes(1);

            // reset the lang as if it was never initiated
            translate.resetLang("en");

            expect(translate.instant("TEST") as string).toEqual("TEST");

            // use set timeout because no request is really made and we need to trigger zone to resolve the observable
            setTimeout(() => {
                translate.get("TEST").subscribe((res2: Translation) => {
                    expect(res2 as string).toEqual("TEST"); // because the loader is "pristine" as if it was never called
                    expect(http.expectOne).toHaveBeenCalledTimes(1);
                    done();
                });
            }, 10);
        });

        // mock response after the xhr request, otherwise it will be undefined
        http.expectOne("/assets/i18n/en.json").flush({ TEST: "This is a test" });
    });

    it("should merge translations from multiple resources", () => {
        prepareMulti({
            resources: ["/assets/i18n/", { prefix: "/custom/", suffix: ".lang.json" }],
        });
        translate.use("en").subscribe();
        http.expectOne("/assets/i18n/en.json").flush({ TEST: "A", ONLY1: "X" });
        http.expectOne("/custom/en.lang.json").flush({ TEST: "B", ONLY2: "Y" });
        // TEST should be overwritten by the second resource
        expect(translate.instant("TEST")).toBe("B");
        expect(translate.instant("ONLY1")).toBe("X");
        expect(translate.instant("ONLY2")).toBe("Y");
    });

    it("should handle error in one resource and still merge others", () => {
        spyOn(console, "warn");
        prepareMulti({
            resources: ["/assets/i18n/", { prefix: "/custom/", suffix: ".lang.json" }],
        });
        translate.use("en").subscribe();
        http.expectOne("/assets/i18n/en.json").flush({ TEST: "A" });
        http.expectOne("/custom/en.lang.json").flush(null, {
            status: 500,
            statusText: "Server Error",
        });
        expect(translate.instant("TEST")).toBe("A");
    });

    it("should log warning on failed resource", () => {
        prepareMulti({
            resources: ["/assets/i18n/", { prefix: "/custom/", suffix: ".lang.json" }],
        });
        const spy = spyOn(console, "warn");
        translate.use("en").subscribe();
        http.expectOne("/assets/i18n/en.json").flush({ TEST: "A" });
        http.expectOne("/custom/en.lang.json").flush(null, {
            status: 500,
            statusText: "Server Error",
        });
        expect(spy).toHaveBeenCalledWith(
            "@ngx-translate/http-loader: error loading translation for en:",
            jasmine.any(Object),
        );
    });

    it("should fallback to empty object if all resources fail", () => {
        spyOn(console, "warn");
        prepareMulti({
            resources: ["/assets/i18n/", { prefix: "/custom/", suffix: ".lang.json" }],
        });
        translate.use("en").subscribe();
        http.expectOne("/assets/i18n/en.json").flush(null, {
            status: 500,
            statusText: "Server Error",
        });
        http.expectOne("/custom/en.lang.json").flush(null, {
            status: 500,
            statusText: "Server Error",
        });
        expect(translate.instant("ANY")).toBe("ANY");
    });

    it("should support resource as string and object with suffix", () => {
        prepareMulti({
            resources: ["/assets/i18n/", { prefix: "/custom/", suffix: ".lang.json" }],
        });
        translate.use("en").subscribe();
        http.expectOne("/assets/i18n/en.json").flush({ TEST: "A" });
        http.expectOne("/custom/en.lang.json").flush({ TEST: "B" });
        expect(translate.instant("TEST")).toBe("B");
    });

    it("returns empty translations when resources is []", (done: DoneFn) => {
        prepareMulti({ resources: [] });

        let completed = false;
        translate.use("en").subscribe({
            next: () => {
                completed = true;
            },
            complete: done,
            error: done.fail,
        });

        // No HTTP requests should be pending — forkJoin([]) must not hang
        http.verify();

        expect(completed).toBeTrue();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(translate.getTranslations("en") as any).toEqual({});
    });

    describe("language id confinement", () => {
        const origin = "https://app.example";

        beforeEach(() => {
            spyOn(console, "warn");
        });

        const requestUrlsFor = (lang: string): URL[] => {
            translate.use(lang).subscribe({ error: () => undefined });
            const requests = http.match(() => true);
            requests.forEach((request) => request.flush({}));
            return requests.map((request) => new URL(request.request.url, `${origin}/`));
        };

        const hostileLanguageIds = [
            "../../api/user/profile",
            "..\\..\\uploads\\42",
            "../../uploads/42.json#",
            "en?redirect=1&x=",
            "https://evil.example/x",
            "//evil.example/x",
            "%2e%2e/%2e%2e/uploads/42",
        ];

        hostileLanguageIds.forEach((lang) => {
            it(`keeps "${lang}" beneath the prefix with the suffix intact`, () => {
                prepareSingle({ prefix: "/assets/i18n/", suffix: ".json" });

                requestUrlsFor(lang).forEach((url) => {
                    expect(url.origin).toBe(origin);
                    expect(url.pathname.startsWith("/assets/i18n/")).toBeTrue();
                    expect(url.pathname.endsWith(".json")).toBeTrue();
                    expect(url.pathname.slice("/assets/i18n/".length)).not.toContain("/");
                    expect(url.search).toBe("");
                    expect(url.hash).toBe("");
                });
            });
        });

        it("cannot change the origin when the prefix is empty", () => {
            prepareSingle({ prefix: "", suffix: ".json" });

            requestUrlsFor("https://evil.example/x").forEach((url) => {
                expect(url.origin).toBe(origin);
            });
        });

        ["..", "."].forEach((lang) => {
            it(`does not request a "${lang}" dot segment`, () => {
                prepareMulti({ resources: [{ prefix: "/locales/", suffix: "/common.json" }] });

                expect(requestUrlsFor(lang)).toEqual([]);
            });
        });

        ["\uD800", "\uDC00"].forEach((lang) => {
            it(`returns empty translations for malformed Unicode ${JSON.stringify(lang)} by default`, () => {
                prepareMulti({
                    resources: ["/assets/i18n/", { prefix: "/custom/", suffix: ".lang.json" }],
                });
                const next = jasmine.createSpy("next");
                const complete = jasmine.createSpy("complete");

                translate.use(lang).subscribe({ next, complete, error: fail });

                expect(next).toHaveBeenCalledOnceWith({});
                expect(complete).toHaveBeenCalledTimes(1);
                expect(console.warn).toHaveBeenCalledTimes(2);
                expect(console.warn).toHaveBeenCalledWith(
                    `@ngx-translate/http-loader: error loading translation for ${lang}:`,
                    jasmine.any(URIError),
                );
                expect(translate.isLoading()).toBeFalse();
                http.expectNone(() => true);
            });

            it(`forwards malformed Unicode ${JSON.stringify(lang)} errors and rolls back the initial language with failOnError`, () => {
                prepareSingle({ failOnError: true });
                const error = jasmine.createSpy("error");

                translate.use(lang).subscribe({
                    next: () => fail("Expected an encoding error, got translations"),
                    error,
                });

                expect(error).toHaveBeenCalledOnceWith(jasmine.any(URIError));
                expect(translate.getCurrentLang()).toBeNull();
                expect(translate.isLoading()).toBeFalse();
                http.expectNone(() => true);

                translate.use("en").subscribe({ error: fail });
                http.expectOne("/assets/i18n/en.json").flush({ TEST: "A" });
                expect(translate.getCurrentLang()).toBe("en");
                expect(translate.instant("TEST")).toBe("A");
            });
        });

        it("encodes a slash in the language id", () => {
            prepareSingle({ prefix: "/assets/i18n/", suffix: ".json" });

            translate.use("admin/en").subscribe();

            http.expectOne("/assets/i18n/admin%2Fen.json").flush({ TEST: "A" });
            expect(translate.instant("TEST")).toBe("A");
        });

        it("still loads ordinary language ids unchanged", () => {
            prepareSingle({ prefix: "/assets/i18n/", suffix: ".json" });

            const urls = ["en", "en-US", "zh_Hant", "sr-Latn-RS"].flatMap(requestUrlsFor);

            expect(urls.map((url) => url.pathname)).toEqual([
                "/assets/i18n/en.json",
                "/assets/i18n/en-US.json",
                "/assets/i18n/zh_Hant.json",
                "/assets/i18n/sr-Latn-RS.json",
            ]);
        });
    });

    describe("F8 failOnError", () => {
        it("failOnError: true forwards HTTP errors to translate.use()", (done: DoneFn) => {
            spyOn(console, "warn");
            prepareMulti({
                resources: ["/assets/i18n/"],
                failOnError: true,
            });

            let errored = false;
            translate.use("en").subscribe({
                next: () => done.fail("Expected an error, got a next value"),
                error: (err: unknown) => {
                    errored = true;
                    expect(errored).toBeTrue();
                    expect(err).toBeDefined();
                    done();
                },
            });

            http.expectOne("/assets/i18n/en.json").flush(null, {
                status: 500,
                statusText: "Server Error",
            });
        });

        it("failOnError: true via single-config provideTranslateHttpLoader path", (done: DoneFn) => {
            // Uses the provideTranslateHttpLoader(single) overload which converts to
            // multi-config at http-loader.ts:101-114. Verifies failOnError is preserved.
            spyOn(console, "warn");
            prepareSingle({
                prefix: "/i18n/",
                suffix: ".json",
                failOnError: true,
            });

            let errored = false;
            translate.use("en").subscribe({
                next: () => done.fail("Expected an error, got a next value"),
                error: (err: unknown) => {
                    errored = true;
                    expect(errored).toBeTrue();
                    expect(err).toBeDefined();
                    done();
                },
            });

            http.expectOne("/i18n/en.json").flush(null, {
                status: 500,
                statusText: "Server Error",
            });
        });

        it("failOnError defaults to false (silent swallow)", () => {
            // Regression guard: the default must stay false (swallow errors silently).
            spyOn(console, "warn");
            prepareSingle({ prefix: "/assets/i18n/", suffix: ".json" }); // no failOnError

            let resolved = false;
            translate.use("en").subscribe({
                next: () => {
                    resolved = true;
                },
                error: () => fail("Expected silent swallow, got an error"),
            });

            http.expectOne("/assets/i18n/en.json").flush(null, {
                status: 500,
                statusText: "Server Error",
            });

            expect(resolved).toBeTrue();
            expect(translate.instant("ANY")).toBe("ANY"); // no translations loaded
        });
    });
});
