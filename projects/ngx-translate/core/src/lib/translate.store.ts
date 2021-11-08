import {EventEmitter} from "@angular/core";
import {DefaultLangChangeEvent, LangChangeEvent, TranslationChangeEvent} from "./translate.service";

export class TranslateStore {
  /**
   * The default lang to fallback when translations are missing on the current lang
   */
  public defaultLang!: string;

  /**
   * The lang currently used
   */
  public currentLang: string = this.defaultLang;

  /**
   * a list of translations per lang
   */
  public translations: any = {};

  /**
   * an array of langs
   */
  public langs: Array<string> = [];

  /**
   * An EventEmitter to listen to translation change events
   * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
   */
  public onTranslationChange: EventEmitter<TranslationChangeEvent> = new EventEmitter<TranslationChangeEvent>();

  /**
   * An EventEmitter to listen to lang change events
   * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
   */
  public onLangChange: EventEmitter<LangChangeEvent> = new EventEmitter<LangChangeEvent>();

  /**
   * An EventEmitter to listen to default lang change events
   * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
   */
  public onDefaultLangChange: EventEmitter<DefaultLangChangeEvent> = new EventEmitter<DefaultLangChangeEvent>();
}
