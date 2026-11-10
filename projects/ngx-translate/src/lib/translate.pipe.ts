import { inject, Injectable, Pipe, PipeTransform, Signal } from "@angular/core";
import { TranslateService } from "./translate.service";
import { equals, isDefinedAndNotNull, isDict, isString } from "./util";
import {
    InterpolationParameters,
    Language,
    Translation,
    TranslatePipeParams,
} from "./translate.service.interface";

@Injectable()
@Pipe({
    name: "translate",
    standalone: true,
    pure: false, // required to update the value when the signal changes
})
export class TranslatePipe implements PipeTransform {
    private translateService = inject(TranslateService);

    private cachedSignal: Signal<Translation> | null = null;
    private lastKey: string | null = null;
    private lastParams: InterpolationParameters | undefined;
    private lastLang: Language | undefined;

    /**
     * Translates `query` with optional interpolation parameters and language (#1694).
     *
     * @param query - The translation key; `null`, `undefined` and `""` are returned as they are.
     * @param params - An object, or a string holding a serialized object (e.g. `"{n:1}"`).
     *   `null`/`undefined` = no parameters.
     * @param lang - Language to use instead of the current one; `null`/`undefined` = no override
     *   (e.g. `lang$ | async`).
     */
    transform(
        query: string | null | undefined,
        params?: TranslatePipeParams | null,
        lang?: Language | null,
    ): Translation {
        // Non-strings can still arrive from JIT, non-strict templates or plain JS: return them as-is
        if (!isString(query) || !query.length) {
            return query;
        }

        const interpolateParams = this.parseParams(params);
        const targetLang = lang ?? undefined;

        // Only recreate the signal if the key, params or language changed
        if (
            query !== this.lastKey ||
            targetLang !== this.lastLang ||
            !equals(interpolateParams, this.lastParams)
        ) {
            this.cachedSignal = this.translateService.translate(
                query,
                interpolateParams,
                targetLang,
            );
            this.lastKey = query;
            this.lastParams = interpolateParams;
            this.lastLang = targetLang;
        }

        return this.cachedSignal!();
    }

    // Takes `unknown` and keeps the runtime checks: JIT, non-strict templates and plain JavaScript
    // callers can still pass any value, which is ignored as before.
    private parseParams(params: unknown): InterpolationParameters | undefined {
        if (!isDefinedAndNotNull(params)) {
            return undefined;
        }

        if (isString(params) && params.length) {
            // we accept objects written in the template such as {n:1}, {'n':1}, {n:'v'}
            // this is why we might need to change it to real JSON objects such as {"n":1} or {"n":"v"}
            const validArgs: string = params
                .replace(/(')?([a-zA-Z0-9_]+)(')?(\s)?:/g, '"$2":')
                .replace(/:(\s)?(')(.*?)(')/g, ':"$3"');
            try {
                return JSON.parse(validArgs);
            } catch (e) {
                throw new SyntaxError(
                    `Wrong parameter in TranslatePipe. Expected a valid Object, received: ${params}`,
                    { cause: e },
                );
            }
        }

        if (isDict(params)) {
            return params as InterpolationParameters;
        }

        return undefined;
    }
}
