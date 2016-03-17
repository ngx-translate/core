import {Injectable, EventEmitter, Optional} from 'angular2/core';
import {Http, Response} from 'angular2/http';
import {Observable} from 'rxjs/Observable'
import {Observer} from "rxjs/Observer";
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/toArray';

import {Parser} from './translate.parser';

export interface LangChangeEvent {
    lang: string;
    translations: any;
}

export abstract class MissingTranslationHandler {
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
     * @param missingTranslationHandler A handler for missing translations.
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
    private getParsedResult(translations: any, key: any, interpolateParams?: Object): any {
        var res: string|Observable<string>;

        if(key instanceof Array) {
            let result: any = {},
                observables: boolean = false;
            for (let k of key) {
                result[k] = this.getParsedResult(translations, k, interpolateParams);
                if(typeof result[k].subscribe === 'function') {
                    observables = true;
                }
            }
            if(observables) {
                var mergedObs: any;
                for (let k of key) {
                    let obs = typeof result[k].subscribe === 'function' ? result[k] : Observable.of(result[k]);
                    if(typeof mergedObs === 'undefined') {
                        mergedObs = obs;
                    } else {
                        mergedObs = mergedObs.merge(obs);
                    }
                }
                return mergedObs.toArray().map((arr: Array<string>) => {
                    var obj: any = {};
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

        if(typeof res === 'undefined' && this.defaultLang && this.defaultLang !== this.currentLang) {
            res = this.parser.interpolate(this.parser.getValue(this.translations[this.defaultLang], key), interpolateParams);
        }

        if(!res && this.missingTranslationHandler) {
            res = this.missingTranslationHandler.handle(key);
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
            return Observable.create((observer: Observer<string>) => {
                var onComplete = (res: string) => {
                    observer.next(res);
                    observer.complete();
                };
                this.pending.subscribe((res: any) => {
                    var res = this.getParsedResult(res, key, interpolateParams);
                    if(typeof res.subscribe === 'function') {
                        res.subscribe(onComplete);
                    } else {
                        onComplete(res);
                    }
                });
            });
        } else {
            var res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
            if(typeof res.subscribe === 'function') {
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
        if(!key) {
            throw new Error('Parameter "key" required');
        }

        var res = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);
        if(typeof res.subscribe !== 'undefined') {
            if(key instanceof Array) {
                var obj: any = {};
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
    }

    /**
     * Changes the current lang
     * @param lang
     */
    private changeLang(lang: string): void {
        this.currentLang = lang;
        this.onLangChange.emit({lang: lang, translations: this.translations[lang]});
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
}
