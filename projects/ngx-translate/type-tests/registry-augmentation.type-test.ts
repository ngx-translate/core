/**
 * Isolated type-test — NOT part of the karma spec suite.
 *
 * `NgxTranslateConfig` augmentation is compilation-global: doing it inside the
 * shared spec program would retype every other spec that uses arbitrary string
 * keys. So the global-default path is proven here, in its own `tsc` program
 * (see `tsconfig.json` in this folder, run via `pnpm run test-types`).
 *
 * This proves the half the per-instance generic can't: that augmenting the
 * registry retypes the DEFAULT service, pipe and directive — the ones Angular
 * resolves in templates, where no type argument can be passed.
 */
import {
    DeepKeys,
    injectTranslateService,
    translate,
    TranslateBlockContext,
    TranslateDirective,
    TranslatePipe,
    TranslateService,
    TranslationKey,
} from "@ngx-translate/core";
import { inject } from "@angular/core";

// Stands in for `typeof en` where `en` is a statically-imported translation
// JSON (the documented usage); a literal type exercises DeepKeys identically.
interface EnTranslations {
    home: { title: "Home"; subtitle: "Welcome" };
    nav: { back: "Back" };
}

type AppKeys = "home.title" | "home.subtitle" | "nav.back";

declare module "@ngx-translate/core" {
    interface NgxTranslateConfig {
        keys: DeepKeys<EnTranslations>;
    }
}

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// 1. Augmenting the registry (with a DeepKeys-derived union) resolves the
//    library-wide default key type to that union.
type _ResolvedKey = Expect<Equal<TranslationKey, AppKeys>>;

// 2. The default service — `inject(TranslateService)`, no generic — is keyed to
//    the union on every key-accepting method.
type _DefaultServiceKey = Expect<
    Equal<Parameters<TranslateService["instant"]>[0], AppKeys | AppKeys[]>
>;

// 3. The template-facing pipe signature: exactly what `strictTemplates` checks
//    for `{{ key | translate }}`.
type _PipeArg = Expect<
    Equal<Parameters<TranslatePipe["transform"]>[0], AppKeys | undefined | null>
>;

// 4. The template-facing directive input: exactly what `strictTemplates` checks
//    for `[translate]="key"`.
type _DirectiveInput = Expect<Equal<TranslateDirective["translate"], AppKeys>>;

// 4b. The `*translateBlock` template helper: the `t` bound via `let t` gets its
//     type from `TranslateBlockContext.$implicit` (read by the directive's
//     ngTemplateContextGuard), so this is exactly the key type `strictTemplates`
//     checks for `{{ t('key') }}`. (A full ngtsc template compile isn't
//     available in this plain-tsc harness — same limitation as the directive
//     check above; this asserts the same context-type contract ngtsc reads.)
type _BlockHelperKey = Expect<Equal<Parameters<TranslateBlockContext["$implicit"]>[0], AppKeys>>;

// 5. `injectTranslateService()` resolves to the augmented union with no type
//    argument and no annotation — the zero-ceremony imperative path. (A bare
//    `inject(TranslateService)` widens the key to `any`, which is why the helper
//    exists; the annotated form below is the other supported pattern.) Call-site
//    inference is proven functionally below — a `ReturnType<>` probe would read
//    the constraint, not the default, so it is not a faithful test here.
function checkImperativeInjectionEnforcesKeys(): void {
    const translate = injectTranslateService();
    translate.instant("home.title");
    translate.get("nav.back");

    // @ts-expect-error - "home" is an intermediate object, not a leaf key
    translate.instant("home");
    // @ts-expect-error - not a declared key
    translate.get("does.not.exist");

    // Annotating a bare inject() works too.
    const annotated: TranslateService = inject(TranslateService);
    // @ts-expect-error - registry keys enforced through the annotation
    annotated.set("nope", "x");
}

// 6. The standalone `translate()` function resolves to the augmented union with
//    no type argument. `Key` is `NoInfer`-wrapped, so it is NOT inferred from
//    the argument (which would silently disable checking); the registry default
//    governs. An explicit `translate<OtherKeys>(…)` override still works.
function checkStandaloneTranslateEnforcesKeys(): void {
    translate("home.title");
    translate(["home.title", "nav.back"]);
    translate(() => "nav.back");

    // @ts-expect-error - not a declared key
    translate("does.not.exist");
    // @ts-expect-error - "home" is an intermediate object, not a leaf key
    translate("home");
    // @ts-expect-error - arrays are key-checked element-wise
    translate(["home.title", "nope"]);
}

// 7. The `[translate]` directive input is key-checked at the type level — the
//    template-facing assignment `strictTemplates` performs for `[translate]="…"`.
function checkDirectiveInputIsKeyChecked(dir: TranslateDirective): void {
    dir.translate = "home.title";
    // @ts-expect-error - directive input is key-checked against the registry
    dir.translate = "nope";
}

// 8. Big-dictionary stress: DeepKeys must resolve a deeply-nested (10 levels)
//    and wide (100 leaves) shape without tripping TypeScript's
//    instantiation-depth or union-size ceiling (the well-known i18next failure
//    mode). If `DeepKeys<BigDictionary>` exceeded a ceiling, this file would
//    fail to compile (TS2589) — so compilation IS the assertion. The explicit
//    leaf/intermediate checks document the resolved envelope.
type WideDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type WideKey = `k${WideDigit}${WideDigit}`; // 100 distinct leaf keys
interface BigDictionary {
    deep: { a: { b: { c: { d: { e: { f: { g: { h: { i: { leaf: "x" } } } } } } } } } };
    wide: Record<WideKey, string>;
    home: { title: "Home" };
}
function checkBigDictionaryStaysTyped(key: DeepKeys<BigDictionary>): void {
    const deepLeaf: DeepKeys<BigDictionary> = "deep.a.b.c.d.e.f.g.h.i.leaf";
    const wideLeaf: DeepKeys<BigDictionary> = "wide.k00";
    // @ts-expect-error - "deep" is an intermediate object, not a leaf
    const intermediate: DeepKeys<BigDictionary> = "deep";
    void key;
    void deepLeaf;
    void wideLeaf;
    void intermediate;
}

// Reference the checks so unused-symbol settings stay satisfied either way.
export type RegistryAugmentationChecks = [
    _ResolvedKey,
    _DefaultServiceKey,
    _PipeArg,
    _DirectiveInput,
    _BlockHelperKey,
];
export {
    checkImperativeInjectionEnforcesKeys,
    checkStandaloneTranslateEnforcesKeys,
    checkDirectiveInputIsKeyChecked,
    checkBigDictionaryStaysTyped,
};
