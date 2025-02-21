import {Inject, Injectable, InjectionToken} from "@angular/core";
import {concat, forkJoin, isObservable, Observable, of, defer} from "rxjs";
import {concatMap, map, shareReplay, switchMap, take} from "rxjs/operators";
import {MissingTranslationHandler, MissingTranslationHandlerParams} from "./missing-translation-handler";
import {TranslateCompiler} from "./translate.compiler";
import {TranslateLoader} from "./translate.loader";
import {InterpolateFunction, TranslateParser} from "./translate.parser";
import {TranslateStore} from "./translate.store";
import {getValue, isDefined, isArray, isString, setValue, isDict, insertValue} from "./util";

export const ISOLATE_TRANSLATE_SERVICE = new InjectionToken<string>('ISOLATE_TRANSLATE_SERVICE');
export const USE_DEFAULT_LANG = new InjectionToken<string>('USE_DEFAULT_LANG');
export const DEFAULT_LANGUAGE = new InjectionToken<string>('DEFAULT_LANGUAGE');
export const USE_EXTEND = new InjectionToken<string>('USE_EXTEND');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InterpolationParameters = Record<string, any>;

export type Translation =
  string |
  Translation[] |
  TranslationObject |

  // required to prevent error "Type instantiation is excessively deep and possibly infinite."
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
  ;


// using Record<> does not work because TS does not support recursive definitions
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface TranslationObject {
  [key: string]: Translation
}


export type InterpolatableTranslation =
  string |
  InterpolatableTranslation[] |
  InterpolateFunction |
  InterpolatableTranslationObject |

  // required to prevent error "Type instantiation is excessively deep and possibly infinite."
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
  ;


// using Record<> does not work because TS does not support recursive definitions
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface InterpolatableTranslationObject {
  [key: string]: InterpolatableTranslation
}


export type Language = string;

export interface TranslationChangeEvent {
  translations: InterpolatableTranslationObject;
  lang: string;
}

export interface LangChangeEvent {
  lang: string;
  translations: InterpolatableTranslationObject;
}

export interface DefaultLangChangeEvent {
  lang: string;
  translations: InterpolatableTranslationObject;
}

declare interface Window {
  navigator: {
    languages?: string[],
    language?: string,
    browserLanguage?: string,
    userLanguage?: string,
  };
}

declare const window: Window;

