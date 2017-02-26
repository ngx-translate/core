import {Injectable, EventEmitter, Inject, OpaqueToken} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import "rxjs/add/observable/of";
import "rxjs/add/operator/share";
import "rxjs/add/operator/map";
import "rxjs/add/operator/merge";
import "rxjs/add/operator/toArray";
import "rxjs/add/operator/take";

import {TranslateStore} from "./translate.store";
import {TranslateLoader} from "./translate.loader";
import {MissingTranslationHandler, MissingTranslationHandlerParams} from "./missing-translation-handler";
import {TranslateParser} from "./translate.parser";
import {isDefined} from "./util";

export const USE_STORE = new OpaqueToken('USE_STORE');

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

declare interface Window {
    navigator: any;
}
declare const window: Window;

@Injectable()
export class TranslateService {
    private loadingTranslations: Observable<any>;
    private pending: boolean = false;
    private _onTranslationChange: EventEmitter<TranslationChangeEvent> = new EventEmitter<TranslationChangeEvent>();
    private _onLangChange: EventEmitter<LangChangeEvent> = new EventEmitter<LangChangeEvent>();
    private _onDefaultLangChange: EventEmitter<DefaultLangChangeEvent> = new EventEmitter<DefaultLangChangeEvent>();
    private _defaultLang: string;
    private _currentLang: string;
    private _langs: Array<string> = [];
    private _translations: any = {};
    private _translationRequests: any  = {};

    /**
     * An EventEmitter to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<TranslationChangeEvent>}
     */
    get onTranslationChange(): EventEmitter<TranslationChangeEvent> {
        return this.isolate ? this._onTranslationChange : this.store.onTranslationChange;
    }

    /**
     * An EventEmitter to listen to lang change events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<LangChangeEvent>}
     */
    get onLangChange(): EventEmitter<LangChangeEvent> {
        return this.isolate ? this._onLangChange : this.store.onLangChange;
    }

    /**
     * An EventEmitter to listen to default lang change events
     * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<DefaultLangChangeEvent>}
     */
    get onDefaultLangChange() {
        return this.isolate ? this._onDefaultLangChange : this.store.onDefaultLangChange;
    }

    /**
     * The default lang to fallback when translations are missing on the current lang
     */
    get defaultLang(): string {
        return this.isolate ? this._defaultLang : this.store.defaultLang;
    }

    set defaultLang(defaultLang: string) {
        if(this.isolate) {
            this._defaultLang = defaultLang;
        } else {
            this.store.defaultLang = defaultLang;
        }
    }

    /**
     * The lang currently used
     * @type {string}
     */
    get currentLang(): string {
        return this.isolate ? this._currentLang : this.store.currentLang;
    }

    set currentLang(currentLang: string) {
        if(this.isolate) {
            this._currentLang = currentLang;
        } else {
            this.store.currentLang = currentLang;
        }
    }

    /**
     * an array of langs
     * @type {Array}
     */
    get langs(): string[] {
        return this.isolate ? this._langs : this.store.langs;
    }

    set langs(langs: string[]) {
        if(this.isolate) {
            this._langs = langs;
        } else {
            this.store.langs = langs;
        }
    }

    /**
     * a list of translations per lang
     * @type {{}}
     */
    get translations(): any {
        return this.isolate ? this._translations : this.store.translations;
    }

    set translations(translations: any) {
        if(this.isolate) {
            this._currentLang = translations;
        } else {
            this.store.translations = translations;
        }
    }

    /**
     *
     * @param store an instance of the store (that is supposed to be unique)
     * @param currentLoader An instance of the loader currently used
     * @param parser An instance of the parser currently used
     * @param missingTranslationHandler A handler for missing translations.
     * @param isolate whether this service should use the store or not
     */
    constructor(public store: TranslateStore,
                public currentLoader: TranslateLoader,
                public parser: TranslateParser,
                public missingTranslationHandler: MissingTranslationHandler,
                @Inject(USE_STORE) private isolate: boolean = false) {
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
            this._translationRequests[lang] = this._translationRequests[lang] || this.getTranslation(lang);
            pending = this._translationRequests[lang];
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
        let res: string | Observable<string>;

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

        if(typeof res === "undefined") {
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
    public get(key: string | Array<string>, interpolateParams?: Object): Observable<string | any> {
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
    public instant(key: string | Array<string>, interpolateParams?: Object): string | any {
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
        this._translationRequests[lang] = undefined;
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
