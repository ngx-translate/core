import {Injectable, EventEmitter, Optional} from 'angular2/core';
import {Http, Response} from 'angular2/http';
import {Observable} from 'rxjs/Observable'
import 'rxjs/add/observable/fromArray';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';

import {Parser} from './translate.parser';

export abstract class MissingTranslationHandler {
    abstract handle(key: string): void;
}

@Injectable()
export abstract class TranslateLoader {
    abstract getTranslation(lang: string): Observable<any>;
}

@Injectable()
export class TranslateStaticLoader implements TranslateLoader {
    private http: Http;
    private sfLoaderParams = {prefix: 'i18n', suffix: '.json'};

    constructor(http: Http, @Optional() prefix: string, @Optional() suffix: string) {
        this.http = http;
        this.configure(prefix, suffix);
    }

    /**
     * Defines the prefix & suffix used for getTranslation
     * @param prefix
     * @param suffix
     */
    public configure(prefix: string, suffix: string) {
        this.sfLoaderParams.prefix = prefix ? prefix : this.sfLoaderParams.prefix;
        this.sfLoaderParams.suffix = suffix ? suffix : this.sfLoaderParams.suffix;
    }

    /**
     * Gets the translations from the server
     * @param lang
     * @returns {any}
     */
    public getTranslation(lang: string): Observable<any> {
        return this.http.get(`${this.sfLoaderParams.prefix}/${lang}${this.sfLoaderParams.suffix}`)
            .map((res: Response) => res.json());
    }
}

@Injectable()
export class TranslateService {
    /**
     * The lang currently used
     */
    public currentLang: string = this.defaultLang;

    /**
     * An instance of the loader currently used
     */
    public currentLoader: TranslateLoader;

    /**
     * An EventEmitter to listen to lang changes events
     * onLangChange.subscribe((params: {lang: string, translations: any}) => {
     *     // do something
     * });
     * @type {ng.EventEmitter}
     */
    public onLangChange: EventEmitter<any> = new EventEmitter();

    private pending: any;
    private translations: any = {};
    private defaultLang: string;
    private langs: Array<string>;
    private parser: Parser = new Parser();

    /**
     * Handler for missing translations
     */
    private missingTranslationHandler: MissingTranslationHandler;

    constructor(private http: Http, @Optional() loader: TranslateLoader) {
        if(loader !== null) {
            this.currentLoader = loader;
        } else {
            this.useStaticFilesLoader();
        }
    }

    /**
     * Use a translations loader
     * @param loader
     */
    public useLoader(loader: TranslateLoader) {
        this.currentLoader = loader;
    }

    /**
     * Use a static files loader
     */
    public useStaticFilesLoader(prefix?: string, suffix?: string) {
        this.currentLoader = new TranslateStaticLoader(this.http, prefix, suffix);
    }

    /**
     * Sets the default language to use as a fallback
     * @param lang
     */
    public setDefaultLang(lang: string) {
        this.defaultLang = lang;
    }

    /**
     * Changes the lang currently used
     * @param lang
     * @returns {Observable<*>}
     */
    public use(lang: string): Observable<any> {
        var pending: Observable<any>;
        // check if this language is available
        if(typeof this.translations[lang] === 'undefined') {
            // not available, ask for it
            pending = this.getTranslation(lang);
        }

        if(typeof pending !== 'undefined') {
            pending.subscribe((res: any) => {
                this.changeLang(lang);
            });

            return pending;
        } else { // we have this language, return an Observable
            this.changeLang(lang);

            return Observable.of(this.translations[lang]);
        }
    }

    /**
     * Gets an object of translations for a given language with the current loader
     * @param lang
     * @returns {Observable<*>}
     */
    public getTranslation(lang: string): Observable<any> {
        this.pending = this.currentLoader.getTranslation(lang).share();
        this.pending.subscribe((res: Object) => {
            this.translations[lang] = res;
            this.updateLangs();
        }, (err: any) => {
            throw err;
        }, () => {
            this.pending = undefined;
        });

        return this.pending;
    }

    /**
     * Manually sets an object of translations for a given language
     * @param lang
     * @param translations
     */
    public setTranslation(lang: string, translations: Object) {
        this.translations[lang] = translations;
        this.updateLangs();
    }

    /**
     * Returns an array of currently available langs
     * @returns {any}
     */
    public getLangs() {
        return this.langs;
    }

    /**
     * Update the list of available langs
     */
    private updateLangs() {
        this.langs = Object.keys(this.translations);
    }

    /**
     * Returns the parsed result of the translations
     * @param translations
     * @param key
     * @param interpolateParams
     * @returns {any}
     */
    private getParsedResult(translations: any, key: any, interpolateParams?: Object): string {
        var res: string;

        if(key instanceof Array) {
            let result: any = {};
            for (var k of key) {
                result[k] = this.getParsedResult(translations, k, interpolateParams);
            }
            return result;
        }

        if(translations) {
            res = this.parser.interpolate(translations[key], interpolateParams);
        }

        if(typeof res === 'undefined' && this.defaultLang && this.defaultLang !== this.currentLang) {
            let translations: any = this.parser.flattenObject(this.translations[this.defaultLang]);
            res = this.parser.interpolate(translations[key], interpolateParams);
        }

        if(!res && this.missingTranslationHandler) {
            this.missingTranslationHandler.handle(key);
        }

        return res || key;
    }

    /**
     * Gets the translated value of a key (or an array of keys)
     * @param key
     * @param interpolateParams
     * @returns {any} the translated key, or an object of translated keys
     */
    public get(key: string|Array<string>, interpolateParams?: Object): Observable<string|any> {
        if(!key) {
            throw new Error('Parameter "key" required');
        }

        // check if we are loading a new translation to use
        if(this.pending) {
            return this.pending.map((res: any) => {
                return this.getParsedResult(this.parser.flattenObject(res), key, interpolateParams);
            });
        } else {
            let translations: any;

            if(this.translations[this.currentLang]) {
                translations = this.parser.flattenObject(this.translations[this.currentLang]);
            }

            return Observable.of(this.getParsedResult(translations, key, interpolateParams));
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
        if(!key) {
            throw new Error('Parameter "key" required');
        }

        // check if we are loading a new translation to use
        let translations: any;

        if(this.translations[this.currentLang]) {
            translations = this.parser.flattenObject(this.translations[this.currentLang]);
        }

        return this.getParsedResult(translations, key, interpolateParams);
    }

    /**
     * Sets the translated value of a key
     * @param key
     * @param value
     * @param lang
     */
    public set(key: string, value: string, lang: string = this.currentLang) {
        this.translations[lang][key] = value;
        this.updateLangs();
    }

    private changeLang(lang: string) {
        this.currentLang = lang;
        this.onLangChange.emit({lang: lang, translations: this.translations[lang]});
    }

    public setMissingTranslationHandler(handler: MissingTranslationHandler) {
        this.missingTranslationHandler = handler;
    }

}
