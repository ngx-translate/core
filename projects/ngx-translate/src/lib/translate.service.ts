import { inject, Injectable, InjectionToken } from "@angular/core";
import { concat, defer, forkJoin, isObservable, Observable, of } from "rxjs";
import { concatMap, map, shareReplay, switchMap, take } from "rxjs/operators";
import {
    FakeMissingTranslationHandler,
    MissingTranslationHandler,
} from "./missing-translation-handler";
import { TranslateCompiler, TranslateFakeCompiler } from "./translate.compiler";
import { TranslateFakeLoader, TranslateLoader } from "./translate.loader";
import { InterpolateFunction, TranslateDefaultParser, TranslateParser } from "./translate.parser";
import { TranslateStore } from "./translate.store";
import { insertValue, isArray, isDefinedAndNotNull, isDict, isString } from "./util";

export interface TranslateServiceConfig {
    defaultLanguage?: Language;
    extend: boolean;
    isolate: boolean;
    useDefaultLang: boolean;
}

export const TRANSLATE_SERVICE_CONFIG = new InjectionToken<TranslateServiceConfig>(
    "TRANSLATE_CONFIG",
);

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type InterpolationParameters = Record<string, any>;


export type StrictTranslation = string | StrictTranslation[] | TranslationObject | undefined | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Translation = StrictTranslation | any;

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

export interface DefaultLangChangeEvent {
    lang: string;
    translations: InterpolatableTranslationObject;
}

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

@Injectable({
    providedIn: "root",
})
export class TranslateService {
    private loadingTranslations!: Observable<InterpolatableTranslationObject>;
    private pending = false;
    private _translationRequests: Record<Language, Observable<TranslationObject>> = {};
    private lastUseLanguage: Language | null = null;

