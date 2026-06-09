import { Injector } from "@angular/core";
import { provideTranslateService, TranslateService } from "../public-api";

// getTranslations() returns DeepReadonly<...>; flatten for value assertions so
// toEqual doesn't recurse the mapped type (TS2589).
type PlainTranslations = Record<string, unknown>;

describe("TranslateService.getTranslations()", () => {
    function createService(): TranslateService {
        const injector = Injector.create({
            providers: [provideTranslateService()],
        });
        return injector.get(TranslateService);
    }

    it("returns the loaded translation map for a known language", () => {
        const service = createService();
        service.setTranslation("en", { A: "1", NESTED: { B: "2" } });

        expect(service.getTranslations("en") as PlainTranslations).toEqual({
            A: "1",
            NESTED: { B: "2" },
        });
    });

    it("returns undefined for an unloaded language", () => {
        const service = createService();
        service.setTranslation("en", { A: "1" });

        expect(service.getTranslations("xx")).toBeUndefined();
    });
});
