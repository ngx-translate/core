import {Injectable, EventEmitter} from 'angular2/angular2';
import {Http, Response, Headers, Request} from 'angular2/http';
// doc: https://github.com/ReactiveX/RxJS/blob/master/doc/operator-creation.md
import {Observable} from '@reactivex/rxjs/dist/cjs/Rx';

interface SFLoaderParams {
    prefix: string;
    suffix: string;
}

interface TranslateLoader {
    getTranslation(lang: string): Observable<any>;
}

@Injectable()
class TranslateStaticLoader implements TranslateLoader {
    private http: Http;
    private sfLoaderParams: SFLoaderParams = {prefix: 'i18n/', suffix: '.json'};

    constructor(http: Http) {
        this.http = http;
    }

    public useStaticFilesLoader(prefix: string, suffix: string) {
        this.sfLoaderParams.prefix = prefix;
        this.sfLoaderParams.suffix = suffix;
    }

    public getTranslation(lang: string): Observable<any> {
        return this.http.get(`${this.sfLoaderParams.prefix}/${lang}${this.sfLoaderParams.suffix}`)
            .map((res: Response) => res.json());
    }
}

@Injectable()
export class TranslateParser {
    templateMatcher: RegExp = /{{([^{}]*)}}/g;

    /**
     * Flattens an object
     * { key1: { keyA: 'valueI' }} ==> { 'key1.keyA': 'valueI' }
     * @param target
     * @returns {any}
     */
    private flattenObject(target: Object): Object {
        var delimiter = '.';
        var maxDepth: number;
        var currentDepth = 1;
        var output: any = {};

        function step(object: any, prev?: string) {
            Object.keys(object).forEach(function (key) {
                var value = object[key];
                var isarray = Array.isArray(value);
                var type = Object.prototype.toString.call(value);
                var isobject = (
                    type === "[object Object]" ||
                    type === "[object Array]"
                );

                var newKey = prev
                    ? prev + delimiter + key
                    : key;

                maxDepth = currentDepth + 1;

                if(!isarray && isobject && Object.keys(value).length && currentDepth < maxDepth) {
                    ++currentDepth;
                    return step(value, newKey)
                }

                output[newKey] = value
            })
        }

        step(target);

        return output;
    }

    /**
     * Interpolates a string to replace parameters
     * "This is a {{ param }}" ==> "This is a value"
     * @param expr
     * @param params
     * @returns {string}
     */
    interpolate(expr: string, params?: any): string {
        if(!params) {
            return expr;
        } else {
            params = this.flattenObject(params);
        }

        return expr.replace(this.templateMatcher, function (substring: string, b: string): string {
            var r = params[b];
            return typeof r !== 'undefined' ? r : substring;
        });
    }
}

@Injectable()
export class TranslateService {
    private pending: any;
    private staticLoader: any;
    private translations: any = {};
    private defaultLang: string = 'en';
    private parser: TranslateParser;
    public currentLang: string;
    public currentLoader: any;
    public onLangChange: EventEmitter = new EventEmitter();

    constructor(http: Http) {
        this.staticLoader = new TranslateStaticLoader(http);
        this.currentLoader = this.staticLoader;
        this.parser = new TranslateParser();
    }

    setDefault(lang: string) {
        this.defaultLang = lang;
    }

    private changeLang(lang: string) {
        this.currentLang = lang;
        this.onLangChange.next(this.translations[lang]);
    }

    use(lang: string): Observable<any> {
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

    getTranslation(lang: string): Observable<any> {
        var observable = this.currentLoader.getTranslation(lang);

        observable.subscribe((res: Object) => {
            this.translations[lang] = res;
            this.pending = undefined;
        });

        return observable;
    }

    setTranslation(lang: string, translation: Object) {
        this.translations[lang] = translation;
    }

    getLangs() {
        return Object.keys(this.translations);
    }

    get(key: string, interpolateParams?: Object): Observable<string> {
        // check if we are loading a new translation to use
        if(this.pending) {
            return this.pending.map((res: any) => this.parser.interpolate(res[key], interpolateParams) || key);
        } else {
            return Observable.of(this.parser.interpolate(this.translations[this.currentLang][key], interpolateParams) || key);
        }
    }

    set(key: string, value: string, lang: string = this.currentLang) {
        this.translations[lang][key] = value;
    }
}
