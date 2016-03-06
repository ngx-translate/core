import {Injectable, EventEmitter, Optional} from 'angular2/core';
import {Http, Response} from 'angular2/http';
import {Observable} from 'rxjs/Observable'
import 'rxjs/add/observable/fromArray';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';

import {Parser} from './translate.parser';

export interface LangChangeEvent {
    lang: string;
    translations: any;
}

export abstract class MissingTranslationHandler {
    abstract handle(key: string): void;
}

export abstract class TranslateLoader {
    abstract getTranslation(lang: string): Observable<any>;
}

export class TranslateStaticLoader implements TranslateLoader {
    constructor(private http: Http, private prefix: string = 'i18n', private suffix: string = '.json') {}

    /**
     * Gets the translations from the server
     * @param lang
     * @returns {any}
     */
    public getTranslation(lang: string): Observable<any> {
        return this.http.get(`${this.prefix}/${lang}${this.suffix}`)
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
     * An EventEmitter to listen to lang changes events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     * @type {ng.EventEmitter<LangChangeEvent>}
     */
    public onLangChange: EventEmitter<LangChangeEvent> = new EventEmitter<LangChangeEvent>();

    private pending: any;
    private translations: any = {};
    private defaultLang: string;
    private langs: Array<string>;
    private parser: Parser = new Parser();

    /**
     *
     * @param http The Angular 2 http provider
     * @param currentLoader An instance of the loader currently used
     * @param missingTranslationHandler A handler for missing translations
     */
    constructor(private http: Http, public currentLoader: TranslateLoader, @Optional() private missingTranslationHandler: MissingTranslationHandler) {}

    /**
     * Sets the default language to use as a fallback
     * @param lang
     */
    public setDefaultLang(lang: string): void {
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
    public setTranslation(lang: string, translations: Object): void {
        this.translations[lang] = translations;
        this.updateLangs();
    }

    /**
     * Returns an array of currently available langs
     * @returns {any}
     */
    public getLangs(): Array<string> {
        return this.langs;
    }

    /**
     * Update the list of available langs
     */
    private updateLangs(): void {
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
            res = this.parser.interpolate(this.parser.getValue(translations, key), interpolateParams);
        }

        if(typeof res === 'undefined' && this.defaultLang && this.defaultLang !== this.currentLang) {
            res = this.parser.interpolate(this.parser.getValue(this.translations[this.defaultLang], key), interpolateParams);
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
                return this.getParsedResult(res, key, interpolateParams);
            });
        } else {
            return Observable.of(this.getParsedResult(this.translations[this.currentLang], key, interpolateParams));
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

        return this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
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
    }

    /**
     * Changes the current lang
     * @param lang
     */
    private changeLang(lang: string): void {
        this.currentLang = lang;
        this.onLangChange.emit({lang: lang, translations: this.translations[lang]});
    }

}
