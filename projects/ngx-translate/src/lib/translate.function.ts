import { inject, Signal } from "@angular/core";
import { TranslateService } from "./translate.service";
import {
    InterpolationParameters,
    Translation,
    TranslationObject,
} from "./translate.service.interface";

export function translate(
    key: string | Signal<string>,
    params?: InterpolationParameters | Signal<InterpolationParameters | undefined>,
): Signal<Translation | TranslationObject> {
    return inject(TranslateService).translate(key, params);
}
