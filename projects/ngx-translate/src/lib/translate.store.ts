import { Injectable, Signal, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { getValue, mergeDeep } from "./util";
import {
    InterpolatableTranslation,
    InterpolatableTranslationObject,
    Language,
    TranslationChangeEvent,
} from "./translate.service.interface";

export type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

@Injectable()
export class TranslateStore {
    private readonly _translations = signal<Record<Language, InterpolatableTranslationObject>>({});
    readonly translations: Signal<Record<Language, InterpolatableTranslationObject>> =
        this._translations.asReadonly();

    private readonly _languages = signal<Language[]>([]);
    readonly languages: Signal<Language[]> = this._languages.asReadonly();

    private readonly _lastTranslationChange = signal<TranslationChangeEvent | null>(null);
    readonly lastTranslationChange: Signal<TranslationChangeEvent | null> =
        this._lastTranslationChange.asReadonly();

    /**
     * @deprecated Will be removed in Task 2. Use lastTranslationChange signal instead.
     */
    private _onTranslationChange: Subject<TranslationChangeEvent> =
        new Subject<TranslationChangeEvent>();

    /**
     * @deprecated Will be removed in Task 2. Use lastTranslationChange signal instead.
     */
    get onTranslationChange(): Observable<TranslationChangeEvent> {
        return this._onTranslationChange.asObservable();
    }

    public getTranslations(language: Language): DeepReadonly<InterpolatableTranslationObject> {
        return this.translations()[language];
    }

    public setTranslations(
        language: Language,
        translations: InterpolatableTranslationObject,
        extend: boolean,
    ): void {
        this._translations.update((current) => ({
            ...current,
            [language]:
                extend && this.hasTranslationFor(language)
                    ? mergeDeep(current[language], translations)
                    : translations,
        }));
        this.addLanguages([language]);
        const event: TranslationChangeEvent = {
            lang: language,
            translations: this.getTranslations(language),
        };
        this._lastTranslationChange.set(event);
        this._onTranslationChange.next(event);
    }

    public getLanguages(): readonly Language[] {
        return this.languages();
    }

    public addLanguages(langs: Language[]): void {
        this._languages.update((current) => Array.from(new Set([...current, ...langs])));
    }

    public hasTranslationFor(lang: string) {
        return typeof this.translations()[lang] !== "undefined";
    }

    public deleteTranslations(lang: string) {
        this._translations.update((current) => {
            const { [lang]: _, ...rest } = current;
            return rest;
        });
    }

    public getTranslationValue(language: Language, key: string): InterpolatableTranslation {
        return getValue(this.getTranslations(language), key) as InterpolatableTranslation;
    }
}
