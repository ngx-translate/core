import { inject, Signal } from "@angular/core";
import { TranslateService } from "./translate.service";
import {
    InterpolationParameters,
    Language,
    Translation,
    TranslationObject,
} from "./translate.service.interface";

export function translate(
    key: string | Signal<string>,
    params?: InterpolationParameters | Signal<InterpolationParameters | undefined>,
    lang?: Language | Signal<Language>,
): Signal<Translation | TranslationObject> {
    return inject(TranslateService).translate(key, params, lang);
}
