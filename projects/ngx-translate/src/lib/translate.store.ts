import { Injectable, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";
import {
    InterpolatableTranslation,
    InterpolatableTranslationObject,
    Language,
    TranslationChangeEvent,
} from "./translate.service.interface";
import { getValue, mergeDeep } from "./util";

export type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

@Injectable()
export class TranslateStore {
    protected _onTranslationChange: Subject<TranslationChangeEvent> =
        new Subject<TranslationChangeEvent>();

    protected translations: Record<Language, InterpolatableTranslationObject> = {};

    $languages = signal<Language[]>([]);

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
        return this.$languages();
    }

    get onTranslationChange(): Observable<TranslationChangeEvent> {
        return this._onTranslationChange.asObservable();
    }

    public addLanguages(languages: Language[]): void {
        this.$languages.set(Array.from(new Set([...this.$languages(), ...languages])));
    }

    public hasTranslationFor(lang: string) {
        return typeof this.translations[lang] !== "undefined";
    }

    public deleteTranslations(lang: string) {
        delete this.translations[lang];
    }

    public getTranslationValue(language: Language, key: string): InterpolatableTranslation {
        return getValue(this.getTranslations(language), key) as InterpolatableTranslation;
    }
}
