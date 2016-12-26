import {Injectable, EventEmitter, Optional} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import "rxjs/add/observable/of";
import "rxjs/add/operator/share";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/toArray";
import "rxjs/add/operator/take";

import {TranslateParser} from "./translate.parser";
import {isDefined} from "./util";

export interface TranslationChangeEvent {
    translations: any;
    lang: string;
}

export interface LangChangeEvent {
    lang: string;
    translations: any;
}

export interface DefaultLangChangeEvent {
    lang: string;
    translations: any;
}

export interface MissingTranslationHandlerParams {
    /**
     * the key that's missing in translation files
     *
     * @type {string}
     */
    key: string;

    /**
     * an instance of the service that was unable to translate the key.
     *
     * @type {TranslateService}
     */
    translateService: TranslateService;

    /**
     * interpolation params that were passed along for translating the given key.
     *
     * @type {Object}
     */
    interpolateParams?: Object;
}

declare interface Window {
    navigator: any;
}
declare const window: Window;

export abstract class MissingTranslationHandler {
    /**
     * A function that handles missing translations.
     *
     * @abstract
     * @param {MissingTranslationHandlerParams} params context for resolving a missing translation
     * @returns {any} a value or an observable
     * If it returns a value, then this value is used.
     * If it return an observable, the value returned by this observable will be used (except if the method was "instant").
     * If it doesn't return then the key will be used as a value
     */
    abstract handle(params: MissingTranslationHandlerParams): any;
}

export abstract class TranslateLoader {
    abstract getTranslation(lang: string): Observable<any>;
}

@Injectable()
export class TranslateService {
    /**
     * The lang currently used
     */
    public currentLang: string = this.defaultLang;

    /**
     * An EventEmitter to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<TranslationChangeEvent>}
     */
    public onTranslationChange: EventEmitter<TranslationChangeEvent> = new EventEmitter<TranslationChangeEvent>();

    /**
     * An EventEmitter to listen to lang change events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<LangChangeEvent>}
     */
    public onLangChange: EventEmitter<LangChangeEvent> = new EventEmitter<LangChangeEvent>();

    /**
     * An EventEmitter to listen to default lang change events
     * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<DefaultLangChangeEvent>}
     */
    public onDefaultLangChange: EventEmitter<DefaultLangChangeEvent> = new EventEmitter<DefaultLangChangeEvent>();

    private loadingTranslations: Observable<any>;
    private pending: boolean = false;
    private translations: any = {};
    private defaultLang: string;
    private langs: Array<string> = [];

    /**
     *
     * @param currentLoader An instance of the loader currently used
     * @param parser An instance of the parser currently used
     * @param missingTranslationHandler A handler for missing translations.
     */
    constructor(public currentLoader: TranslateLoader,
                public parser: TranslateParser,
                @Optional() private missingTranslationHandler: MissingTranslationHandler) {
    }

    /**
     * Sets the default language to use as a fallback
     * @param lang
     */
    public setDefaultLang(lang: string): void {
        if(lang === this.defaultLang) {
            return;
        }

        let pending: Observable<any> = this.retrieveTranslations(lang);

        if(typeof pending !== "undefined") {
            // on init set the defaultLang immediately
            if(!this.defaultLang) {
                this.defaultLang = lang;
            }

            pending.take(1)
                .subscribe((res: any) => {
                    this.changeDefaultLang(lang);
                });
        } else { // we already have this language
            this.changeDefaultLang(lang);
        }
    }

    /**
     * Gets the default language used
     * @returns string
     */
    public getDefaultLang(): string {
        return this.defaultLang;
    }

    /**
     * Changes the lang currently used
     * @param lang
     * @returns {Observable<*>}
     */
    public use(lang: string): Observable<any> {
        let pending: Observable<any> = this.retrieveTranslations(lang);

        if(typeof pending !== "undefined") {
            // on init set the currentLang immediately
            if(!this.currentLang) {
                this.currentLang = lang;
            }

            pending.take(1)
                .subscribe((res: any) => {
                    this.changeLang(lang);
                });

            return pending;
        } else { // we have this language, return an Observable
            this.changeLang(lang);

            return Observable.of(this.translations[lang]);
        }
    }

