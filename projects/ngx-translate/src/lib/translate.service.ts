import { inject, Injectable, InjectionToken } from "@angular/core";
import { concat, defer, forkJoin, isObservable, Observable, of } from "rxjs";
import { concatMap, map, shareReplay, switchMap, take } from "rxjs/operators";
import { MissingTranslationHandler } from "./missing-translation-handler";
import { TranslateCompiler } from "./translate.compiler";
import { TranslateLoader } from "./translate.loader";
import { InterpolateFunction, TranslateParser } from "./translate.parser";
import { TranslateStore } from "./translate.store";
import { insertValue, isArray, isDefinedAndNotNull, isDict, isString } from "./util";

/**
 * Configuration object for the translation service.
 *
 * Provides options to customize translation behavior, including setting the primary language,
 * specifying a fallback language, and other deprecated flags for legacy support.
 */
export interface TranslateServiceConfig {
    lang?: Language;
    fallbackLang?: Language | null;
    extend: boolean;
}

export const TRANSLATE_SERVICE_CONFIG = new InjectionToken<TranslateServiceConfig>(
    "TRANSLATE_CONFIG",
);

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type InterpolationParameters = Record<string, any>;

export type StrictTranslation = string | StrictTranslation[] | TranslationObject | undefined | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Translation<T = any> = StrictTranslation | T;

export interface TranslationObject {
    [key: string]: StrictTranslation;
}

export type InterpolatableTranslation =
    | string
    | InterpolatableTranslation[]
    | InterpolateFunction
    | InterpolatableTranslationObject
    | undefined
    | null;

export interface InterpolatableTranslationObject {
    [key: string]: InterpolatableTranslation;
}

export type Language = string;

export interface TranslationChangeEvent {
    translations: InterpolatableTranslationObject;
    lang: string;
}

export interface LangChangeEvent {
    lang: string;
    translations: InterpolatableTranslationObject;
}

export interface FallbackLangChangeEvent {
    lang: string;
    translations: InterpolatableTranslationObject;
}

/** @deprecated use `FallbackLangChangeEvent` */
export type DefaultLangChangeEvent = FallbackLangChangeEvent;

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

export abstract class ITranslateService {
    public abstract readonly onTranslationChange: Observable<TranslationChangeEvent>;
    public abstract readonly onLangChange: Observable<LangChangeEvent>;
    public abstract readonly onFallbackLangChange: Observable<FallbackLangChangeEvent>;

    public abstract use(lang: Language): Observable<InterpolatableTranslationObject>;

    public abstract setFallbackLang(lang: Language): Observable<InterpolatableTranslationObject>;
    public abstract getFallbackLang(): Language | null;

    public abstract addLangs(languages: Language[]): void;
    public abstract getLangs(): readonly Language[];
    public abstract reloadLang(lang: Language): Observable<InterpolatableTranslationObject>;
    public abstract resetLang(lang: Language): void;

    public abstract instant(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
    ): Translation;
    public abstract stream(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
    ): Observable<Translation>;
    public abstract getStreamOnTranslationChange(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
    ): Observable<Translation>;

    public abstract set(
        key: string,
        translation: string | TranslationObject,
        lang?: Language,
    ): void;
    public abstract get(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
    ): Observable<Translation>;

    public abstract setTranslation(
        lang: Language,
        translations: TranslationObject,
        shouldMerge?: boolean,
    ): void;
    public abstract getParsedResult(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
    ): StrictTranslation | Observable<StrictTranslation>;

    public abstract getBrowserLang(): Language | undefined;
    public abstract getBrowserCultureLang(): Language | undefined;

    /**
     * Returns the current language
     * @deprecated use `getCurrentLang()`
     */
    public abstract readonly currentLang: Language;

    /**
     * Returns a list of known languages - either loaded
     * or set by using `addLangs()`
     * @deprecated use `getLangs()`
     */
    public abstract readonly langs: readonly Language[];

    /**
     * Sets the fallback language
     * @param lang The language to set
     * @deprecated use `setFallbackLang(lang)`
     */
    public abstract setDefaultLang(lang: Language): Observable<InterpolatableTranslationObject>;

    /**
     * Gets the fallback language
     * @deprecated use `getFallbackLang()`
     */
    public abstract getDefaultLang(): Language | null;

    /**
     * Returns the fallback language
     * @deprectated use `getFallbackLang()`
     */
    public abstract readonly defaultLang: Language | null;

    /**
     * @deprectated use `getFallbackLang()`
     */
    public abstract readonly onDefaultLangChange: Observable<DefaultLangChangeEvent>;
}

@Injectable()
export class TranslateService implements ITranslateService {
    private loadingTranslations!: Observable<InterpolatableTranslationObject>;
    private pending = false;
    private _translationRequests: Record<Language, Observable<TranslationObject>> = {};
    private lastUseLanguage: Language | null = null;

