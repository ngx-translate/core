import { Injectable } from "@angular/core";
import { Observable, of, timer } from "rxjs";
import { map } from "rxjs/operators";
import { TranslateLoader, TranslationObject } from "../public-api";

@Injectable()
export class DelayedFakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        const translations: Record<string, TranslationObject> = {
            en: { TEST: "This is a test" },
            fr: { TEST: "C'est un test" },
        };

        return timer(9).pipe(map(() => translations[lang]));
    }
}

@Injectable()
export class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        const translations: Record<string, TranslationObject> = {
            en: { TEST: "This is a test" },
            fr: { TEST: "C'est un test" },
        };

        return of(translations[lang]);
    }
}
