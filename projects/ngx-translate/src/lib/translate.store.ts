import { DestroyRef, Injectable, Signal, inject, signal } from "@angular/core";
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

    private readonly _translationChange$ = new Subject<TranslationChangeEvent>();
    readonly translationChange$: Observable<TranslationChangeEvent> =
        this._translationChange$.asObservable();

    constructor() {
        // Complete the Subject when the owning injector tears down. Without
        // this, child-service stores on lazy routes leak `translationChange$`
        // subscribers across navigations.
        inject(DestroyRef).onDestroy(() => {
            this._translationChange$.complete();
        });
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
        this._translationChange$.next(event);
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
