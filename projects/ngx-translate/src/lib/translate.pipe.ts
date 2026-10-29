import { inject, Injectable, Pipe, PipeTransform, Signal } from "@angular/core";
import { TranslateService } from "./translate.service";
import { InterpolationParameters, Language, Translation } from "./translate.service.interface";
import { equals, isDefinedAndNotNull, isDict, isString } from "./util";

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
     * Accepts interpolation parameters followed by an optional language override.
     * Explicit languages must already be loaded and bypass the fallback languages.
     * @example {{ 'HELLO' | translate: { name: 'Ada' } : 'fr' }}
     * @example {{ 'HELLO' | translate: undefined : 'fr' }}
     */
    transform(
        query: string | undefined | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Preserve the public parameter type.
        params?: any,
        lang?: Language | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Preserve legacy trailing arguments.
        ..._args: any[]
    ): Translation {
        if (!query || !query.length) {
            return query;
        }

        const interpolateParams = this.parseParams(params);
        lang = lang ?? undefined;

        if (
            query !== this.lastKey ||
            !equals(interpolateParams, this.lastParams) ||
            lang !== this.lastLang
        ) {
            this.cachedSignal = this.translateService.translate(query, interpolateParams, lang);
            this.lastKey = query;
            this.lastParams = interpolateParams;
            this.lastLang = lang;
        }

        return this.cachedSignal!();
    }

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
