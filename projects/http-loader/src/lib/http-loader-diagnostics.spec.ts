/*
 * AI GENERATED CODE: This snippet was produced or modified by AI. Review it carefully before relying on it.
 * Model: GPT-6
 * Prompt: Cover custom loader reporting, unchanged defaults, strict errors and retries.
 */
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { provideTranslateService, TranslateLoader, TranslateService } from "@ngx-translate/core";
import {
    provideTranslateHttpLoader,
    provideTranslateMultiHttpLoader,
    TranslateMultiHttpLoaderConfig,
} from "../public-api";

describe("HTTP loader diagnostics", () => {
    let http: HttpTestingController;

    function prepare(
        config: Partial<TranslateMultiHttpLoaderConfig> = {},
        retry = 0,
    ): TranslateLoader {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideTranslateService({ loader: provideTranslateHttpLoader(config), retry }),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        return TestBed.inject(TranslateLoader);
    }

    afterEach(() => http.verify());

    it("reports the failed resource and keeps the successful resource", () => {
        const onLoadError = jasmine.createSpy("onLoadError");
        const warning = spyOn(console, "warn");
        const resource = { prefix: "/application/", suffix: ".lang.json" };
        const loader = prepare({ resources: ["/library/", resource], onLoadError });
        const next = jasmine.createSpy("next");
        loader.getTranslation("en").subscribe({ next, error: fail });
        http.expectOne("/library/en.json").flush({ TITLE: "Library" });
        http.expectOne("/application/en.lang.json").flush(null, {
            status: 404,
            statusText: "Not Found",
        });

        expect(next).toHaveBeenCalledOnceWith({ TITLE: "Library" });
        expect(onLoadError).toHaveBeenCalledOnceWith({
            lang: "en",
            resource,
            url: "/application/en.lang.json",
            error: jasmine.objectContaining({ status: 404 }),
        });
        expect(warning).not.toHaveBeenCalled();
    });

    it("forwards single-resource callbacks and reports the encoded URL including its cache buster", () => {
        const onLoadError = jasmine.createSpy("onLoadError");
        spyOn(Date, "now").and.returnValue(123);
        const loader = prepare({ onLoadError, enforceLoading: true });
        loader.getTranslation("admin/en").subscribe({ error: fail });
        http.expectOne("/assets/i18n/admin%2Fen.json?enforceLoading=123").flush(null, {
            status: 500,
            statusText: "Server Error",
        });
        expect(onLoadError).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({
                lang: "admin/en",
                url: "/assets/i18n/admin%2Fen.json?enforceLoading=123",
                resource: { prefix: "/assets/i18n/", suffix: ".json" },
            }),
        );
    });

    it("supports callbacks through the multi-resource provider directly", () => {
        const onLoadError = jasmine.createSpy("onLoadError");
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideTranslateMultiHttpLoader({ resources: ["/library/"], onLoadError }),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        TestBed.inject(TranslateLoader).getTranslation("en").subscribe({ error: fail });
        http.expectOne("/library/en.json").flush(null, { status: 500, statusText: "Server Error" });
        expect(onLoadError).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({ resource: "/library/" }),
        );
    });

    it("does not report successful requests", () => {
        const onLoadError = jasmine.createSpy("onLoadError");
        prepare({ onLoadError }).getTranslation("en").subscribe({ error: fail });
        http.expectOne("/assets/i18n/en.json").flush({ TITLE: "Title" });
        expect(onLoadError).not.toHaveBeenCalled();
    });

    it("passes the original error through strict mode", () => {
        const onLoadError = jasmine.createSpy("onLoadError");
        const warning = spyOn(console, "warn");
        const error = jasmine.createSpy("error");
        prepare({ onLoadError, failOnError: true })
            .getTranslation("en")
            .subscribe({ next: () => fail("Expected an error"), error });
        http.expectOne("/assets/i18n/en.json").flush(null, {
            status: 503,
            statusText: "Unavailable",
        });
        expect(onLoadError).toHaveBeenCalledTimes(1);
        expect(error).toHaveBeenCalledOnceWith(onLoadError.calls.mostRecent().args[0].error);
        expect(warning).not.toHaveBeenCalled();
    });

    [false, true].forEach((failOnError) => {
        it(`preserves the original failure policy if the callback throws (failOnError=${failOnError})`, () => {
            const callbackError = new Error("Reporter unavailable");
            const onLoadError = jasmine.createSpy("onLoadError").and.throwError(callbackError);
            const warning = spyOn(console, "warn");
            const next = jasmine.createSpy("next");
            const error = jasmine.createSpy("error");
            prepare({ onLoadError, failOnError }).getTranslation("en").subscribe({ next, error });
            http.expectOne("/assets/i18n/en.json").flush(null, {
                status: 500,
                statusText: "Server Error",
            });
            if (failOnError) {
                expect(error).toHaveBeenCalledOnceWith(
                    onLoadError.calls.mostRecent().args[0].error,
                );
                expect(next).not.toHaveBeenCalled();
            } else {
                expect(next).toHaveBeenCalledOnceWith({});
                expect(error).not.toHaveBeenCalled();
            }
            expect(warning).toHaveBeenCalledOnceWith(
                "@ngx-translate/http-loader: onLoadError callback failed:",
                callbackError,
            );
        });
    });

    it("reports encoding failures without inventing a request URL", () => {
        const onLoadError = jasmine.createSpy("onLoadError");
        prepare({ onLoadError }).getTranslation("\uD800").subscribe({ error: fail });
        expect(onLoadError).toHaveBeenCalledOnceWith({
            lang: "\uD800",
            resource: { prefix: "/assets/i18n/", suffix: ".json" },
            url: undefined,
            error: jasmine.any(URIError),
        });
        http.expectNone(() => true);
    });

    it("reports rejected dot segments without issuing a request", () => {
        const onLoadError = jasmine.createSpy("onLoadError");
        prepare({ onLoadError }).getTranslation("..").subscribe({ error: fail });
        expect(onLoadError).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({ lang: "..", error: jasmine.any(Error) }),
        );
        http.expectNone(() => true);
    });

    it("reports each failed attempt while leaving service retries intact", fakeAsync(() => {
        const onLoadError = jasmine.createSpy("onLoadError");
        spyOn(console, "warn");
        prepare({ onLoadError, failOnError: true }, 1);
        const translate = TestBed.inject(TranslateService);
        translate.use("en").subscribe({ error: fail });
        http.expectOne("/assets/i18n/en.json").flush(null, {
            status: 503,
            statusText: "Unavailable",
        });
        expect(onLoadError).toHaveBeenCalledTimes(1);
        expect(translate.isLoading()).toBeTrue();
        tick(100);
        http.expectOne("/assets/i18n/en.json").flush({ TITLE: "Recovered" });
        expect(translate.instant("TITLE")).toBe("Recovered");
        expect(translate.isLoading()).toBeFalse();
        expect(onLoadError).toHaveBeenCalledTimes(1);
    }));

    it("keeps the default warning when no callback is supplied", () => {
        const warning = spyOn(console, "warn");
        prepare().getTranslation("en").subscribe({ error: fail });
        http.expectOne("/assets/i18n/en.json").flush(null, {
            status: 404,
            statusText: "Not Found",
        });
        expect(warning).toHaveBeenCalledOnceWith(
            "@ngx-translate/http-loader: error loading translation for en:",
            jasmine.objectContaining({ status: 404 }),
        );
    });

    it("keeps the loader silent in strict mode without a callback", () => {
        const warning = spyOn(console, "warn");
        const error = jasmine.createSpy("error");
        prepare({ failOnError: true }).getTranslation("en").subscribe({ error });
        http.expectOne("/assets/i18n/en.json").flush(null, {
            status: 500,
            statusText: "Server Error",
        });
        expect(error).toHaveBeenCalledTimes(1);
        expect(warning).not.toHaveBeenCalled();
    });
});