    /**
     * Retrieves the given translations
     * @param lang
     * @returns {Observable<*>}
     */
    private retrieveTranslations(lang: string): Observable<any> {
        let pending: Observable<any>;

        // if this language is unavailable, ask for it
        if(typeof this.translations[lang] === "undefined") {
            pending = this.getTranslation(lang);
        }

        return pending;
    }

    /**
     * Gets an object of translations for a given language with the current loader
     * @param lang
     * @returns {Observable<*>}
     */
    public getTranslation(lang: string): Observable<any> {
        this.pending = true;
        this.loadingTranslations = this.currentLoader.getTranslation(lang).share();

        this.loadingTranslations.take(1)
            .subscribe((res: Object) => {
                this.translations[lang] = res;
                this.updateLangs();
                this.pending = false;
            }, (err: any) => {
                this.pending = false;
            });

        return this.loadingTranslations;
    }

    /**
     * Manually sets an object of translations for a given language
     * @param lang
     * @param translations
     * @param shouldMerge
     */
    public setTranslation(lang: string, translations: Object, shouldMerge: boolean = false): void {
        if(shouldMerge && this.translations[lang]) {
            Object.assign(this.translations[lang], translations);
        } else {
            this.translations[lang] = translations;
        }
        this.updateLangs();
        this.onTranslationChange.emit({lang: lang, translations: this.translations[lang]});
    }

    /**
     * Returns an array of currently available langs
     * @returns {any}
     */
    public getLangs(): Array<string> {
        return this.langs;
    }

    /**
     * @param langs
     * Add available langs
     */
    public addLangs(langs: Array<string>): void {
        langs.forEach((lang: string) => {
            if(this.langs.indexOf(lang) === -1) {
                this.langs.push(lang);
            }
        });
    }

    /**
     * Update the list of available langs
     */
    private updateLangs(): void {
        this.addLangs(Object.keys(this.translations));
    }

    /**
     * Returns the parsed result of the translations
     * @param translations
     * @param key
     * @param interpolateParams
     * @returns {any}
     */
    public getParsedResult(translations: any, key: any, interpolateParams?: Object): any {
        let res: string|Observable<string>;

        if(key instanceof Array) {
            let result: any = {},
                observables: boolean = false;
            for(let k of key) {
                result[k] = this.getParsedResult(translations, k, interpolateParams);
                if(typeof result[k].subscribe === "function") {
                    observables = true;
                }
            }
            if(observables) {
                let mergedObs: any;
                for(let k of key) {
                    let obs = typeof result[k].subscribe === "function" ? result[k] : Observable.of(result[k]);
                    if(typeof mergedObs === "undefined") {
                        mergedObs = obs;
                    } else {
                        mergedObs = mergedObs.merge(obs);
                    }
                }
                return mergedObs.toArray().map((arr: Array<string>) => {
                    let obj: any = {};
                    arr.forEach((value: string, index: number) => {
                        obj[key[index]] = value;
                    });
                    return obj;
                });
            }
            return result;
        }

        if(translations) {
            res = this.parser.interpolate(this.parser.getValue(translations, key), interpolateParams);
        }

        if(typeof res === "undefined" && this.defaultLang && this.defaultLang !== this.currentLang) {
            res = this.parser.interpolate(this.parser.getValue(this.translations[this.defaultLang], key), interpolateParams);
        }

        if(!res && this.missingTranslationHandler) {
            let params: MissingTranslationHandlerParams = {key, translateService: this};
            if(typeof interpolateParams !== 'undefined') {
                params.interpolateParams = interpolateParams;
            }
            res = this.missingTranslationHandler.handle(params);
        }

        return typeof res !== "undefined" ? res : key;
    }

