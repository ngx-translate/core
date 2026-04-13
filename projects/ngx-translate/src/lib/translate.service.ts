import {
    computed,
    inject,
    Injectable,
    InjectionToken,
    isSignal,
    Signal,
    signal,
    WritableSignal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { concat, defer, EMPTY, finalize, forkJoin, isObservable, merge, Observable, of, Subject, tap } from "rxjs";
import { concatMap, filter, map, shareReplay, switchMap, take } from "rxjs/operators";
import { MissingTranslationHandler } from "./missing-translation-handler";
import { TranslateCompiler } from "./translate.compiler";
import { TranslateLoader } from "./translate.loader";
import { TranslateParser } from "./translate.parser";
import { DeepReadonly, TranslateStore } from "./translate.store";
import { insertValue, isArray, isDefinedAndNotNull, isDict, isString } from "./util";
import {
    FallbackLangChangeEvent,
    InterpolatableTranslation,
    InterpolatableTranslationObject,
    InterpolationParameters,
    ITranslateService,
    LangChangeEvent,
    Language,
    StrictTranslation,
    Translation,
    TranslationChangeEvent,
    TranslationObject,
} from "./translate.service.interface";

/**
 * Configuration object for the translation service.
 *
 * Provides options to customize translation behavior, including setting the primary language,
 * specifying a fallback language, and other deprecated flags for legacy support.
 */
export interface TranslateServiceConfig {
    lang?: Language;
    fallbackLang?: Language | null;
    isRoot: boolean;
}

export const TRANSLATE_SERVICE_CONFIG = new InjectionToken<TranslateServiceConfig>(
    "TRANSLATE_CONFIG",
);

declare interface Window {
    navigator: {
        languages?: string[];
        language?: string;
        browserLanguage?: string;
        userLanguage?: string;
    };
}

declare const window: Window;

const makeObservable = <T>(value: T | Observable<T>): Observable<T> => {
    return isObservable(value) ? value : of(value);
};

@Injectable()
export class TranslateService implements ITranslateService {
    protected loadingTranslations: Record<Language, Observable<InterpolatableTranslationObject>> =
        {};
    protected lastUseLanguage: Language | null = null;

    protected currentLoader = inject(TranslateLoader);
    protected compiler = inject(TranslateCompiler);
    protected parser = inject(TranslateParser);
    protected missingTranslationHandler = inject(MissingTranslationHandler);
    protected store: TranslateStore = inject(TranslateStore);

    protected readonly parent = inject(TranslateService, { optional: true, skipSelf: true });
    protected readonly isRoot: boolean;

    protected _onLangChange = new Subject<LangChangeEvent>();
    protected _onFallbackLangChange = new Subject<FallbackLangChangeEvent>();
    protected _currentLang: WritableSignal<Language | null> = signal(null);
    protected _fallbackLang: WritableSignal<Language | null> = signal(null);
    private _onTranslationRefresh: Observable<void> | null = null;

    protected getRoot(): TranslateService {
        return this.parent ? this.parent.getRoot() : this;
    }

    /**
     * An Observable to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     */
    public get onTranslationChange(): Observable<TranslationChangeEvent> {
        return this.store.translationChange$;
    }

    /**
     * An Observable to listen to lang change events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     */
    get onLangChange(): Observable<LangChangeEvent> {
        if (this.isRoot) {
            return this._onLangChange.asObservable();
        }
        return this.parent ? this.parent.onLangChange : EMPTY;
    }

    /**
     * An Observable to listen to fallback lang change events
     * onFallbackLangChange.subscribe((params: FallbackLangChangeEvent) => {
     *     // do something
     * });
     */
    get onFallbackLangChange(): Observable<FallbackLangChangeEvent> {
        if (this.isRoot) {
            return this._onFallbackLangChange.asObservable();
        }
        return this.parent ? this.parent.onFallbackLangChange : EMPTY;
    }

    /**
     * A combined Observable that emits whenever translations might need to be refreshed.
     * This includes: language changes, translation updates for the current or fallback language,
     * and fallback language changes.
     */
    get onTranslationRefresh(): Observable<void> {
        if (!this._onTranslationRefresh) {
            const refresh$ = merge(
                this.onTranslationChange.pipe(
                    filter(
                        (event) =>
                            event.lang === this.getCurrentLang() ||
                            event.lang === this.getFallbackLang(),
                    ),
                ),
                this.onLangChange,
                this.onFallbackLangChange,
            ).pipe(map(() => void 0));

            if (this.isRoot) {
                this._onTranslationRefresh = refresh$;
            } else {
                this._onTranslationRefresh = this.parent
                    ? merge(refresh$, this.parent.onTranslationRefresh)
                    : refresh$;
            }
        }
        return this._onTranslationRefresh;
    }

    constructor() {
        const config: TranslateServiceConfig = {
            isRoot: true,
            fallbackLang: null,

            ...inject<TranslateServiceConfig>(TRANSLATE_SERVICE_CONFIG, {
                optional: true,
            }),
        };

        this.isRoot = config.isRoot;

        if (this.isRoot) {
            if (config.lang) {
                this.use(config.lang);
            }
            if (config.fallbackLang) {
                this.setFallbackLang(config.fallbackLang);
            }
        } else {
            // Child services should initially load the root's current and fallback languages
            const currentLang = this.getCurrentLang();
            if (currentLang) {
                this.loadOrExtendLanguage(currentLang)?.subscribe();
            }
            const fallbackLang = this.getFallbackLang();
            if (fallbackLang) {
                this.loadOrExtendLanguage(fallbackLang)?.subscribe();
            }
        }

        // Child services should load translations when the language changes on the root
        this.onLangChange.pipe(takeUntilDestroyed()).subscribe((event) => {
            if (!this.isRoot) {
                this.loadOrExtendLanguage(event.lang)?.subscribe();
            }
        });

        this.onFallbackLangChange.pipe(takeUntilDestroyed()).subscribe((event) => {
            if (!this.isRoot) {
                this.loadOrExtendLanguage(event.lang)?.subscribe();
            }
        });
    }

    /**
     * Sets the fallback language to use if a translation is not found in the
     * current language
     */
    public setFallbackLang(lang: Language): Observable<InterpolatableTranslationObject> {
        if (!this.isRoot) {
            return this.parent!.setFallbackLang(lang);
        }

        if (!this._fallbackLang()) {
            // on init set the fallbackLang immediately, but do not emit a change yet
            this._fallbackLang.set(lang);
        }

        const pending = this.loadOrExtendLanguage(lang);
        if (isObservable(pending)) {
            pending.pipe(take(1)).subscribe({
                next: () => {
                    this._fallbackLang.set(lang);
                    this._onFallbackLangChange.next({
                        lang: lang,
                        translations: this.store.getTranslations(lang),
                    });
                },
                error: (err) => {
                    console.warn(`@ngx-translate/core: error loading translations for ${lang}:`, err);
                },
            });
            return pending;
        }

        this._fallbackLang.set(lang);
        this._onFallbackLangChange.next({
            lang: lang,
            translations: this.store.getTranslations(lang),
        });
        return of(this.store.getTranslations(lang));
    }

    protected isLoading(): boolean {
        return Object.keys(this.loadingTranslations).length > 0;
    }

    /**
     * Changes the lang currently used
     */
    public use(lang: Language): Observable<InterpolatableTranslationObject> {
        if (!this.isRoot) {
            return this.parent!.use(lang);
        }

        // remember the language that was called
        // we need this with multiple fast calls to use()
        // where translation loads might complete in random order
        this.lastUseLanguage = lang;

        if (!this._currentLang()) {
            // on init set the currentLang immediately, but do not emit a change yet
            this._currentLang.set(lang);
        }

        const pending = this.loadOrExtendLanguage(lang);
        if (isObservable(pending)) {
            pending.pipe(take(1)).subscribe({
                next: () => {
                    this.changeLang(lang);
                },
                error: (err) => {
                    console.warn(`@ngx-translate/core: error loading translations for ${lang}:`, err);
                },
            });
            return pending;
        }

        this.changeLang(lang);
        return of(this.store.getTranslations(lang));
    }

    /**
     * Retrieves the given translations
     */
    protected loadOrExtendLanguage(
        lang: Language,
    ): Observable<InterpolatableTranslationObject> | undefined {
        // if this language is unavailable, ask for it
        if (!this.store.hasTranslationFor(lang)) {
            return this.loadAndCompileTranslations(lang);
        }

        return of(this.store.getTranslations(lang));
    }

    /**
     * @returns The loaded translations for the given language
     */
    public getTranslations(language: Language): DeepReadonly<InterpolatableTranslationObject> {
        return this.store.getTranslations(language);
    }

    /**
     * Changes the current lang
     */
    protected changeLang(lang: Language): void {
        if (lang !== this.lastUseLanguage) {
            // received new language data,
            // but this was not the one requested last
            return;
        }

        this._currentLang.set(lang);
        this._onLangChange.next({ lang: lang, translations: this.store.getTranslations(lang) });
    }

    public getCurrentLang(): Language | null {
        return this.isRoot ? this._currentLang() : (this.parent?.getCurrentLang() ?? null);
    }

    protected loadAndCompileTranslations(
        lang: Language,
    ): Observable<InterpolatableTranslationObject> {
        if (this.loadingTranslations[lang]) {
            return this.loadingTranslations[lang];
        }

        const translations$ = this.currentLoader.getTranslation(lang).pipe(
            map((res: TranslationObject) => this.compiler.compileTranslations(res, lang)),
            tap((compiled: InterpolatableTranslationObject) => {
                this.store.setTranslations(lang, compiled, false);
            }),
            finalize(() => {
                delete this.loadingTranslations[lang];
            }),
            // cache the single result & share it across all subscribers
            shareReplay({ bufferSize: 1, refCount: true }),
        );

        this.loadingTranslations[lang] = translations$;

        // trigger loading if nobody subscribes from outside
        translations$.subscribe({
            error: (err) => {
                console.warn(`@ngx-translate/core: error loading translations for ${lang}:`, err);
            },
        });

        return translations$;
    }

    /**
     * Manually sets an object of translations for a given language,
     * passing it through the configured {@link TranslateCompiler} first.
     *
     * If you already have translations in their final compiled form
     * (e.g. interpolation functions produced at build time), use
     * {@link setCompiledTranslation} instead — it stores the data
     * directly and skips the compiler.
     */
    public setTranslation(
        lang: Language,
        translations: TranslationObject,
        shouldMerge = false,
    ): void {
        const interpolatableTranslations: InterpolatableTranslationObject =
            this.compiler.compileTranslations(translations, lang);
        this.store.setTranslations(lang, interpolatableTranslations, shouldMerge);
    }

    /**
     * Stores an already-compiled translation object for the given language,
     * bypassing the configured {@link TranslateCompiler}.
     *
     * Use this when you have translations in their final, interpolator-ready
     * form — e.g. interpolation functions produced at build time. For raw
     * translations that still need to go through the compiler, use
     * {@link setTranslation} instead.
     */
    public setCompiledTranslation(
        lang: Language,
        translations: InterpolatableTranslationObject,
        shouldMerge = false,
    ): void {
        this.store.setTranslations(lang, translations, shouldMerge);
    }

    public getLangs(): readonly Language[] {
        return this.store.getLanguages();
    }

    /**
     * Add available languages
     */
    public addLangs(languages: Language[]): void {
        this.store.addLanguages(languages);
    }

    protected getParsedResultForKey(
        key: string,
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): StrictTranslation | Observable<StrictTranslation> {
        const textToInterpolate = this.getTextToInterpolate(key, lang);

        if (isDefinedAndNotNull(textToInterpolate)) {
            return this.runInterpolation(textToInterpolate, interpolateParams);
        }

        const handler = this.getMissingTranslationHandler();
        const res = handler.handle({
            key,
            translateService: this,
            ...(interpolateParams !== undefined && { interpolateParams }),
        });

        return res !== undefined ? res : key;
    }

    protected getMissingTranslationHandler(): MissingTranslationHandler {
        return this.missingTranslationHandler;
    }

    /**
     * Gets the fallback language. null if none is defined
     */
    public getFallbackLang(): Language | null {
        return this.isRoot ? this._fallbackLang() : (this.parent?.getFallbackLang() ?? null);
    }

    protected getTextToInterpolate(key: string, lang?: Language): InterpolatableTranslation | undefined {
        if (lang) {
            const res = this.store.getTranslationValue(lang, key);
            if (res !== undefined) {
                return res;
            }
            return this.parent?.getTextToInterpolate(key, lang);
        }

        const currentLang = this.getCurrentLang();
        const fallbackLang = this.getFallbackLang();

        // 1. Try own store (currentLang)
        let res: InterpolatableTranslation | undefined;
        if (currentLang) {
            res = this.store.getTranslationValue(currentLang, key);
        }

        // 2. Try own store (fallbackLang) - null values also trigger fallback
        if (!isDefinedAndNotNull(res) && fallbackLang && fallbackLang !== currentLang) {
            res = this.store.getTranslationValue(fallbackLang, key);
        }

        if (res !== undefined) {
            return res;
        }

        // 3. Try parent
        return this.parent?.getTextToInterpolate(key);
    }

    protected runInterpolation(
        translations: InterpolatableTranslation,
        interpolateParams?: InterpolationParameters,
    ): StrictTranslation {
        if (!isDefinedAndNotNull(translations)) {
            return;
        }

        if (isArray(translations)) {
            return this.runInterpolationOnArray(translations, interpolateParams);
        }

        if (isDict(translations)) {
            return this.runInterpolationOnDict(translations, interpolateParams);
        }

        return this.parser.interpolate(translations, interpolateParams);
    }

    protected runInterpolationOnArray(
        translations: InterpolatableTranslation,
        interpolateParams: InterpolationParameters | undefined,
    ) {
        return (translations as StrictTranslation[]).map((translation) =>
            this.runInterpolation(translation, interpolateParams),
        );
    }

    protected runInterpolationOnDict(
        translations: InterpolatableTranslationObject,
        interpolateParams: InterpolationParameters | undefined,
    ) {
        const result: TranslationObject = {};
        for (const key in translations) {
            const res = this.runInterpolation(translations[key], interpolateParams);
            if (res !== undefined) {
                result[key] = res;
            }
        }
        return result;
    }

    /**
     * Returns the parsed result of the translations
     */
    public getParsedResult(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): StrictTranslation | Observable<StrictTranslation> {
        return key instanceof Array
            ? this.getParsedResultForArray(key, interpolateParams, lang)
            : this.getParsedResultForKey(key, interpolateParams, lang);
    }

    protected getParsedResultForArray(
        key: string[],
        interpolateParams: InterpolationParameters | undefined,
        lang?: Language,
    ) {
        const result: Record<string, StrictTranslation | Observable<StrictTranslation>> = {};

        let observables = false;
        for (const k of key) {
            result[k] = this.getParsedResultForKey(k, interpolateParams, lang);
            observables = observables || isObservable(result[k]);
        }

        if (!observables) {
            return result as TranslationObject;
        }

        const sources: Observable<StrictTranslation>[] = key.map((k) => makeObservable(result[k]));
        return forkJoin(sources).pipe(
            map((arr: StrictTranslation[]) => {
                const obj: TranslationObject = {};
                arr.forEach((value: StrictTranslation, index: number) => {
                    obj[key[index]] = value;
                });
                return obj;
            }),
        );
    }

    /**
     * Gets the translated value of a key (or an array of keys)
     * @returns the translated key, or an object of translated keys
     */
    public get(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): Observable<Translation> {
        if (!isDefinedAndNotNull(key) || !key.length) {
            return of("");
        }

        // check if we are loading a new translation to use
        if (this.lastUseLanguage && this.loadingTranslations[this.lastUseLanguage]) {
            return this.loadingTranslations[this.lastUseLanguage].pipe(
                concatMap(() => {
                    return makeObservable(this.getParsedResult(key, interpolateParams, lang));
                }),
            );
        }

        return makeObservable(this.getParsedResult(key, interpolateParams, lang));
    }

    /**
     * Returns a stream of translated values of a key (or an array of keys) which updates
     * whenever the translation changes.
     * @returns A stream of the translated key, or an object of translated keys
     */
    public getStreamOnTranslationChange(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): Observable<Translation> {
        if (!isDefinedAndNotNull(key) || !key.length) {
            throw new Error(`Parameter "key" is required and cannot be empty`);
        }

        return concat(
            defer(() => this.get(key, interpolateParams, lang)),
            this.onTranslationChange.pipe(
                switchMap(() => {
                    const res = this.getParsedResult(key, interpolateParams, lang);
                    return makeObservable(res);
                }),
            ),
        );
    }

    /**
     * Returns a stream of translated values of a key (or an array of keys) which updates
     * whenever the language changes.
     * @returns A stream of the translated key, or an object of translated keys
     */
    public stream(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): Observable<Translation> {
        if (!isDefinedAndNotNull(key) || !key.length) {
            throw new Error(`Parameter "key" required`);
        }

        return concat(
            defer(() => this.get(key, interpolateParams, lang)),
            this.onLangChange.pipe(
                switchMap(() => {
                    const res = this.getParsedResult(key, interpolateParams, lang);
                    return makeObservable(res);
                }),
            ),
        );
    }

    /**
     * Returns a translation instantly from the internal state of loaded translation.
     * All rules regarding the current language, the preferred language of even fallback languages
     * will be used except any promise handling.
     *
     * When `lang` is provided, the lookup goes directly to the specified language,
     * bypassing the current language and fallback chain.
     */
    public instant(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): Translation {
        if (!isDefinedAndNotNull(key) || key.length === 0) {
            return "";
        }

        const result = this.getParsedResult(key, interpolateParams, lang);

        return isObservable(result) ? this.keyToObject(key) : result;
    }

    /**
     * Returns a Signal that provides the translated value and automatically updates
     * when the language changes, translations are updated, or when the input signals change.
     *
     * @param key - The translation key, either as a string or a Signal<string>
     * @param params - Optional interpolation parameters, either as an object or a Signal
     * @returns A Signal that emits the translated value
     *
     * @example
     * // Static key and params
     * title = this.translate.translate('page.title');
     *
     * @example
     * // Reactive key
     * key = signal('greeting');
     * message = this.translate.translate(this.key);
     *
     * @example
     * // Reactive params
     * userName = signal('John');
     * params = computed(() => ({ name: this.userName() }));
     * greeting = this.translate.translate('hello', this.params);
     */
    public translate(
        key: string | Signal<string>,
        params?: InterpolationParameters | Signal<InterpolationParameters | undefined>,
        lang?: Language | Signal<Language | undefined>,
    ): Signal<Translation | TranslationObject> {
        return computed(() => {
            // Unwrap signals if needed
            const currentKey = isSignal(key) ? key() : key;
            const currentParams = params !== undefined && isSignal(params)
                ? (params as Signal<InterpolationParameters | undefined>)()
                : params;
            const currentLang = lang !== undefined && isSignal(lang)
                ? lang()
                : lang;

            // instant() internally reads the store's translations() signal,
            // which provides reactivity for lang/translation/fallback changes.
            return this.instant(currentKey, currentParams, currentLang);
        });
    }

    protected keyToObject(key: string | string[]) {
        if (Array.isArray(key)) {
            return key.reduce((acc: Record<string, string>, currKey: string) => {
                acc[currKey] = currKey;
                return acc;
            }, {});
        }
        return key;
    }

    /**
     * Sets the translated value of a key, after compiling it
     */
    public set(
        key: string,
        translation: string | TranslationObject,
        lang: Language = this.getCurrentLang()!,
    ): void {
        this.store.setTranslations(
            lang,
            insertValue(
                this.store.getTranslations(lang),
                key,
                isString(translation)
                    ? this.compiler.compile(translation, lang)
                    : this.compiler.compileTranslations(translation, lang),
            ),
            false,
        );
    }

    /**
     * Allows reloading the lang file from the file
     */
    public reloadLang(lang: Language): Observable<InterpolatableTranslationObject> {
        this.resetLang(lang);
        return this.loadAndCompileTranslations(lang);
    }

    /**
     * Deletes inner translation
     */
    public resetLang(lang: Language): void {
        delete this.loadingTranslations[lang];
        this.store.deleteTranslations(lang);
    }

    /**
     * Returns the language code name from the browser, e.g. "de"
     */
    public static getBrowserLang(): Language | undefined {
        if (typeof window === "undefined" || !window.navigator) {
            return undefined;
        }

        const browserLang = this.getBrowserCultureLang();

        return browserLang ? browserLang.split(/[-_]/)[0] : undefined;
    }

    /**
     * Returns the culture language code name from the browser, e.g. "de-DE"
     */
    public static getBrowserCultureLang(): Language | undefined {
        if (typeof window === "undefined" || typeof window.navigator === "undefined") {
            return undefined;
        }

        return window.navigator.languages
            ? window.navigator.languages[0]
            : window.navigator.language ||
            window.navigator.browserLanguage ||
            window.navigator.userLanguage;
    }

    public getBrowserLang(): Language | undefined {
        return TranslateService.getBrowserLang();
    }

    public getBrowserCultureLang(): Language | undefined {
        return TranslateService.getBrowserCultureLang();
    }

    /**
     * The current language as a reactive Signal.
     * Use `getCurrentLang()` for a non-reactive snapshot.
     */
    get currentLang(): Signal<Language | null> {
        return this.isRoot ? this._currentLang.asReadonly() : this.parent!.currentLang;
    }

    /**
     * The fallback language as a reactive Signal.
     * Use `getFallbackLang()` for a non-reactive snapshot.
     */
    get fallbackLang(): Signal<Language | null> {
        return this.isRoot ? this._fallbackLang.asReadonly() : this.parent!.fallbackLang;
    }

}
