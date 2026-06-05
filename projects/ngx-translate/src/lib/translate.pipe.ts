import { inject, Injectable, Pipe, PipeTransform, Signal } from "@angular/core";
import { TranslateService } from "./translate.service";
import { equals, isDefinedAndNotNull, isDict, isString } from "./util";
import { InterpolationParameters, Translation } from "./translate.service.interface";

@Injectable()
@Pipe({
    name: "translate",
    standalone: true,
    pure: false, // required to update the value when the signal changes
})
export class TranslatePipe<Key extends string = string> implements PipeTransform {
    private translateService = inject<TranslateService<Key>>(TranslateService<Key>);

    private cachedSignal: Signal<Translation> | null = null;
    private lastKey: string | null = null;
    private lastParams: InterpolationParameters | undefined;

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    transform(query: Key | undefined | null, ...args: any[]): any {
        if (!query || !query.length) {
            return query;
        }

        const interpolateParams = this.parseArgs(args);

        // Only recreate signal if key or params changed
        if (query !== this.lastKey || !equals(interpolateParams, this.lastParams)) {
            this.cachedSignal = this.translateService.translate(query, interpolateParams);
            this.lastKey = query;
            this.lastParams = interpolateParams;
        }

        return this.cachedSignal!();
    }

    private parseArgs(args: unknown[]): InterpolationParameters | undefined {
        if (!isDefinedAndNotNull(args[0]) || !args.length) {
            return undefined;
        }

        if (isString(args[0]) && args[0].length) {
            // we accept objects written in the template such as {n:1}, {'n':1}, {n:'v'}
            // this is why we might need to change it to real JSON objects such as {"n":1} or {"n":"v"}
            const validArgs: string = args[0]
                .replace(/(')?([a-zA-Z0-9_]+)(')?(\s)?:/g, '"$2":')
                .replace(/:(\s)?(')(.*?)(')/g, ':"$3"');
            try {
                return JSON.parse(validArgs);
            } catch (e) {
                void e;
                throw new SyntaxError(
                    `Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`,
                );
            }
        }

        if (isDict(args[0])) {
            return args[0] as InterpolationParameters;
        }

        return undefined;
    }
}