    /**
     * Gets the translated value of a key (or an array of keys)
     * @param key
     * @param interpolateParams
     * @returns {any} the translated key, or an object of translated keys
     */
    public get(key: string|Array<string>, interpolateParams?: Object): Observable<string|any> {
        if(!isDefined(key) || !key.length) {
            throw new Error(`Parameter "key" required`);
        }
        // check if we are loading a new translation to use
        if(this.pending) {
            return Observable.create((observer: Observer<string>) => {
                let onComplete = (res: string) => {
                    observer.next(res);
                    observer.complete();
                };
                let onError = (err: any) => {
                    observer.error(err);
                };
                this.loadingTranslations.subscribe((res: any) => {
                    res = this.getParsedResult(res, key, interpolateParams);
                    if(typeof res.subscribe === "function") {
                        res.subscribe(onComplete, onError);
                    } else {
                        onComplete(res);
                    }
                }, onError);
            });
        } else {
            let res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
            if(typeof res.subscribe === "function") {
                return res;
            } else {
                return Observable.of(res);
            }
        }
    }

    /**
     * Returns a translation instantly from the internal state of loaded translation.
     * All rules regarding the current language, the preferred language of even fallback languages will be used except any promise handling.
     * @param key
     * @param interpolateParams
     * @returns {string}
     */
    public instant(key: string|Array<string>, interpolateParams?: Object): string|any {
        if(!isDefined(key) || !key.length) {
            throw new Error(`Parameter "key" required`);
        }

        let res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
        if(typeof res.subscribe !== "undefined") {
            if(key instanceof Array) {
                let obj: any = {};
                key.forEach((value: string, index: number) => {
                    obj[key[index]] = key[index];
                });
                return obj;
            }
            return key;
        } else {
            return res;
        }
    }

    /**
     * Sets the translated value of a key
     * @param key
     * @param value
     * @param lang
     */
    public set(key: string, value: string, lang: string = this.currentLang): void {
        this.translations[lang][key] = value;
        this.updateLangs();
        this.onTranslationChange.emit({lang: lang, translations: this.translations[lang]});
    }

    /**
     * Changes the current lang
     * @param lang
     */
    private changeLang(lang: string): void {
        this.currentLang = lang;
        this.onLangChange.emit({lang: lang, translations: this.translations[lang]});

        // if there is no default lang, use the one that we just set
        if(!this.defaultLang) {
            this.changeDefaultLang(lang);
        }
    }

    /**
     * Changes the default lang
     * @param lang
     */
    private changeDefaultLang(lang: string): void {
        this.defaultLang = lang;
        this.onDefaultLangChange.emit({lang: lang, translations: this.translations[lang]});
    }

    /**
     * Allows to reload the lang file from the file
     * @param lang
     * @returns {Observable<any>}
     */
    public reloadLang(lang: string): Observable<any> {
        this.resetLang(lang);
        return this.getTranslation(lang);
    }

    /**
     * Deletes inner translation
     * @param lang
     */
    public resetLang(lang: string): void {
        this.translations[lang] = undefined;
    }

    /**
     * Returns the language code name from the browser, e.g. "de"
     *
     * @returns string
     */
    public getBrowserLang(): string {
        if(typeof window === 'undefined' || typeof window.navigator === 'undefined') {
            return undefined;
        }

        let browserLang: any = window.navigator.languages ? window.navigator.languages[0] : null;
        browserLang = browserLang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;

        if(browserLang.indexOf('-') !== -1) {
            browserLang = browserLang.split('-')[0];
        }

        if(browserLang.indexOf('_') !== -1) {
            browserLang = browserLang.split('_')[0];
        }

        return browserLang;
    }

    /**
     * Returns the culture language code name from the browser, e.g. "de-DE"
     *
     * @returns string
     */
    public getBrowserCultureLang(): string {
        if(typeof window === 'undefined' || typeof window.navigator === 'undefined') {
            return undefined;
        }

        let browserCultureLang: any = window.navigator.languages ? window.navigator.languages[0] : null;
        browserCultureLang = browserCultureLang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;

        return browserCultureLang;
    }
}
