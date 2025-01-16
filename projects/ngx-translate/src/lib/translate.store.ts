import {
  InterpolatableTranslationObject,
  DefaultLangChangeEvent,
  LangChangeEvent,
  TranslationChangeEvent
} from "./translate.service";
import { Subject } from "rxjs";

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
  public translations: Record<string, InterpolatableTranslationObject> = {};

  /**
   * an array of langs
   */
  public langs: string[] = [];

  /**
   * A Subject to listen to translation change events
   * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
   */
  public onTranslationChange: Subject<TranslationChangeEvent> = new Subject<TranslationChangeEvent>();

  /**
   * A Subject to listen to lang change events
   * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
   */
  public onLangChange: Subject<LangChangeEvent> = new Subject<LangChangeEvent>();

  /**
   * A Subject to listen to default lang change events
   * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
   */
  public onDefaultLangChange: Subject<DefaultLangChangeEvent> = new Subject<DefaultLangChangeEvent>();
}
