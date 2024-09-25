import {EventEmitter, Inject, Injectable, InjectionToken} from "@angular/core";
import {concat, forkJoin, isObservable, Observable, of, defer} from "rxjs";
import {concatMap, map, shareReplay, switchMap, take} from "rxjs/operators";
import {MissingTranslationHandler, MissingTranslationHandlerParams} from "./missing-translation-handler";
import {TranslateCompiler} from "./translate.compiler";
import {TranslateLoader} from "./translate.loader";
import {InterpolateFunction, TranslateParser} from "./translate.parser";

import {TranslateStore} from "./translate.store";
import {getValue, isDefined, mergeDeep, setValue} from "./util";

export const ISOALTE_TRANSLATE_SERVICE = new InjectionToken<string>('ISOALTE_TRANSLATE_SERVICE');
export const USE_DEFAULT_LANG = new InjectionToken<string>('USE_DEFAULT_LANG');
export const DEFAULT_LANGUAGE = new InjectionToken<string>('DEFAULT_LANGUAGE');
export const USE_EXTEND = new InjectionToken<string>('USE_EXTEND');


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
  private _onTranslationChange: EventEmitter<TranslationChangeEvent> = new EventEmitter<TranslationChangeEvent>();
  private _onLangChange: EventEmitter<LangChangeEvent> = new EventEmitter<LangChangeEvent>();
  private _onDefaultLangChange: EventEmitter<DefaultLangChangeEvent> = new EventEmitter<DefaultLangChangeEvent>();
  private _defaultLang!: string;
  private _currentLang!: string;
  private _langs: string[] = [];
  private _translations: Record<string, InterpolatableTranslationObject> = {};
  private _translationRequests: Record<string, Observable<TranslationObject>> = {};



  /**
   * An EventEmitter to listen to translation change events
   * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
   */
  get onTranslationChange(): EventEmitter<TranslationChangeEvent> {
    return this.isolate ? this._onTranslationChange : this.store.onTranslationChange;
  }

  /**
   * An EventEmitter to listen to lang change events
   * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
   */
  get onLangChange(): EventEmitter<LangChangeEvent> {
    return this.isolate ? this._onLangChange : this.store.onLangChange;
  }

  /**
   * An EventEmitter to listen to default lang change events
   * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
   */
  get onDefaultLangChange() {
    return this.isolate ? this._onDefaultLangChange : this.store.onDefaultLangChange;
  }

  /**
   * The default lang to fallback when translations are missing on the current lang
   */
  get defaultLang(): string {
    return this.isolate ? this._defaultLang : this.store.defaultLang;
  }

  set defaultLang(defaultLang: string) {
    if (this.isolate) {
      this._defaultLang = defaultLang;
    } else {
      this.store.defaultLang = defaultLang;
    }
  }

  /**
   * The lang currently used
   */
  get currentLang(): string {
    return this.isolate ? this._currentLang : this.store.currentLang;
  }

  set currentLang(currentLang: string) {
    if (this.isolate) {
      this._currentLang = currentLang;
    } else {
      this.store.currentLang = currentLang;
    }
  }

  /**
   * an array of langs
   */
  get langs(): string[] {
    return this.isolate ? this._langs : this.store.langs;
  }

  set langs(langs: string[]) {
    if (this.isolate) {
      this._langs = langs;
    } else {
      this.store.langs = langs;
    }
  }

  /**
   * a list of translations per lang
   */
  get translations(): Record<string, InterpolatableTranslationObject> {
    return this.isolate ? this._translations : this.store.translations;
  }

  set translations(translations: Record<string, InterpolatableTranslationObject>) {
    if (this.isolate) {
      this._translations = translations;
    } else {
      this.store.translations = translations;
    }
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
              @Inject(ISOALTE_TRANSLATE_SERVICE) private isolate = false,
              @Inject(USE_EXTEND) private extend = false,
              @Inject(DEFAULT_LANGUAGE) defaultLanguage: string) {
    /** set the default language from configuration */
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
      // on init set the defaultLang immediately
      if (this.defaultLang == null) {
        this.defaultLang = lang;
      }

      pending.pipe(take(1))
        .subscribe(() => {
          this.changeDefaultLang(lang);
        });
    } else { // we already have this language
      this.changeDefaultLang(lang);
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
    // don't change the language if the language given is already selected
    if (lang === this.currentLang) {
      return of(this.translations[lang]);
    }

    const pending = this.retrieveTranslations(lang);

    if (typeof pending !== "undefined") {
      // on init set the currentLang immediately
      if (!this.currentLang) {
        this.currentLang = lang;
      }

      pending.pipe(take(1))
        .subscribe(() => {
          this.changeLang(lang);
        });

      return pending;
    } else { // we have this language, return an Observable
      this.changeLang(lang);

      return of(this.translations[lang]);
    }
  }

  /**
   * Retrieves the given translations
   */
  private retrieveTranslations(lang: string): Observable<TranslationObject> | undefined {
    let pending: Observable<TranslationObject> | undefined;

    // if this language is unavailable or extend is true, ask for it
    if (typeof this.translations[lang] === "undefined" || this.extend) {
      this._translationRequests[lang] = this._translationRequests[lang] || this.getTranslation(lang);
      pending = this._translationRequests[lang];
    }

    return pending;
  }

  /**
   * Gets an object of translations for a given language with the current loader
   * and passes it through the compiler
   */
  public getTranslation(lang: string): Observable<TranslationObject> {
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
          this.translations[lang] = this.extend && this.translations[lang] ? { ...res, ...this.translations[lang] } : res;
          this.updateLangs();
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
  public setTranslation(lang: string, translations: InterpolatableTranslationObject, shouldMerge = false): void {
    const interpolatableTranslations = this.compiler.compileTranslations(translations, lang);
    if ((shouldMerge || this.extend) && this.translations[lang]) {
      this.translations[lang] = mergeDeep(this.translations[lang], interpolatableTranslations);
    } else {
      this.translations[lang] = interpolatableTranslations;
    }
    this.updateLangs();
    this.onTranslationChange.emit({lang: lang, translations: this.translations[lang]});
  }

  /**
   * Returns an array of currently available langs
   */
  public getLangs(): string[] {
    return this.langs;
  }

  /**
   * Add available languages
   */
  public addLangs(langs: string[]): void {
    langs.forEach((lang: string) => {
      if (this.langs.indexOf(lang) === -1) {
        this.langs.push(lang);
      }
    });
  }

  /**
   * Update the list of available languages
   */
  private updateLangs(): void {
    this.addLangs(Object.keys(this.translations));
  }

  private getParsedResultForKey(translations: InterpolatableTranslation, key: string, interpolateParams?: object): Translation|Observable<Translation>
  {
      let res: Translation | Observable<Translation> | undefined;

      if (translations) {
        res = this.parser.interpolate(getValue(translations, key), interpolateParams);
      }

      if (res === undefined && this.defaultLang != null && this.defaultLang !== this.currentLang && this.useDefaultLang) {
        res = this.parser.interpolate(getValue(this.translations[this.defaultLang], key), interpolateParams);
      }

      if (res === undefined) {
        const params: MissingTranslationHandlerParams = {key, translateService: this};
        if (typeof interpolateParams !== 'undefined') {
          params.interpolateParams = interpolateParams;
        }
        res = this.missingTranslationHandler.handle(params);
      }

      return res !== undefined ? res : key;
  }

  /**
   * Returns the parsed result of the translations
   */
  public getParsedResult(translations: InterpolatableTranslation, key: string | string[], interpolateParams?: object): Translation|Observable<Translation> {

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
  public get(key: string | string[], interpolateParams?: object): Observable<Translation> {
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

    return makeObservable(this.getParsedResult(this.translations[this.currentLang], key, interpolateParams));
  }

  /**
   * Returns a stream of translated values of a key (or an array of keys) which updates
   * whenever the translation changes.
   * @returns A stream of the translated key, or an object of translated keys
   */
  public getStreamOnTranslationChange(key: string | string[], interpolateParams?: object): Observable<Translation> {
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
  public stream(key: string | string[], interpolateParams?: object): Observable<Translation> {
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
  public instant(key: string | string[], interpolateParams?: object): Translation|TranslationObject
  {
    if (!isDefined(key) || key.length === 0) {
      throw new Error('Parameter "key" is required and cannot be empty');
    }

    const result = this.getParsedResult(this.translations[this.currentLang], key, interpolateParams);

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
  public set(key: string, value: Translation, lang: string = this.currentLang): void {
    console.log(this.translations[lang]);
    setValue(this.translations[lang], key, this.compiler.compile(value, lang));
    console.log(this.translations[lang]);
    this.updateLangs();
    this.onTranslationChange.emit({lang: lang, translations: this.translations[lang]});
  }

  /**
   * Changes the current lang
   */
  private changeLang(lang: string): void {
    this.currentLang = lang;
    this.onLangChange.emit({lang: lang, translations: this.translations[lang]});

    // if there is no default lang, use the one that we just set
    if (this.defaultLang == null) {
      this.changeDefaultLang(lang);
    }
  }

  /**
   * Changes the default lang
   */
  private changeDefaultLang(lang: string): void {
    this.defaultLang = lang;
    this.onDefaultLangChange.emit({lang: lang, translations: this.translations[lang]});
  }

  /**
   * Allows to reload the lang file from the file
   */
  public reloadLang(lang: string): Observable<Translation> {
    this.resetLang(lang);
    return this.getTranslation(lang);
  }

  /**
   * Deletes inner translation
   */
  public resetLang(lang: string): void {
    delete this._translationRequests[lang];
    delete this.translations[lang];
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