    /**
     * An Observable to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     */
    get onTranslationChange(): Observable<TranslationChangeEvent> {
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
     * An Observable to listen to default lang change events
     * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
     */
    get onDefaultLangChange(): Observable<DefaultLangChangeEvent> {
        return this.store.onDefaultLangChange;
    }

    /**
     * The default lang to fallback when translations are missing on the current lang
     */
    get defaultLang(): Language {
        return this.store.getDefaultLanguage();
    }

    /**
     * The lang currently used
     */
    get currentLang(): Language {
        return this.store.getCurrentLanguage();
    }

    /**
     * an array of langs
     */
    get langs(): readonly Language[] {
        return this.store.getLanguages();
    }

    private store: TranslateStore;
    public currentLoader: TranslateLoader;
    public compiler: TranslateCompiler;
    private parser: TranslateParser;
    private missingTranslationHandler: MissingTranslationHandler;

    private config: TranslateServiceConfig = inject<TranslateServiceConfig>(
        TRANSLATE_SERVICE_CONFIG,
        {
            optional: true,
        },
    ) ?? {
        defaultLanguage: undefined,
        extend: false,
        isolate: false,
        useDefaultLang: true,
    };

    constructor() {
        this.currentLoader =
            inject(TranslateLoader, { optional: true }) ?? new TranslateFakeLoader();
        this.compiler =
            inject(TranslateCompiler, { optional: true }) ?? new TranslateFakeCompiler();
        this.parser = inject(TranslateParser, { optional: true }) ?? new TranslateDefaultParser();
        this.missingTranslationHandler =
            inject(MissingTranslationHandler, { optional: true }) ??
            new FakeMissingTranslationHandler();

        if (this.config.isolate) {
            this.store = new TranslateStore();
        } else {
            this.store = inject(TranslateStore) ?? new TranslateStore();
        }

        if (this.config.defaultLanguage) {
            this.setDefaultLang(this.config.defaultLanguage);
        }
    }

    /**
     * Sets the default language to use as a fallback
     */
    public setDefaultLang(lang: string): Observable<InterpolatableTranslationObject> {
        if (!this.defaultLang) {
            // on init set the defaultLang immediately, but do not emit a change yet
            this.store.setDefaultLang(lang, false);
        }

        const pending = this.loadOrExtendLanguage(lang);
        if (isObservable(pending)) {
            pending.pipe(take(1)).subscribe(() => {
                this.store.setDefaultLang(lang);
            });
            return pending;
        }

        this.store.setDefaultLang(lang);
        return of(this.store.getTranslations(lang));
    }

    /**
     * Gets the default language used
     */
    public getDefaultLang(): string {
        return this.defaultLang;
    }

    /**
     * Changes the lang currently used
     */
    public use(lang: string): Observable<InterpolatableTranslationObject> {
        // remember the language that was called
        // we need this with multiple fast calls to use()
        // where translation loads might complete in random order
        this.lastUseLanguage = lang;

        if (!this.currentLang) {
            // on init set the currentLang immediately, but do not emit a change yet
            this.store.setCurrentLang(lang, false);
        }

        const pending = this.loadOrExtendLanguage(lang);
        if (isObservable(pending)) {
            pending.pipe(take(1)).subscribe(() => {
                this.changeLang(lang);
            });
            return pending;
        }

        this.changeLang(lang);
        return of(this.store.getTranslations(lang));
    }

    /**
     * Retrieves the given translations
     */
    private loadOrExtendLanguage(lang: string): Observable<TranslationObject> | undefined {
        // if this language is unavailable or extend is true, ask for it
        if (!this.store.hasTranslationFor(lang) || this.config.extend) {
            this._translationRequests[lang] =
                this._translationRequests[lang] || this.loadAndCompileTranslations(lang);
            return this._translationRequests[lang];
        }

        return undefined;
    }

    /**
     * Changes the current lang
     */
    private changeLang(lang: string): void {
        if (lang !== this.lastUseLanguage) {
            // received new language data,
            // but this was not the one requested last
            return;
        }

        this.store.setCurrentLang(lang);

        if (this.defaultLang == null) {
            // if there is no default lang, use the one that we just set
            this.store.setDefaultLang(lang);
        }
    }

    private loadAndCompileTranslations(lang: string): Observable<InterpolatableTranslationObject> {
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
                this.store.setTranslations(lang, res, this.config.extend);
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
        this.store.setTranslations(
            lang,
            interpolatableTranslations,
            shouldMerge || this.config.extend,
        );
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

    private getTextToInterpolate(key: string): InterpolatableTranslation | undefined {
        return this.store.getTranslation(key, this.config.useDefaultLang);
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
    ): StrictTranslation | TranslationObject | Observable<StrictTranslation | TranslationObject> {
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
    ): Observable<Translation | TranslationObject> {
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
    ): Observable<Translation | TranslationObject> {
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
    ): Observable<Translation | TranslationObject> {
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
    public instant(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
    ): Translation | TranslationObject {
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
        lang: Language = this.currentLang,
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
     * Allows to reload the lang file from the file
     */
    public reloadLang(lang: string): Observable<InterpolatableTranslationObject> {
        this.resetLang(lang);
        return this.loadAndCompileTranslations(lang);
    }

    /**
     * Deletes inner translation
     */
    public resetLang(lang: string): void {
        delete this._translationRequests[lang];
        this.store.deleteTranslations(lang);
    }

    /**
     * Returns the language code name from the browser, e.g. "de"
     */
    public getBrowserLang(): string | undefined {
        if (typeof window === "undefined" || !window.navigator) {
            return undefined;
        }

        const browserLang = this.getBrowserCultureLang();

        return browserLang ? browserLang.split(/[-_]/)[0] : undefined;
    }

    /**
     * Returns the culture language code name from the browser, e.g. "de-DE"
     */
    public getBrowserCultureLang(): string | undefined {
        if (typeof window === "undefined" || typeof window.navigator === "undefined") {
            return undefined;
        }

        return window.navigator.languages
            ? window.navigator.languages[0]
            : window.navigator.language ||
                  window.navigator.browserLanguage ||
                  window.navigator.userLanguage;
    }
}
