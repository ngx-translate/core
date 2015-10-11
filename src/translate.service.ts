import {Inject} from 'angular2/angular2';
import {Http, Response, Headers} from 'angular2/http';

interface SFLoaderParams {
    prefix: string;
    suffix: string;
}

export class TranslateService {
    private http: Http;
    private pending: Promise<Object>;
    currentLanguage: string;
    defaultLanguage: string = 'en';
    translations: any = {};
    method: string = 'static';
    sfLoaderParams: SFLoaderParams = {prefix: 'i18n/', suffix: '.json'};

    constructor(@Inject(Http) http: Http) {
        this.http = http;
    }

    setDefault(language: string) {
        this.defaultLanguage = language;
    }

    //todo use RxJS
    use(language: string): Promise<any> {
        if(typeof this.translations[language] === "undefined") {
            return this.getTranslations(language).then(() => {
                return this.currentLanguage = language;
            });
        } else {
            return Promise.resolve(this.currentLanguage = language);
        }
    }

    useStaticFilesLoader(prefix: string, suffix: string) {
        this.sfLoaderParams.prefix = prefix;
        this.sfLoaderParams.suffix = suffix;
    }

    getTranslations(language: string): Promise<Object> {
        if(this.method === 'static') {
            this.pending = this.http.get(`${this.sfLoaderParams.prefix}/${language}${this.sfLoaderParams.suffix}`)
                .map((res: Response) => res.json()).toPromise().then((res: Object) => {
                    this.translations[language] = res;
                    this.pending = undefined;
                    return res;
                });
        }
        return this.pending;
    }

    //todo use RxJS
    get(key: string): Promise<string> {
        if (this.pending) {
            return this.pending.then((res: any) => {
                return res[key] || '';
            });
        } else {
            return Promise.resolve(this.translations[this.currentLanguage][key] || key);
        }
    }
}
