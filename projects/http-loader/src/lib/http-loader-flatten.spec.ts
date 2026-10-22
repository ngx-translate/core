import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import {
    provideTranslateService,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "@ngx-translate/core";
import {
    provideTranslateHttpLoader,
    provideTranslateMultiHttpLoader,
    TranslateMultiHttpLoaderConfig,
} from "../public-api";

describe("HTTP loader resource flattening", () => {
    let http: HttpTestingController;

    function prepare(config: Partial<TranslateMultiHttpLoaderConfig> = {}): TranslateService {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideTranslateService({ loader: provideTranslateHttpLoader(config) }),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        return TestBed.inject(TranslateService);
    }

    afterEach(() => http.verify());

    const formats: { name: string; library: TranslationObject; application: TranslationObject }[] =
        [
            {
                name: "nested then flat",
                library: { menu: { title: "Library", help: "Help" } },
                application: { "menu.title": "Application" },
            },
            {
                name: "flat then nested",
                library: { "menu.title": "Library", "menu.help": "Help" },
                application: { menu: { title: "Application" } },
            },
            {
                name: "nested then nested",
                library: { menu: { title: "Library", help: "Help" } },
                application: { menu: { title: "Application" } },
            },
            {
                name: "flat then flat",
                library: { "menu.title": "Library", "menu.help": "Help" },
                application: { "menu.title": "Application" },
            },
        ];

    formats.forEach(({ name, library, application }) => {
        it(`preserves resource order for ${name}, regardless of completion order`, () => {
            const translate = prepare({
                resources: ["/library/", { prefix: "/application/", suffix: ".lang.json" }],
                flatten: true,
            });
            translate.use("en").subscribe({ error: fail });
            http.expectOne("/application/en.lang.json").flush(application);
            http.expectOne("/library/en.json").flush(library);

            expect(translate.instant("menu.title")).toBe("Application");
            expect(translate.instant("menu.help")).toBe("Help");
        });
    });

    it("replaces an earlier array with a later empty object at the same flattened key", () => {
        const translate = prepare({ resources: ["/library/", "/application/"], flatten: true });
        const next = jasmine.createSpy("next");
        translate.use("en").subscribe({ next, error: fail });
        http.expectOne("/application/en.json").flush({ "menu.items": {} });
        http.expectOne("/library/en.json").flush({
            menu: { items: ["Library"], help: "Help" },
        });

        expect(next).toHaveBeenCalledOnceWith({ "menu.items": {}, "menu.help": "Help" });
        expect(translate.instant("menu.items")).toEqual({});
        expect(translate.instant("menu.help")).toBe("Help");
    });

    [undefined, false].forEach((flatten) => {
        it(`keeps existing nested lookup precedence with flatten=${flatten}`, () => {
            const translate = prepare({ resources: ["/library/", "/application/"], flatten });
            translate.use("en").subscribe({ error: fail });
            http.expectOne("/library/en.json").flush({ menu: { title: "Library" } });
            http.expectOne("/application/en.json").flush({ "menu.title": "Application" });

            expect(translate.instant("menu.title")).toBe("Library");
            expect(translate.instant("menu")).toEqual({ title: "Library" });
        });
    });

    it("forwards flatten for single-resource configuration and preserves translation values", () => {
        prepare({ flatten: true });
        const next = jasmine.createSpy("next");
        TestBed.inject(TranslateLoader).getTranslation("en").subscribe({ next, error: fail });
        http.expectOne("/assets/i18n/en.json").flush({
            menu: {
                title: "Title",
                empty: "",
                absent: null,
                items: ["One", { label: "Two" }],
                group: {},
            },
        });

        expect(next).toHaveBeenCalledOnceWith({
            "menu.title": "Title",
            "menu.empty": "",
            "menu.absent": null,
            "menu.items": ["One", { label: "Two" }],
            "menu.group": {},
        });
    });

    it("supports the multi-resource provider directly and resolves in-file collisions in entry order", () => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideTranslateMultiHttpLoader({ resources: ["/library/"], flatten: true }),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        const next = jasmine.createSpy("next");
        TestBed.inject(TranslateLoader).getTranslation("en").subscribe({ next, error: fail });
        http.expectOne("/library/en.json").flush({
            menu: { title: "Earlier" },
            "menu.title": "Later",
            "footer.title": "Earlier",
            footer: { title: "Later" },
        });
        expect(next).toHaveBeenCalledOnceWith({ "menu.title": "Later", "footer.title": "Later" });
    });

    [false, true].forEach((failOnError) => {
        it(`keeps successful resources when another returns HTTP 204 with failOnError=${failOnError}`, () => {
            const onLoadError = jasmine.createSpy("onLoadError");
            const translate = prepare({
                resources: ["/library/", "/application/"],
                flatten: true,
                failOnError,
                onLoadError,
            });
            const next = jasmine.createSpy("next");
            translate.use("en").subscribe({ next, error: fail });
            http.expectOne("/library/en.json").flush({ menu: { title: "Library" } });
            http.expectOne("/application/en.json").flush(null, {
                status: 204,
                statusText: "No Content",
            });

            expect(next).toHaveBeenCalledOnceWith({ "menu.title": "Library" });
            expect(translate.instant("menu.title")).toBe("Library");
            expect(onLoadError).not.toHaveBeenCalled();
        });
    });

    it("keeps successful resources when another resource fails", () => {
        spyOn(console, "warn");
        const translate = prepare({ resources: ["/library/", "/application/"], flatten: true });
        translate.use("en").subscribe({ error: fail });
        http.expectOne("/library/en.json").flush({ menu: { title: "Library" } });
        http.expectOne("/application/en.json").flush(null, {
            status: 404,
            statusText: "Not Found",
        });
        expect(translate.instant("menu.title")).toBe("Library");
    });

    it("still propagates errors with failOnError", () => {
        prepare({ resources: ["/library/"], flatten: true, failOnError: true });
        const error = jasmine.createSpy("error");
        TestBed.inject(TranslateLoader)
            .getTranslation("en")
            .subscribe({ next: () => fail("Expected an error"), error });
        http.expectOne("/library/en.json").flush(null, { status: 500, statusText: "Server Error" });
        expect(error).toHaveBeenCalledOnceWith(jasmine.objectContaining({ status: 500 }));
    });

    it("returns an empty object for no resources", () => {
        prepare({ resources: [], flatten: true });
        const next = jasmine.createSpy("next");
        TestBed.inject(TranslateLoader).getTranslation("en").subscribe({ next, error: fail });
        expect(next).toHaveBeenCalledOnceWith({});
        http.expectNone(() => true);
    });
});
