import { TestBed } from "@angular/core/testing";
import { ITranslateService, provideTranslateService, TranslateService } from "../public-api";

type LegacyService = Omit<
    ITranslateService,
    | "getAsync"
    | "hasTranslationKey"
    | "deleteLanguage"
    | "setFallbackLangs"
    | "getFallbackLangs"
    | "fallbackLangs"
>;

// Assignment must compile for implementations of the v18.0 contract.
function acceptLegacyService(service: LegacyService): ITranslateService {
    return service;
}

describe("ITranslateService compatibility", () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    });

    it("accepts the legacy service contract", () => {
        const service = TestBed.inject(TranslateService);
        service.setTranslation("en", { HELLO: "Hello" });
        service.use("en");
        expect(acceptLegacyService(service).instant("HELLO")).toBe("Hello");
    });

    it("exposes new capabilities without requiring them from legacy implementations", async () => {
        const service: ITranslateService = TestBed.inject(TranslateService);
        service.setTranslation("en", { HELLO: "Hello {{name}}" });
        service.use("en");

        expect(service.hasTranslationKey?.("HELLO", "en")).toBeTrue();
        expect(await service.getAsync?.(["HELLO"], { name: "Ada" }, "en")).toEqual({
            HELLO: "Hello Ada",
        });
        service.deleteLanguage?.("en");
        expect(service.hasTranslationKey?.("HELLO")).toBeFalse();
    });
});
