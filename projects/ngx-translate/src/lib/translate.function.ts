import { inject, Signal } from "@angular/core";
import { TranslateService } from "./translate.service";
import {
    InterpolationParameters,
    Language,
    Translation,
    TranslationKey,
    TranslationObject,
} from "./translate.service.interface";

/**
 * Returns a Signal with the translation for the given key, resolved against
 * the current language. Must be called in an Angular injection context.
 *
 * Parameters accept plain values or arrow functions. Signal reads inside
 * the function are tracked reactively. Signals themselves are also accepted
 * directly, since Signal<T> is callable.
 *
 * @example
 * greeting = translate('HELLO');
 *
 * @example
 * model = signal({ currentKey: 'HELLO' });
 * greeting = translate(() => this.model().currentKey);
 *
 * When you augment {@link NgxTranslateConfig}, the key source must itself be
 * typed to the key-space: a dynamic key whose type widens to `string` (e.g.
 * `currentKey: string`) will not satisfy the augmented union. Type it as
 * {@link TranslationKey} (or the relevant subset) so the closure compiles.
 *
 * `Key` is wrapped in `NoInfer` so it is *not* inferred from the argument:
 * without it, `translate("anything")` would infer `Key` as that literal and
 * the `= TranslationKey` default (the augmented key-space) would never apply,
 * silently disabling key checking. With `NoInfer`, the default governs — keys
 * are checked against the registry — while an explicit `translate<OtherKeys>(…)`
 * still scopes a call site to a different key-space.
 */
export function translate<Key extends string = TranslationKey>(
    key: NoInfer<Key> | NoInfer<Key>[] | (() => NoInfer<Key> | NoInfer<Key>[]),
    params?: InterpolationParameters | (() => InterpolationParameters | undefined),
    lang?: Language | (() => Language | undefined),
): Signal<Translation | TranslationObject> {
    return inject<TranslateService<Key>>(TranslateService<Key>).translate(key, params, lang);
}

/**
 * Injects the {@link TranslateService}, typed to the application's key-space.
 *
 * Prefer this over a bare `inject(TranslateService)` when you augment
 * {@link NgxTranslateConfig}: TypeScript widens the key type to `any` when a
 * generic class is used directly as an injection token, so a bare inject loses
 * key checking. This helper pins it back:
 *
 * ```ts
 * private translate = injectTranslateService(); // keys checked against the registry
 * ```
 *
 * Pass an explicit type argument to scope a call site to a different key-space.
 */
export function injectTranslateService<
    Key extends string = TranslationKey,
>(): TranslateService<Key> {
    return inject<TranslateService<Key>>(TranslateService<Key>);
}