    public currentLoader = inject(TranslateLoader);
    public compiler = inject(TranslateCompiler);
    private parser = inject(TranslateParser);
    private missingTranslationHandler = inject(MissingTranslationHandler);
    private store: TranslateStore = inject(TranslateStore);

    private readonly extend:boolean = false;

    /**
     * An Observable to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     */
    public get onTranslationChange(): Observable<TranslationChangeEvent> {
        return this.store.onTranslationChange;
    }

    /**
     * An Observable to listen to lang change events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     */
    get onLangChange(): Observable<LangChangeEvent> {
        return this.store.onLangChange;
    }

    /**
     * An Observable to listen to fallback lang change events
     * onFallbackLangChange.subscribe((params: FallbackLangChangeEvent) => {
     *     // do something
     * });
     */
    get onFallbackLangChange(): Observable<FallbackLangChangeEvent> {
        return this.store.onFallbackLangChange;
    }

    /**
     * @deprecated Use onFallbackLangChange() instead
     */
    get onDefaultLangChange(): Observable<DefaultLangChangeEvent> {
        return this.store.onFallbackLangChange;
    }

    constructor() {
        const config: TranslateServiceConfig = {
            extend: false,
            fallbackLang: null,

            ...inject<TranslateServiceConfig>(TRANSLATE_SERVICE_CONFIG, {
                optional: true,
            }),
        };

        if (config.lang) {
            this.use(config.lang);
        }

        if (config.fallbackLang) {
            this.setFallbackLang(config.fallbackLang);
        }

        if (config.extend) {
            this.extend = true;
        }
    }

    /**
     * Sets the fallback language to use if a translation is not found in the
     * current language
     */
    public setFallbackLang(lang: Language): Observable<InterpolatableTranslationObject> {
        if (!this.getFallbackLang()) {
            // on init set the fallbackLang immediately, but do not emit a change yet
            this.store.setFallbackLang(lang, false);
        }

        const pending = this.loadOrExtendLanguage(lang);
        if (isObservable(pending)) {
            pending.pipe(take(1)).subscribe({
                next: () => {
                    this.store.setFallbackLang(lang);
                },
                error: () => {
                    /* ignore here - user can handle it */
                },
            });
            return pending;
        }

        this.store.setFallbackLang(lang);
        return of(this.store.getTranslations(lang));
    }

