import {Inject} from 'angular2/angular2';
import {Http, Response, Headers} from 'angular2/http';

export class TranslateService {
    http: Http;
    language: string;
    translations: any = {};
    pending: Promise<Object>;

    constructor(@Inject(Http) http: Http) {
        this.http = http;
        var userLang = navigator.language.split('-')[0]; // use navigator lang if available
        this.language = /(fr|en)/gi.test(userLang) ? userLang : 'en';
        this.getTranslations(this.language);
    }

    getTranslations(language: string): Promise<Object> {
        this.pending = this.http.get(`i18n/${language}.json`)
            .map((res: Response) => res.json()).toPromise().then((res: Object) => {
                this.translations = res;
                this.pending = undefined;
                return res;
            });
        return this.pending;
    }

    get(key: string): Promise<string> {
        if (this.pending) {
            return this.pending.then((res: any) => {
                return res[key] || '';
            });
        } else {
            return Promise.resolve(this.translations[key] || key);
        }
    }
}
