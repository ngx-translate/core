import {Injectable, EventEmitter, Optional} from "@angular/core";
import {Http, Response} from "@angular/http";
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

export class TranslateStaticLoader implements TranslateLoader {
    constructor(private http: Http, private prefix: string = "i18n", private suffix: string = ".json") {
    }

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

    private defaultLang: string;
    public modules: any = {};
    public currentLoader: TranslateLoader;
    private currentModule: ModuleLoader;

    /**
     *
     * @param currentLoader An instance of the loader currently used
     * @param parser An instance of the parser currently used
     * @param missingTranslationHandler A handler for missing translations.
     */
    constructor(
        public parser: TranslateParser,
        @Optional() private missingTranslationHandler: MissingTranslationHandler
    ) {}

    public addModule(module: ModuleLoader): void {
        this.setCurrentModule(module);
        if (!this.modules[module.id]) {
            this.modules[module.id] = module;
        }
        if (this.currentLang) {
          module.getTranslation(this.currentLang);
        }
    }

    private setCurrentModule(currentModule: ModuleLoader): void {
        this.currentModule = currentModule;
        this.currentLoader = currentModule.loader;
    }

    private getCurrentModule(): ModuleLoader {
        return this.currentModule;
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
        // retrieve translations on all other modules
        let self = this;
        Object.keys(this.modules).forEach(function(moduleId) {
          let module = self.modules[moduleId];
          if (module !== self.getCurrentModule()) {
            module.getTranslation(lang);
          }
        });

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
            return Observable.of(this.getCurrentModule().translations[lang]);
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
        if(typeof this.getCurrentModule().translations[lang] === "undefined") {
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
        return this.getCurrentModule().getTranslation(lang);
    }

    /**
     * Manually sets an object of translations for a given language
     * @param lang
     * @param translations
     * @param shouldMerge
     */
    public setTranslation(lang: string, translations: Object, shouldMerge: boolean = false): void {
        let module = this.getCurrentModule();
        module.setTranslation(lang, translations, shouldMerge);
        this.onTranslationChange.emit({lang: lang, translations: module.translations[lang]});
    }

    /**
     * Returns an array of currently available langs
     * @returns {any}
     */
    public getLangs(): Array<string> {
        return this.getCurrentModule().getLangs();
    }

    /**
     * @param langs
     * Add available langs
     */
    public addLangs(langs: Array<string>): void {
        return this.getCurrentModule().addLangs(langs);
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
        let module = this.getCurrentModule();

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
            res = this.parser.interpolate(this.parser.getValue(module.translations[this.defaultLang], key), interpolateParams);
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
    public get(key: string|Array<string>, interpolateParams?: Object, moduleId: string = 'root'): Observable<string|any> {
        if(!isDefined(key) || !key.length) {
            throw new Error(`Parameter "key" required`);
        }
        let module = this.modules[moduleId];

        // check if we are loading a new translation to use
        if(module.pending) {
            return Observable.create((observer: Observer<string>) => {
                let onComplete = (res: string) => {
                    observer.next(res);
                    observer.complete();
                };
                let onError = (err: any) => {
                    observer.error(err);
                };
                module.pending.subscribe((res: any) => {
                    res = this.getParsedResult(res, key, interpolateParams);
                    if(typeof res.subscribe === "function") {
                        res.subscribe(onComplete, onError);
                    } else {
                        onComplete(res);
                    }
                }, onError);
            });
        } else {
            let res = this.getParsedResult(module.translations[this.currentLang], key, interpolateParams);
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

        let res = this.getParsedResult(this.getCurrentModule().translations[this.currentLang], key, interpolateParams);
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
        let module = this.getCurrentModule();
        module.set(key, value, lang);
        this.onTranslationChange.emit({lang: lang, translations:  module.translations[lang]});
    }

    /**
     * Changes the current lang
     * @param lang
     */
    private changeLang(lang: string): void {
        this.currentLang = lang;
        let module = this.getCurrentModule();
        this.onLangChange.emit({lang: lang, translations: module.translations[lang]});

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
        let module = this.getCurrentModule();
        this.onDefaultLangChange.emit({lang: lang, translations: module.translations[lang]});
    }

    /**
     * Allows to reload the lang file from the file
     * @param lang
     * @returns {Observable<any>}
     */
    public reloadLang(lang: string): Observable<any> {
        this.resetLang(lang);
        let self = this;
        let obs: Observable<any>;
        Object.keys(this.modules).forEach(function(moduleId) {
            let module = self.modules[moduleId];
            let translation = module.getTranslation(lang);
            if (typeof obs !== 'undefined') {
              obs.merge(translation);
            } else {
              obs = translation;
            }
        });
        return obs;
    }

    /**
     * Deletes inner translation
     * @param lang
     */
    public resetLang(lang: string): void {
        let self = this;
        Object.keys(this.modules).forEach(function(moduleId) {
            self.modules[moduleId].translations[lang] = undefined;
        });
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

export class ModuleIdentifier {
    public id: string = '';
}

@Injectable()
export class ModuleLoader {
    public id: string;
    public translations: any = {};
    private langs: Array<string> = [];
    public pending: Observable<any>;
    private onTranslationChange: EventEmitter<TranslationChangeEvent> = new EventEmitter<TranslationChangeEvent>();

    constructor(identifier: ModuleIdentifier, public translateService: TranslateService, public loader: TranslateLoader) {
        this.id = identifier.id;
    }
    public init(): void {
        this.translateService.addModule(this);
    }
    /**
     * Gets an object of translations for a given language with the current loader
     * @param lang
     * @returns {Observable<*>}
     */
    public getTranslation(lang: string): Observable<any> {
        this.pending = Observable.create((observer: Observer<string>) => {
            this.onTranslationChange.subscribe((event: LangChangeEvent) => {
                if (event.lang === lang) {
                    observer.next(event.translations);
                    observer.complete();
                }
            });

        }).merge(this.loader.getTranslation(lang).share());
        this.pending.take(1)
            .subscribe((res: Object) => {
                if (this.pending) {
                  this.translations[lang] = res;
                  this.pending = undefined;
                  this.updateLangs();
                }
            }, (err: any) => {
                this.pending = undefined;
            });

        return this.pending;
    }

    /**
     * Update the list of available langs
     */
    private updateLangs(): void {
        this.addLangs(Object.keys(this.translations));
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
     * Returns an array of currently available langs
     * @returns {any}
     */
    public getLangs(): Array<string> {
        return this.langs;
    }

    /**
     * Sets the translated value of a key
     * @param key
     * @param value
     * @param lang
     */
    public set(key: string, value: string, lang: string = this.translateService.currentLang): void {
        this.translations[lang][key] = value;
        this.updateLangs();
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
        this.onTranslationChange.emit({lang: lang, translations: this.translations[lang]});
        this.updateLangs();
    }
}

export class ModulePending {

}
