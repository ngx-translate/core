import {Injectable, EventEmitter} from 'angular2/angular2';
import {Http, Response, Headers, Request} from 'angular2/http';
// doc: https://github.com/ReactiveX/RxJS/blob/master/doc/operator-creation.md
import {Observable} from '@reactivex/rxjs/dist/cjs/Rx';
import {Parser} from "./translate.parser";

interface TranslateLoader {
    getTranslation(lang: string): Observable<any>;
}

@Injectable()
class TranslateStaticLoader implements TranslateLoader {
    private http: Http;
    private sfLoaderParams = {prefix: 'i18n/', suffix: '.json'};

    constructor(http: Http) {
        this.http = http;
    }

    /**
     * Defines the prefix & suffix used for getTranslation
     * @param prefix
     * @param suffix
     */
    public configure(prefix: string, suffix: string) {
        this.sfLoaderParams.prefix = prefix;
        this.sfLoaderParams.suffix = suffix;
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
    private pending: any;
    private translations: any = {};
    private defaultLang: string = 'en';
    private parser: Parser = new Parser();

    /**
     * The lang currently used
     */
    public currentLang: string;

    /**
     * An instance of the loader currently used
     */
    public currentLoader: any;

    /**
     * An EventEmitter to listen to lang changes events
     * onLangChange.observer({
     *   next: (params: {lang: string, translations: any}) => {
     *     // do something
     *   }
     * });
     * @type {ng.EventEmitter}
     */
    public onLangChange: EventEmitter = new EventEmitter();

    constructor(private http: Http) {
        this.useStaticFilesLoader();
    }

    /**
     * Use a static files loader
     */
    public useStaticFilesLoader() {
        this.currentLoader = new TranslateStaticLoader(this.http);
    }

    /**
     * Sets the default language to use ('en' by default)
     * @param lang
     */
    public setDefaultLang(lang: string) {
        this.defaultLang = lang;
    }

    private changeLang(lang: string) {
        this.currentLang = lang;
        this.onLangChange.next({lang: lang, translations: this.translations[lang]});
    }

    /**
     * Changes the lang currently used
     * @param lang
     * @returns {Observable<*>}
     */
    public use(lang: string): Observable<any> {
        // check if this language is available
        if(typeof this.translations[lang] === "undefined") {
            // not available, ask for it
            this.pending = this.getTranslation(lang);

            this.pending.subscribe((res: any) => {
                this.changeLang(lang);
            });

            return this.pending;
        } else { // we have this language, return an observable
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
        var observable = this.currentLoader.getTranslation(lang);

        observable.subscribe((res: Object) => {
            this.translations[lang] = res;
            this.pending = undefined;
        });

        return observable;
    }

    /**
     * Manually sets an object of translations for a given language
     * @param lang
     * @param translations
     */
    public setTranslation(lang: string, translations: Object) {
        this.translations[lang] = translations;
    }

    /**
     * Returns an array of currently available langs
     * @returns {any}
     */
    public getLangs() {
        return Object.keys(this.translations);
    }

    /**
     * Gets the translated value of a key
     * @param key
     * @param interpolateParams
     * @returns {any}
     */
    public get(key: string, interpolateParams?: Object): Observable<string> {
        // check if we are loading a new translation to use
        if(this.pending) {
            return this.pending.map((res: any) => this.parser.interpolate(res[key], interpolateParams) || key);
        } else {
            return Observable.of(this.parser.interpolate(this.translations[this.currentLang][key], interpolateParams) || key);
        }
    }

    /**
     * Sets the translated value of a key
     * @param key
     * @param value
     * @param lang
     */
    public set(key: string, value: string, lang: string = this.currentLang) {
        this.translations[lang][key] = value;
    }
}
