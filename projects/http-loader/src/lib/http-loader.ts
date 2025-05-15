import { HttpBackend, HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { Observable } from 'rxjs';

@Injectable()
export class TranslateHttpLoader implements TranslateLoader {
  constructor(
    private _handler: HttpBackend,
    @Inject(String) public prefix = "/assets/i18n/",
    @Inject(String) public suffix = ".json"
  )
  {}

  /**
   * Gets the translations from the server
   */
  public getTranslation(lang: string): Observable<TranslationObject> {
    return new HttpClient(this._handler).get(`${this.prefix}${lang}${this.suffix}`) as Observable<TranslationObject>;
  }
}
