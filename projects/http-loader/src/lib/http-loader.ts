import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { Observable } from "rxjs";

@Injectable()
export class TranslateHttpLoader implements TranslateLoader {
    constructor(
        // eslint-disable-next-line @angular-eslint/prefer-inject
        private http: HttpClient,
        // eslint-disable-next-line @angular-eslint/prefer-inject
        @Inject(String) public prefix = "/assets/i18n/",
        // eslint-disable-next-line @angular-eslint/prefer-inject
        @Inject(String) public suffix = ".json",
    ) {}

    /**
     * Gets the translations from the server
     */
    public getTranslation(lang: string): Observable<TranslationObject> {
        return this.http.get(
            `${this.prefix}${lang}${this.suffix}`,
        ) as Observable<TranslationObject>;
    }
}
