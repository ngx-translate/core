import { EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/toArray';
export interface LangChangeEvent {
    lang: string;
    translations: any;
}
export declare abstract class MissingTranslationHandler {
    /**
     * A function that handles missing translations.
     * @param key the missing key
     * @returns {any} a value or an observable
     * If it returns a value, then this value is used.
     * If it return an observable, the value returned by this observable will be used (except if the method was "instant").
     * If it doesn't return then the key will be used as a value
     */
    abstract handle(key: string): any;
}
export declare abstract class TranslateLoader {
    abstract getTranslation(lang: string): Observable<any>;
}
export declare class TranslateStaticLoader implements TranslateLoader {
    private http;
    private prefix;
    private suffix;
    constructor(http: Http, prefix?: string, suffix?: string);
    /**
     * Gets the translations from the server
     * @param lang
     * @returns {any}
     */
    getTranslation(lang: string): Observable<any>;
}
export declare class TranslateService {
    private http;
    currentLoader: TranslateLoader;
    private missingTranslationHandler;
    /**
     * The lang currently used
     */
    currentLang: string;
    /**
     * An EventEmitter to listen to lang changes events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     * @type {ng.EventEmitter<LangChangeEvent>}
     */
    onLangChange: EventEmitter<LangChangeEvent>;
    private pending;
    private translations;
    private defaultLang;
    private langs;
    private parser;
    /**
     *
     * @param http The Angular 2 http provider
     * @param currentLoader An instance of the loader currently used
     * @param missingTranslationHandler A handler for missing translations.
     */
    constructor(http: Http, currentLoader: TranslateLoader, missingTranslationHandler: MissingTranslationHandler);
    /**
     * Sets the default language to use as a fallback
     * @param lang
     */
    setDefaultLang(lang: string): void;
    /**
     * Changes the lang currently used
     * @param lang
     * @returns {Observable<*>}
     */
    use(lang: string): Observable<any>;
    /**
     * Gets an object of translations for a given language with the current loader
     * @param lang
     * @returns {Observable<*>}
     */
    getTranslation(lang: string): Observable<any>;
    /**
     * Manually sets an object of translations for a given language
     * @param lang
     * @param translations
     */
    setTranslation(lang: string, translations: Object): void;
    /**
     * Returns an array of currently available langs
     * @returns {any}
     */
    getLangs(): Array<string>;
    /**
     * Update the list of available langs
     */
    private updateLangs();
    /**
     * Returns the parsed result of the translations
     * @param translations
     * @param key
     * @param interpolateParams
     * @returns {any}
     */
    private getParsedResult(translations, key, interpolateParams?);
    /**
     * Gets the translated value of a key (or an array of keys)
     * @param key
     * @param interpolateParams
     * @returns {any} the translated key, or an object of translated keys
     */
    get(key: string | Array<string>, interpolateParams?: Object): Observable<string | any>;
    /**
     * Returns a translation instantly from the internal state of loaded translation.
     * All rules regarding the current language, the preferred language of even fallback languages will be used except any promise handling.
     * @param key
     * @param interpolateParams
     * @returns {string}
     */
    instant(key: string | Array<string>, interpolateParams?: Object): string | any;
    /**
     * Sets the translated value of a key
     * @param key
     * @param value
     * @param lang
     */
    set(key: string, value: string, lang?: string): void;
    /**
     * Changes the current lang
     * @param lang
     */
    private changeLang(lang);
    /**
     * Allows to reload the lang file from the file
     * @param lang
     * @returns {Observable<any>}
     */
    reloadLang(lang: string): Observable<any>;
    /**
     * Deletes inner translation
     * @param lang
     */
    resetLang(lang: string): void;
}
