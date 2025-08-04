import {
    ChangeDetectorRef,
    inject,
    Injectable,
    OnDestroy,
    Pipe,
    PipeTransform,
} from "@angular/core";
import { isObservable, Subscription } from "rxjs";
import {
    InterpolatableTranslationObject,
    InterpolationParameters,
    LangChangeEvent,
    StrictTranslation,
    TranslateService,
    TranslationChangeEvent,
} from "./translate.service";
import { equals, isDefinedAndNotNull, isDict, isString } from "./util";

@Injectable()
@Pipe({
    name: "translate",
    standalone: true,
    pure: false, // required to update the value when the promise is resolved
})
export class TranslatePipe implements PipeTransform, OnDestroy {
    private translate: TranslateService = inject(TranslateService);
    private _ref: ChangeDetectorRef = inject(ChangeDetectorRef);

    private value: StrictTranslation = "";
    lastKey: string | null = null;
    lastParams: InterpolationParameters[] = [];
    onTranslationChange: Subscription | undefined;
    onLangChange: Subscription | undefined;
    onFallbackLangChange: Subscription | undefined;

    updateValue(
        key: string,
        interpolateParams?: InterpolationParameters,
        translations?: InterpolatableTranslationObject,
    ): void {
        const onTranslation = (res: StrictTranslation) => {
            this.value = res !== undefined ? res : key;
            this.lastKey = key;
            this._ref.markForCheck();
        };
        if (translations) {
            const res = this.translate.getParsedResult(key, interpolateParams);
            if (isObservable(res)) {
                res.subscribe(onTranslation);
            } else {
                onTranslation(res);
            }
        }
        this.translate.get(key, interpolateParams).subscribe(onTranslation);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    transform(query: string | undefined | null, ...args: any[]): any {
        if (!query || !query.length) {
            return query;
        }

        // if we ask another time for the same key, return the last value
        if (equals(query, this.lastKey) && equals(args, this.lastParams)) {
            return this.value;
        }

        let interpolateParams: InterpolationParameters | undefined = undefined;
        if (isDefinedAndNotNull(args[0]) && args.length) {
            if (isString(args[0]) && args[0].length) {
                // we accept objects written in the template such as {n:1}, {'n':1}, {n:'v'}
                // this is why we might need to change it to real JSON objects such as {"n":1} or {"n":"v"}
                const validArgs: string = args[0]
                    .replace(/(')?([a-zA-Z0-9_]+)(')?(\s)?:/g, '"$2":')
                    .replace(/:(\s)?(')(.*?)(')/g, ':"$3"');
                try {
                    interpolateParams = JSON.parse(validArgs);
                } catch (e) {
                    void e;
                    throw new SyntaxError(
                        `Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`,
                    );
                }
            } else if (isDict(args[0])) {
                interpolateParams = args[0];
            }
        }

        // store the query in case it changes
        this.lastKey = query;

        // store the params in case they change
        this.lastParams = args;

        // set the value
        this.updateValue(query, interpolateParams);

        // if there is a subscription to onLangChange, clean it
        this._dispose();

        // subscribe to onTranslationChange event, in case the translations change
        if (!this.onTranslationChange) {
            this.onTranslationChange = this.translate.onTranslationChange.subscribe(
                (event: TranslationChangeEvent) => {
                    if (
                        (this.lastKey && event.lang === this.translate.getCurrentLang()) ||
                        event.lang === this.translate.getFallbackLang()
                    ) {
                        this.lastKey = null;
                        this.updateValue(query, interpolateParams, event.translations);
                    }
                },
            );
        }

        // subscribe to onLangChange event, in case the language changes
        if (!this.onLangChange) {
            this.onLangChange = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
                if (this.lastKey) {
                    this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
                    this.updateValue(query, interpolateParams, event.translations);
                }
            });
        }

        // subscribe to onDefaultLangChange event, in case the fallback language changes
        if (!this.onFallbackLangChange) {
            this.onFallbackLangChange = this.translate.onFallbackLangChange.subscribe(() => {
                if (this.lastKey) {
                    this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
                    this.updateValue(query, interpolateParams);
                }
            });
        }

        return this.value;
    }

    /**
     * Clean any existing subscription to change events
     */
    private _dispose(): void {
        if (typeof this.onTranslationChange !== "undefined") {
            this.onTranslationChange.unsubscribe();
            this.onTranslationChange = undefined;
        }
        if (typeof this.onLangChange !== "undefined") {
            this.onLangChange.unsubscribe();
            this.onLangChange = undefined;
        }
        if (typeof this.onFallbackLangChange !== "undefined") {
            this.onFallbackLangChange.unsubscribe();
            this.onFallbackLangChange = undefined;
        }
    }

    ngOnDestroy(): void {
        this._dispose();
    }
}
