/**
 * Regression tests for https://github.com/ngx-translate/core/issues/1694
 * "Tighten TranslatePipe public argument types in the next major release"
 *
 * Checks that the `TranslatePipe.transform()` signature only accepts the documented arguments
 * (query, params, lang) and that unsupported values are still ignored at runtime, as before.
 * Template checks (strictTemplates/AOT) live in the `pipe-check` project, because Karma runs in
 * JIT mode and does not type-check templates.
 */
import { TestBed } from "@angular/core/testing";
import {
    Language,
    provideTranslateLoader,
    provideTranslateService,
    TranslatePipe,
    TranslatePipeParams,
    TranslateService,
} from "../public-api";
import { DelayedFakeLoader } from "./test-helpers";

// ---------------------------------------------------------------------------
// Compile-time checks (run by `tsc` when the test bundle is compiled)
// ---------------------------------------------------------------------------
type IsAny<T> = 0 extends 1 & T ? true : false;
type IsEqual<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type TransformParams = Parameters<TranslatePipe["transform"]>;

// The interpolation parameter is no longer `any`: it has an explicit type.
export type Check1694_ParamsNotAny = Expect<IsEqual<IsAny<TransformParams[1]>, false>>;
export type Check1694_ParamsType = Expect<
    IsEqual<TransformParams[1], TranslatePipeParams | null | undefined>
>;

// No rest parameter: at most 3 arguments.
export type Check1694_Arity = Expect<IsEqual<TransformParams["length"], 1 | 2 | 3>>;

// `lang` is typed and accepts `null` (e.g. `lang$ | async`).
export type Check1694_LangType = Expect<IsEqual<TransformParams[2], Language | null | undefined>>;

// Migration case from the issue: the extracted parameter type now requires narrowing.
export function readName(params: TransformParams[1]): unknown {
    // @ts-expect-error -- `params` may be null/undefined/string: narrowing is required
    void params.name;
    return params && typeof params === "object" ? params["name"] : undefined;
}

// ---------------------------------------------------------------------------
// Runtime checks
// ---------------------------------------------------------------------------
describe("TranslatePipe – issue #1694 (tightened signature)", () => {
    let translate: TranslateService;
    let pipe: TranslatePipe;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideTranslateService({ loader: provideTranslateLoader(DelayedFakeLoader) }),
                { provide: TranslatePipe, useClass: TranslatePipe },
            ],
        });

        translate = TestBed.inject(TranslateService);
        pipe = TestBed.inject(TranslatePipe);

        translate.setTranslation("en", { HELLO: "Hello {{name}}" });
        translate.setTranslation("fr", { HELLO: "Bonjour {{name}}" });
        translate.use("en");
    });

    it("rejects `false` (e.g. from `enabled && params`) and accepts the ternary form", () => {
        const enabled = false as boolean;
        const params = { name: "Ada" };

        // @ts-expect-error -- `false` is not a valid parameter
        expect(pipe.transform("HELLO", enabled && params)).toEqual(pipe.transform("HELLO"));
        expect(pipe.transform("HELLO", enabled ? params : undefined)).toEqual(
            pipe.transform("HELLO"),
        );
    });

    it("rejects other unsupported values, which are still ignored at runtime", () => {
        const withoutParams = pipe.transform("HELLO");

        // @ts-expect-error -- number
        expect(pipe.transform("HELLO", 42)).toEqual(withoutParams);
        // @ts-expect-error -- boolean
        expect(pipe.transform("HELLO", true)).toEqual(withoutParams);
    });

    it("still accepts arrays and functions at type level (limit of `Record<string, any>`)", () => {
        // These are not compile errors: `Record<string, any>` accepts any object, functions
        // included. At runtime `isDict()` rejects both, so they are ignored.
        const withoutParams = pipe.transform("HELLO");
        expect(pipe.transform("HELLO", ["Ada"])).toEqual(withoutParams);
        expect(pipe.transform("HELLO", () => ({ name: "Ada" }))).toEqual(withoutParams);
    });

    it("rejects extra arguments", () => {
        // @ts-expect-error -- 4 arguments
        expect(pipe.transform("HELLO", { name: "Ada" }, undefined, "ignored")).toEqual("Hello Ada");
    });

    it("uses the language passed as third argument", () => {
        expect(pipe.transform("HELLO", { name: "Ada" }, "fr")).toEqual("Bonjour Ada");
    });

    it("uses the current language when lang is `null` or `undefined`", () => {
        expect(pipe.transform("HELLO", { name: "Ada" }, null)).toEqual("Hello Ada");
        expect(pipe.transform("HELLO", { name: "Ada" }, undefined)).toEqual("Hello Ada");
    });

    it("updates the result when only the language changes", () => {
        const params = { name: "Ada" };
        expect(pipe.transform("HELLO", params, "en")).toEqual("Hello Ada");
        expect(pipe.transform("HELLO", params, "fr")).toEqual("Bonjour Ada");
        expect(pipe.transform("HELLO", params, null)).toEqual("Hello Ada");
    });

    it("keeps the supported shapes working", () => {
        expect(pipe.transform("HELLO", { name: "Ada" })).toEqual("Hello Ada");
        expect(pipe.transform("HELLO", "{name:'Ada'}")).toEqual("Hello Ada");
        expect(pipe.transform("HELLO", null)).toEqual(pipe.transform("HELLO"));
        expect(pipe.transform("HELLO", undefined)).toEqual(pipe.transform("HELLO"));
        expect(pipe.transform(null)).toBeNull();
        expect(pipe.transform(undefined)).toBeUndefined();
    });

    it("accepts objects typed with an interface", () => {
        interface User {
            name: string;
        }
        const user: User = { name: "Ada" };
        expect(pipe.transform("HELLO", user)).toEqual("Hello Ada");
    });
});
