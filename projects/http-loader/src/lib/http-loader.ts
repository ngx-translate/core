import {HttpClient} from "@angular/common/http";
import {TranslateLoader, TranslationObject} from "@ngx-translate/core";
import {Observable} from 'rxjs';

export class TranslateHttpLoader implements TranslateLoader {
  constructor(private http: HttpClient, public prefix = "/assets/i18n/", public suffix = ".json") {}

  /**
   * Gets the translations from the server
   */
  public getTranslation(lang: string): Observable<TranslationObject> {
    return this.http.get(`${this.prefix}${lang}${this.suffix}`) as Observable<TranslationObject>;
  }
}