    /**
     * Changes the lang currently used
     */
    public use(lang: Language): Observable<InterpolatableTranslationObject> {
        // remember the language that was called
        // we need this with multiple fast calls to use()
        // where translation loads might complete in random order
        this.lastUseLanguage = lang;

        if (!this.getCurrentLang()) {
            // on init set the currentLang immediately, but do not emit a change yet
            this.store.setCurrentLang(lang, false);
        }

        const pending = this.loadOrExtendLanguage(lang);
        if (isObservable(pending)) {
            pending.pipe(take(1)).subscribe({
                next: () => {
                    this.changeLang(lang);
                },
                error: () => {
                    /* ignore here - use can handle it */
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
    private loadOrExtendLanguage(lang: Language): Observable<TranslationObject> | undefined {
        // if this language is unavailable or extend is true, ask for it
        if (!this.store.hasTranslationFor(lang) || this.extend) {
            this._translationRequests[lang] =
                this._translationRequests[lang] || this.loadAndCompileTranslations(lang);
            return this._translationRequests[lang];
        }

        return undefined;
    }

    /**
     * Changes the current lang
     */
    private changeLang(lang: Language): void {
        if (lang !== this.lastUseLanguage) {
            // received new language data,
            // but this was not the one requested last
            return;
        }

        this.store.setCurrentLang(lang);
    }

    public getCurrentLang(): Language {
        return this.store.getCurrentLang();
    }

    private loadAndCompileTranslations(
        lang: Language,
    ): Observable<InterpolatableTranslationObject> {
        this.pending = true;

        const loadingTranslations = this.currentLoader
            .getTranslation(lang)
            .pipe(shareReplay(1), take(1));

        this.loadingTranslations = loadingTranslations.pipe(
            map((res: TranslationObject) => this.compiler.compileTranslations(res, lang)),
            shareReplay(1),
            take(1),
        );

        this.loadingTranslations.subscribe({
            next: (res: InterpolatableTranslationObject) => {
                this.store.setTranslations(lang, res, this.extend);
                this.pending = false;
            },
            error: (err) => {
                void err;
                this.pending = false;
            },
        });

        return loadingTranslations;
    }

    /**
     * Manually sets an object of translations for a given language
     * after passing it through the compiler
     */
    public setTranslation(
        lang: Language,
        translations: TranslationObject,
        shouldMerge = false,
    ): void {
        const interpolatableTranslations: InterpolatableTranslationObject =
            this.compiler.compileTranslations(translations, lang);
        this.store.setTranslations(lang, interpolatableTranslations, shouldMerge || this.extend);
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

    private getParsedResultForKey(
        key: string,
        interpolateParams?: InterpolationParameters,
    ): StrictTranslation | Observable<StrictTranslation> {
        const textToInterpolate = this.getTextToInterpolate(key);

        if (isDefinedAndNotNull(textToInterpolate)) {
            return this.runInterpolation(textToInterpolate, interpolateParams);
        }

        const res = this.missingTranslationHandler.handle({
            key,
            translateService: this,
            ...(interpolateParams !== undefined && { interpolateParams }),
        });

        return res !== undefined ? res : key;
    }

    /**
     * Gets the fallback language. null if none is defined
     */
    public getFallbackLang(): Language | null {
        return this.store.getFallbackLang();
    }

    private getTextToInterpolate(key: string): InterpolatableTranslation | undefined {
        return this.store.getTranslation(key);
    }

    private runInterpolation(
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

    private runInterpolationOnArray(
        translations: InterpolatableTranslation,
        interpolateParams: InterpolationParameters | undefined,
    ) {
        return (translations as StrictTranslation[]).map((translation) =>
            this.runInterpolation(translation, interpolateParams),
        );
    }

    private runInterpolationOnDict(
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
    ): StrictTranslation | Observable<StrictTranslation> {
        return key instanceof Array
            ? this.getParsedResultForArray(key, interpolateParams)
            : this.getParsedResultForKey(key, interpolateParams);
    }

    private getParsedResultForArray(
        key: string[],
        interpolateParams: InterpolationParameters | undefined,
    ) {
        const result: Record<string, StrictTranslation | Observable<StrictTranslation>> = {};

        let observables = false;
        for (const k of key) {
            result[k] = this.getParsedResultForKey(k, interpolateParams);
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
    ): Observable<Translation> {
        if (!isDefinedAndNotNull(key) || !key.length) {
            throw new Error(`Parameter "key" is required and cannot be empty`);
        }
        // check if we are loading a new translation to use
        if (this.pending) {
            return this.loadingTranslations.pipe(
                concatMap(() => {
                    return makeObservable(this.getParsedResult(key, interpolateParams));
                }),
            );
        }

        return makeObservable(this.getParsedResult(key, interpolateParams));
    }

    /**
     * Returns a stream of translated values of a key (or an array of keys) which updates
     * whenever the translation changes.
     * @returns A stream of the translated key, or an object of translated keys
     */
    public getStreamOnTranslationChange(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
    ): Observable<Translation> {
        if (!isDefinedAndNotNull(key) || !key.length) {
            throw new Error(`Parameter "key" is required and cannot be empty`);
        }

        return concat(
            defer(() => this.get(key, interpolateParams)),
            this.onTranslationChange.pipe(
                switchMap(() => {
                    const res = this.getParsedResult(key, interpolateParams);
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
    ): Observable<Translation> {
        if (!isDefinedAndNotNull(key) || !key.length) {
            throw new Error(`Parameter "key" required`);
        }

        return concat(
            defer(() => this.get(key, interpolateParams)),
            this.onLangChange.pipe(
                switchMap(() => {
                    const res = this.getParsedResult(key, interpolateParams);
                    return makeObservable(res);
                }),
            ),
        );
    }

    /**
     * Returns a translation instantly from the internal state of loaded translation.
     * All rules regarding the current language, the preferred language of even fallback languages
     * will be used except any promise handling.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public instant<T = any>(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
    ): Translation<T> {
        if (!isDefinedAndNotNull(key) || key.length === 0) {
            throw new Error('Parameter "key" is required and cannot be empty');
        }

        const result = this.getParsedResult(key, interpolateParams);

        if (isObservable(result)) {
            if (Array.isArray(key)) {
                return key.reduce((acc: Record<string, string>, currKey: string) => {
                    acc[currKey] = currKey;
                    return acc;
                }, {});
            }
            return key;
        }

        return result;
    }

    /**
     * Sets the translated value of a key, after compiling it
     */
    public set(
        key: string,
        translation: string | TranslationObject,
        lang: Language = this.getCurrentLang(),
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
        delete this._translationRequests[lang];
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

    /** Deprecations **/

    /**
     * @deprecated use `getFallbackLang()`
     */
    get defaultLang(): Language | null {
        return this.getFallbackLang();
    }

    /**
     * The lang currently used
     * @deprecated use `getCurrentLang()`
     */
    get currentLang(): Language {
        return this.store.getCurrentLang();
    }

    /**
     * @deprecated use `getLangs()`
     */
    get langs(): readonly Language[] {
        return this.store.getLanguages();
    }

    /**
     * Sets the  language to use as a fallback
     * @deprecated use setFallbackLanguage()
     */
    public setDefaultLang(lang: Language): Observable<InterpolatableTranslationObject> {
        return this.setFallbackLang(lang);
    }

    /**
     * Gets the fallback language used
     * @deprecated use getFallbackLang()
     */
    public getDefaultLang(): Language | null {
        return this.getFallbackLang();
    }
}
