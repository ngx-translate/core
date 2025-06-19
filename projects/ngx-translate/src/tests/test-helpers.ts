import {Injectable} from "@angular/core";
import {TranslateLoader} from "../public-api";
import {Observable, of, timer} from "rxjs";
import {TranslationObject} from "../public-api";
import {map} from "rxjs/operators";


@Injectable()
export class DelayedFakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {

        const translations: TranslationObject = {
            "en": {"TEST": "This is a test"},
            "fr": {"TEST": "C'est un test"},
        };

        return timer(9).pipe(map(() => translations[lang]));
    }
}


@Injectable()
export class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {

        const translations: TranslationObject = {
            "en": {"TEST": "This is a test"},
            "fr": {"TEST": "C'est un test"},
        };

        return of(translations[lang]);
    }
}

