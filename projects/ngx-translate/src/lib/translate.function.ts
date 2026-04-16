import { inject, Signal } from "@angular/core";
import { TranslateService } from "./translate.service";
import {
    InterpolationParameters,
    Language,
    Translation,
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
 */
export function translate(
    key: string | string[] | (() => string | string[]),
    params?: InterpolationParameters | (() => InterpolationParameters | undefined),
    lang?: Language | (() => Language | undefined),
): Signal<Translation | TranslationObject> {
    return inject(TranslateService).translate(key, params, lang);
}
