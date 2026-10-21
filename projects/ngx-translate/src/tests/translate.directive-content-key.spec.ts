import { ChangeDetectorRef, ElementRef } from "@angular/core";
import { ContentKeyHandler } from "../lib/translate-content-key";
import { TranslateService } from "../lib/translate.service";

/**
 * Regression spec for commit d5ba88e:
 * ContentKeyHandler changed from once-per-page console.warn to per-instance
 * console.warn that includes the offending element as the second argument.
 * These tests lock in that behavior so a future "deduplication" refactor
 * cannot silently revert it.
 */
describe("TranslateDirective — deprecated content-as-key", () => {
    const DEPRECATION_MSG = "Using element content as a translation key";

    const makeElementRef = (tagName = "DIV"): ElementRef => {
        const el = document.createElement(tagName);
        return { nativeElement: el } as ElementRef;
    };

    const makeCdRef = (): ChangeDetectorRef =>
        ({ markForCheck: () => undefined }) as unknown as ChangeDetectorRef;

    const makeTranslateServiceStub = (): TranslateService =>
        ({
            instant: (key: string) => key,
            onTranslationRefresh: { pipe: () => ({ subscribe: () => undefined }) },
        }) as unknown as TranslateService;

    it("warns once per element when content is used as key", () => {
        const spy = vi.spyOn(console, "warn").mockReturnValue(undefined);

        const el1 = makeElementRef("DIV");
        const el2 = makeElementRef("SPAN");
        const cd = makeCdRef();
        const svc = makeTranslateServiceStub();

        new ContentKeyHandler(el1, cd, svc);
        new ContentKeyHandler(el2, cd, svc);

        const deprecationCalls = vi
            .mocked(spy)
            .mock.calls.filter((c) => typeof c[0] === "string" && c[0].includes(DEPRECATION_MSG));

        expect(deprecationCalls.length).toBe(2);
    });

    it("includes the offending element as the second console.warn arg", () => {
        const spy = vi.spyOn(console, "warn").mockReturnValue(undefined);

        const el = makeElementRef("DIV");
        const cd = makeCdRef();
        const svc = makeTranslateServiceStub();

        new ContentKeyHandler(el, cd, svc);

        const deprecationCall = vi
            .mocked(spy)
            .mock.calls.find((c) => typeof c[0] === "string" && c[0].includes(DEPRECATION_MSG));

        expect(deprecationCall).toBeDefined();
        expect(deprecationCall![1]).toBeInstanceOf(HTMLElement);
        expect((deprecationCall![1] as HTMLElement).tagName).toBe("DIV");
    });
});