const makeObservable = <T>(value: T | Observable<T>): Observable<T> => {
  return isObservable(value) ? value : of(value);
};

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private loadingTranslations!: Observable<InterpolatableTranslationObject>;
  private pending = false;
  private _translationRequests: Record<Language, Observable<TranslationObject>> = {};
  private lastUseLanguage: Language|null = null;


  /**
   * An Observable to listen to translation change events
   * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
   */
  get onTranslationChange(): Observable<TranslationChangeEvent> {
    return this.store.onTranslationChange;
  }

  /**
   * An Observable to listen to lang change events
   * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
   */
  get onLangChange(): Observable<LangChangeEvent> {
    return this.store.onLangChange;
  }

  /**
   * An Observable to listen to default lang change events
   * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
   */
  get onDefaultLangChange(): Observable<DefaultLangChangeEvent> {
    return this.store.onDefaultLangChange;
  }

  /**
   * The default lang to fallback when translations are missing on the current lang
   */
  get defaultLang(): Language {
    return this.store.getDefaultLanguage();
  }

  /**
   * The lang currently used
   */
  get currentLang(): Language {
    return this.store.getCurrentLanguage();
  }

  /**
   * an array of langs
   */
  get langs(): readonly Language[] {
    return this.store.getLanguages();
  }

  /**
   *
   * @param store an instance of the store (that is supposed to be unique)
   * @param currentLoader An instance of the loader currently used
   * @param compiler An instance of the compiler currently used
   * @param parser An instance of the parser currently used
   * @param missingTranslationHandler A handler for missing translations.
   * @param useDefaultLang whether we should use default language translation when current language translation is missing.
   * @param isolate whether this service should use the store or not
   * @param extend To make a child module extend (and use) translations from parent modules.
   * @param defaultLanguage Set the default language using configuration
   */
  constructor(public store: TranslateStore,
              public currentLoader: TranslateLoader,
              public compiler: TranslateCompiler,
              public parser: TranslateParser,
              public missingTranslationHandler: MissingTranslationHandler,
              @Inject(USE_DEFAULT_LANG) private useDefaultLang = true,
              @Inject(ISOLATE_TRANSLATE_SERVICE) isolate = false,
              @Inject(USE_EXTEND) private extend = false,
              @Inject(DEFAULT_LANGUAGE) defaultLanguage: string
  )
  {
    if(isolate)
    {
      this.store = new TranslateStore();
    }

    if (defaultLanguage) {
      this.setDefaultLang(defaultLanguage);
    }
  }

  /**
   * Sets the default language to use as a fallback
   */
  public setDefaultLang(lang: string): void {
    if (lang === this.defaultLang) {
      return;
    }

    const pending = this.retrieveTranslations(lang);

    if (typeof pending !== "undefined") {

      if (this.defaultLang == null) {
        // on init set the defaultLang immediately
        // but do not emit the change yet
        this.store.setDefaultLang(lang, false);
      }

      pending.pipe(take(1))
        .subscribe(() => {
          this.store.setDefaultLang(lang);
        });
    }
    else {
      // we already have this language
      this.store.setDefaultLang(lang);
    }
  }

  /**
   * Gets the default language used
   */
  public getDefaultLang(): string {
    return this.defaultLang;
  }

  /**
   * Changes the lang currently used
   */
  public use(lang: string): Observable<InterpolatableTranslationObject> {

    // remember the language that was called
    // we need this with multiple fast calls to use()
    // where translation loads might complete in random order
    this.lastUseLanguage = lang;

    // don't change the language if the language given is already selected
    if (lang === this.currentLang) {
      return of(this.store.getTranslations(lang));
    }

    // on init set the currentLang immediately
    if (!this.currentLang) {
      this.store.setCurrentLang(lang, false);
    }

    const pending = this.retrieveTranslations(lang);

    if (isObservable(pending)) {

      pending.pipe(take(1))
        .subscribe(() => {
          this.changeLang(lang);
        });

      return pending;
    }
    else {
      // we have this language, return an Observable
      this.changeLang(lang);
      return of(this.store.getTranslations(lang));
    }
  }


  /**
   * Changes the current lang
   */
  private changeLang(lang: string): void {

    if(lang !== this.lastUseLanguage)
    {
      // received new language data,
      // but this was not the one requested last
      return;
    }

    this.store.setCurrentLang(lang);

    if (this.defaultLang == null) {
      // if there is no default lang, use the one that we just set
      this.store.setDefaultLang(lang);
    }
  }


  /**
   * Retrieves the given translations
   */
  private retrieveTranslations(lang: string): Observable<TranslationObject> | undefined {

    // if this language is unavailable or extend is true, ask for it
    if (!this.store.hasTranslationFor(lang) || this.extend) {
      this._translationRequests[lang] = this._translationRequests[lang] || this.loadAndCompileTranslations(lang);
      return this._translationRequests[lang];
    }

    return undefined;
  }


  private loadAndCompileTranslations(lang: string): Observable<InterpolatableTranslationObject> {

    this.pending = true;

    const loadingTranslations = this.currentLoader.getTranslation(lang).pipe(
      shareReplay(1),
      take(1),
    );

    this.loadingTranslations = loadingTranslations.pipe(
      map((res:TranslationObject) => this.compiler.compileTranslations(res, lang)),
      shareReplay(1),
      take(1),
    );

    this.loadingTranslations
      .subscribe({
        next: (res: InterpolatableTranslationObject) => {
          this.store.setTranslations(lang, res, this.extend);
          this.pending = false;
        },
        error: (err) => {
          void err;
          this.pending = false;
        }
      });

    return loadingTranslations;
  }

  /**
   * Manually sets an object of translations for a given language
   * after passing it through the compiler
   */
  public setTranslation(lang: Language, translations: InterpolatableTranslationObject, shouldMerge = false): void {
    const interpolatableTranslations = this.compiler.compileTranslations(translations, lang);
    this.store.setTranslations(lang, interpolatableTranslations, (shouldMerge || this.extend));
  }


  public getLangs(): readonly Language[] {
    return this.store.getLanguages();
  }

  /**
   * Add available languages
   */
  public addLangs(languages: Language[]): void
  {
    this.store.addLanguages(languages);
  }


  private getParsedResultForKey(translations: InterpolatableTranslation, key: string, interpolateParams?: InterpolationParameters): Translation|Observable<Translation>
  {
      const textToInterpolate = this.getTextToInterpolate(translations, key);

      let res: Translation | undefined;

      if (textToInterpolate !== undefined)
      {
          res = this.runInterpolation(textToInterpolate, interpolateParams);
      }
      else
      {
          const params: MissingTranslationHandlerParams = {key, translateService: this};
          if (typeof interpolateParams !== 'undefined') {
              params.interpolateParams = interpolateParams;
          }
          res = this.missingTranslationHandler.handle(params);
      }

      return res !== undefined ? res : key;
  }

  private getTextToInterpolate(translations: InterpolatableTranslation, key: string): InterpolatableTranslation | undefined
  {
      let text = getValue(translations, key);
      if(text === undefined && this.defaultLang != null && this.defaultLang !== this.currentLang && this.useDefaultLang)
      {
          text = getValue(this.store.getTranslations(this.defaultLang), key);
      }
      return text;
  }

  private runInterpolation(translations: InterpolatableTranslation, interpolateParams?: InterpolationParameters): Translation
  {
    if(isArray(translations))
    {
      return (translations as Translation[]).map((translation) => this.runInterpolation(translation, interpolateParams));
    }
    else if (isDict(translations))
    {
      const result: TranslationObject = {};
      for (const key in translations) {
        const res = this.runInterpolation(translations[key], interpolateParams);
        if(res !== undefined)
        {
          result[key] = res;
        }
      }
      return result;
    }
    else
    {
      return this.parser.interpolate(translations, interpolateParams);
    }
  }

  /**
   * Returns the parsed result of the translations
   */
  public getParsedResult(translations: InterpolatableTranslation, key: string | string[], interpolateParams?: InterpolationParameters): Translation|TranslationObject|Observable<Translation|TranslationObject> {

    // handle a bunch of keys
    if (key instanceof Array) {
      const result: Record<string, Translation|Observable<Translation>> = {};

      let observables = false;
      for (const k of key) {
        result[k] = this.getParsedResultForKey(translations, k, interpolateParams);
        observables = observables || isObservable(result[k]);
      }

      if (!observables) {
        return result as TranslationObject;
      }

      const sources: Observable<Translation>[] = key.map(k => makeObservable(result[k]));
      return forkJoin(sources).pipe(
        map((arr: (Translation)[]) => {
          const obj: TranslationObject = {};
          arr.forEach((value:Translation, index: number) => {
            obj[key[index]] = value;
          });
          return obj;
        })
      );
    }

    return this.getParsedResultForKey(translations, key, interpolateParams);
  }

  /**
   * Gets the translated value of a key (or an array of keys)
   * @returns the translated key, or an object of translated keys
   */
  public get(key: string | string[], interpolateParams?: InterpolationParameters): Observable<Translation|TranslationObject> {
    if (!isDefined(key) || !key.length) {
      throw new Error(`Parameter "key" is required and cannot be empty`);
    }
    // check if we are loading a new translation to use
    if (this.pending) {
      return this.loadingTranslations.pipe(
        concatMap((res: InterpolatableTranslation) => {
          return makeObservable(this.getParsedResult(res, key, interpolateParams));
        }),
      );
    }

    return makeObservable(this.getParsedResult(this.store.getTranslations(this.currentLang), key, interpolateParams));
  }

  /**
   * Returns a stream of translated values of a key (or an array of keys) which updates
   * whenever the translation changes.
   * @returns A stream of the translated key, or an object of translated keys
   */
  public getStreamOnTranslationChange(key: string | string[], interpolateParams?: InterpolationParameters): Observable<Translation|TranslationObject> {
    if (!isDefined(key) || !key.length) {
      throw new Error(`Parameter "key" is required and cannot be empty`);
    }

    return concat(
      defer(() => this.get(key, interpolateParams)),
      this.onTranslationChange.pipe(
        switchMap((event: TranslationChangeEvent) => {
          const res = this.getParsedResult(event.translations, key, interpolateParams);
          return makeObservable(res);
        })
      )
    );
  }

  /**
   * Returns a stream of translated values of a key (or an array of keys) which updates
   * whenever the language changes.
   * @returns A stream of the translated key, or an object of translated keys
   */
  public stream(key: string | string[], interpolateParams?: InterpolationParameters): Observable<Translation|TranslationObject> {
    if (!isDefined(key) || !key.length) {
      throw new Error(`Parameter "key" required`);
    }

    return concat(
      defer(() => this.get(key, interpolateParams)),
      this.onLangChange.pipe(
        switchMap((event: LangChangeEvent) => {
          const res = this.getParsedResult(event.translations, key, interpolateParams);
          return makeObservable(res);
        })
      ));
  }

  /**
   * Returns a translation instantly from the internal state of loaded translation.
   * All rules regarding the current language, the preferred language of even fallback languages
   * will be used except any promise handling.
   */
  public instant(key: string | string[], interpolateParams?: InterpolationParameters): Translation|TranslationObject
  {
    if (!isDefined(key) || key.length === 0) {
      throw new Error('Parameter "key" is required and cannot be empty');
    }

    const result = this.getParsedResult(this.store.getTranslations(this.currentLang), key, interpolateParams);

    if (isObservable(result)) {
      if (Array.isArray(key)) {
        return key.reduce((acc: Record<string, string>, currKey: string) => {
          acc[currKey] = currKey;
          return acc;
        }, {});
      }
      return key;
    }

    return result;
  }

  /**
   * Sets the translated value of a key, after compiling it
   */
  public set(key: string, translation: Translation, lang: Language = this.currentLang): void {

    this.store.setTranslations(
      lang,
      insertValue(this.store.getTranslations(lang), key,
        isString(translation)
        ? this.compiler.compile(translation, lang)
        : this.compiler.compileTranslations(translation, lang)
      ),
      false
    );
  }


  /**
   * Allows to reload the lang file from the file
   */
  public reloadLang(lang: string): Observable<InterpolatableTranslationObject> {
    this.resetLang(lang);
    return this.loadAndCompileTranslations(lang);
  }

  /**
   * Deletes inner translation
   */
  public resetLang(lang: string): void {
    delete this._translationRequests[lang];
    this.store.deleteTranslations(lang);
  }

  /**
   * Returns the language code name from the browser, e.g. "de"
   */
  public getBrowserLang(): string | undefined {
    if (typeof window === 'undefined' || !window.navigator) {
      return undefined;
    }

    const browserLang = this.getBrowserCultureLang();

    return browserLang ? browserLang.split(/[-_]/)[0] : undefined;
  }

  /**
   * Returns the culture language code name from the browser, e.g. "de-DE"
   */
  public getBrowserCultureLang(): string | undefined {
    if (typeof window === 'undefined' || typeof window.navigator === 'undefined') {
      return undefined;
    }

    return window.navigator.languages
             ? window.navigator.languages[0]
             : (window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage);
  }
}
