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
     * whenever the currentLang, fallbackLang, or the translations change.
     *
     * Parameters accept plain values or arrow functions. Signal reads inside
     * the function are tracked reactively. Signals themselves are also accepted
     * directly, since Signal<T> is callable.
     *
     * @param key - The translation key (or array of keys), a function returning one
     * @param params - Optional interpolation parameters, or a function returning them
     * @param lang - Optional language override, or a function returning one
     * @returns A Signal that emits the translated value
     */
    public abstract translate(
        key: string | string[] | (() => string | string[]),
        params?: InterpolationParameters | (() => InterpolationParameters | undefined),
        lang?: Language | (() => Language | undefined),
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

    public abstract setCompiledTranslation(
        lang: Language,
        translations: InterpolatableTranslationObject,
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
     * `true` while one or more language loads are in flight at this service
     * or any of its ancestors in the service hierarchy.
     *
     * Loading scope propagates DOWNWARD: a load triggered at the root marks
     * the root and all descendants as loading. A load triggered at a child
     * (e.g. a lazy-route bootstrap fetching its translations) marks only that
     * child's subtree. Siblings and ancestors are unaffected by a descendant's
     * loads.
     *
     * Drive a spinner by reading it from the service injected at the scope
     * where the spinner should live: root for an app-shell spinner, the
     * nearest child for a local spinner inside a lazy-loaded subtree.
     */
    public abstract readonly isLoading: Signal<boolean>;

    /**
     * Returns the current language as a plain value (non-reactive).
     * Use `currentLang` signal for reactive usage.
     */
    public abstract getCurrentLang(): Language | null;

    /**
     * Returns the loaded translations for the given language.
     */
    public abstract getTranslations(language: Language): InterpolatableTranslationObject;

    /**
     * Returns the service this one inherits translations from, or `null` if
     * this is a root (a top-level service or an isolated subtree root).
     *
     * A `null` return means the service is the terminus of its translation
     * fallback chain — equivalent to "is this a root?".
     */
    public abstract getParent(): ITranslateService | null;

    /**
     * Returns the root of this service's hierarchy — the topmost service in
     * the `getParent()` chain. For an isolated subtree, returns the subtree's
     * root (since `getParent()` returns `null` at the isolation boundary).
     *
     * A root service returns itself.
     */
    public abstract getRoot(): ITranslateService;
}
