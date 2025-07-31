import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideTranslateService, TranslateService, Translation } from "@ngx-translate/core";
import {
    provideTranslateHttpLoader,
    provideTranslateMultiHttpLoader,
    TranslateHttpLoader,
    TranslateHttpLoaderConfig,
    TranslateMultiHttpLoaderConfig,
} from "../public-api";
import { MarkerInterceptor } from "../test-helper/marker-interceptor";

describe("TranslateHttpLoader (HttpClient)", () => {
    let translate: TranslateService;
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
                provideTranslateService(),
                provideTranslateMultiHttpLoader(config),
            ],
        });

        translate = TestBed.inject(TranslateService);
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
                provideTranslateService(),
                provideTranslateHttpLoader(config),
            ],
        });

        translate = TestBed.inject(TranslateService);
        http = TestBed.inject(HttpTestingController);
    };

    afterEach(() => {
        http.verify();
    });

    it("should be able to provide TranslateHttpLoader", () => {
        prepareSingle();
        expect(TranslateHttpLoader).toBeDefined();
        expect(translate.currentLoader).toBeDefined();
        expect(translate.currentLoader instanceof TranslateHttpLoader).toBeTruthy();
    });

    describe("Config", () => {
        it("uses prefix", () => {
            prepareSingle({ prefix: "XXXX/" });
            translate.use("en");
            http.expectOne("XXXX/en.json").flush({});
            expect(true).toBeTruthy(); // http.expectOne() is not detected by jasmine...
        });

        it("uses suffix", () => {
            prepareSingle({ suffix: ".XXXX" });
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

    it("should trigger MarkerInterceptor when loading translations", () => {
        prepareSingle();

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
});
