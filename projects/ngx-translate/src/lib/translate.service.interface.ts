import { InterpolateFunction } from "./translate.parser";
import { Signal } from "@angular/core";
import { Observable } from "rxjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface FallbackLangChangeEvent {
    lang: string;
    translations: InterpolatableTranslationObject;
}

export abstract class ITranslateService {
    public abstract readonly onTranslationChange: Observable<TranslationChangeEvent>;
    public abstract readonly onLangChange: Observable<LangChangeEvent>;
    public abstract readonly onFallbackLangChange: Observable<FallbackLangChangeEvent>;

    /**
     * A combined Observable that emits whenever translations might need to be refreshed.
     * This includes: language changes, translation updates for the current language,
     * and fallback language changes.
     */
    public abstract readonly onTranslationRefresh: Observable<void>;

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
        lang?: Language,
    ): Translation;

    /**
     * Returns a Signal that provides the translated value and automatically updates
     * when the language changes, translations are updated, or when the input signals change.
     *
     * @param key - The translation key, either as a string or a Signal<string>
     * @param params - Optional interpolation parameters, either as an object or a Signal
     * @returns A Signal that emits the translated value
     */
    public abstract translate(
        key: string | Signal<string>,
        params?: InterpolationParameters | Signal<InterpolationParameters | undefined>,
        lang?: Language | Signal<Language>,
    ): Signal<Translation | TranslationObject>;

    public abstract stream(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): Observable<Translation>;

    public abstract getStreamOnTranslationChange(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): Observable<Translation>;

    public abstract set(
        key: string,
        translation: string | TranslationObject,
        lang?: Language,
    ): void;

    public abstract get(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): Observable<Translation>;

    public abstract setTranslation(
        lang: Language,
        translations: TranslationObject,
        shouldMerge?: boolean,
    ): void;

    public abstract getParsedResult(
        key: string | string[],
        interpolateParams?: InterpolationParameters,
        lang?: Language,
    ): StrictTranslation | Observable<StrictTranslation>;

    public abstract getBrowserLang(): Language | undefined;

    public abstract getBrowserCultureLang(): Language | undefined;

    /**
     * The current language as a reactive Signal.
     * Use `getCurrentLang()` for a non-reactive snapshot.
     */
    public abstract readonly currentLang: Signal<Language | null>;

    /**
     * The fallback language as a reactive Signal.
     * Use `getFallbackLang()` for a non-reactive snapshot.
     */
    public abstract readonly fallbackLang: Signal<Language | null>;

    /**
     * Returns the current language as a plain value (non-reactive).
     * Use `currentLang` signal for reactive usage.
     */
    public abstract getCurrentLang(): Language | null;

    /**
     * Returns the loaded translations for the given language.
     */
    public abstract getTranslations(language: Language): InterpolatableTranslationObject;

}
