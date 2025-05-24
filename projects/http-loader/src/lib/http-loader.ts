import {TranslateLoader, TranslationObject} from "@ngx-translate/core";
import {HttpBackend, HttpClient} from "@angular/common/http";
import {Inject, Injectable} from "@angular/core";
import {Observable} from 'rxjs';

@Injectable()
export class TranslateHttpLoader implements TranslateLoader {

  static readonly defaultPrefix = "/assets/i18n/";
  static readonly defaultSuffix = ".json";

  constructor(
    private http: HttpClient,
    @Inject(String) public prefix = TranslateHttpLoader.defaultPrefix,
    @Inject(String) public suffix = TranslateHttpLoader.defaultSuffix
  )
  {}

  public static withHttpBackend(
    backend: HttpBackend,
    prefix: string = TranslateHttpLoader.defaultPrefix,
    suffix: string = TranslateHttpLoader.defaultSuffix
  ): TranslateHttpLoader
  {
    return new TranslateHttpLoader(new HttpClient(backend), prefix, suffix);
  }

  /**
   * Gets the translations from the server
   */
  public getTranslation(lang: string): Observable<TranslationObject> {
    return this.http.get(`${this.prefix}${lang}${this.suffix}`) as Observable<TranslationObject>;
  }
}
