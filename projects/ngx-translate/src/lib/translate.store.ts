import {
    InterpolatableTranslationObject,
    FallbackLangChangeEvent,
    LangChangeEvent,
    TranslationChangeEvent,
    Language,
    InterpolatableTranslation,
} from "./translate.service";
import { Observable, Subject } from "rxjs";
import { getValue, mergeDeep } from "./util";
import { Injectable } from "@angular/core";

export type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

@Injectable()
export class TranslateStore {
    private _onTranslationChange: Subject<TranslationChangeEvent> =
        new Subject<TranslationChangeEvent>();
    private _onLangChange: Subject<LangChangeEvent> = new Subject<LangChangeEvent>();
    private _onFallbackLangChange: Subject<FallbackLangChangeEvent> =
        new Subject<FallbackLangChangeEvent>();

    private fallbackLang: Language|null = null;
    private currentLang!: Language;

    private translations: Record<Language, InterpolatableTranslationObject> = {};
    private languages: Language[] = [];

    public getTranslations(language: Language): DeepReadonly<InterpolatableTranslationObject> {
        return this.translations[language];
    }

    public setTranslations(
        language: Language,
        translations: InterpolatableTranslationObject,
        extend: boolean,
    ): void {
        this.translations[language] =
            extend && this.hasTranslationFor(language)
                ? mergeDeep(this.translations[language], translations)
                : translations;
        this.addLanguages([language]);
        this._onTranslationChange.next({
            lang: language,
            translations: this.getTranslations(language),
        });
    }

    public getLanguages(): readonly Language[] {
        return this.languages;
    }

    public getCurrentLang(): Language {
        return this.currentLang;
    }

    public getFallbackLang(): Language|null {
        return this.fallbackLang;
    }

    /**
     * Changes the fallback lang
     */
    public setFallbackLang(lang: string, emitChange = true): void {
        this.fallbackLang = lang;
        if (emitChange) {
            this._onFallbackLangChange.next({ lang: lang, translations: this.translations[lang] });
        }
    }

    public setCurrentLang(lang: string, emitChange = true): void {
        this.currentLang = lang;
        if (emitChange) {
            this._onLangChange.next({ lang: lang, translations: this.translations[lang] });
        }
    }

    /**
     * An Observable to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     */
    get onTranslationChange(): Observable<TranslationChangeEvent> {
        return this._onTranslationChange.asObservable();
    }

    /**
     * An Observable to listen to lang change events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     */
    get onLangChange(): Observable<LangChangeEvent> {
        return this._onLangChange.asObservable();
    }

    /**
     * An Observable to listen to fallback lang change events
     * onFallbackLangChange.subscribe((params: FallbackLangChangeEvent) => {
     *     // do something
     * });
     */
    get onFallbackLangChange(): Observable<FallbackLangChangeEvent> {
        return this._onFallbackLangChange.asObservable();
    }

    public addLanguages(languages: Language[]): void {
        this.languages = Array.from(new Set([...this.languages, ...languages]));
    }

    public hasTranslationFor(lang: string) {
        return typeof this.translations[lang] !== "undefined";
    }

    public deleteTranslations(lang: string) {
        delete this.translations[lang];
    }

    public getTranslation(key: string): InterpolatableTranslation {
        let text = this.getValue(this.currentLang, key);

        if (
            text === undefined &&
            this.fallbackLang != null &&
            this.fallbackLang !== this.currentLang
        ) {
            text = this.getValue(this.fallbackLang, key);
        }
        return text;
    }

    protected getValue(language: Language, key: string): InterpolatableTranslation {
        return getValue(this.getTranslations(language), key) as InterpolatableTranslation;
    }
}
