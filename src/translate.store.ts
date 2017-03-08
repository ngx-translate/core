import {EventEmitter} from "@angular/core";
import {DefaultLangChangeEvent, LangChangeEvent, TranslationChangeEvent} from "./translate.service";

export class TranslateStore {
    /**
     * The default lang to fallback when translations are missing on the current lang
     */
    public defaultLang: string;

    /**
     * The lang currently used
     * @type {string}
     */
    public currentLang: string = this.defaultLang;

    /**
     * a list of translations per lang
     * @type {{}}
     */
    public translations: any = {};

    /**
     * an array of langs
     * @type {Array}
     */
    public langs: Array<string> = [];

    /**
     * An EventEmitter to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<TranslationChangeEvent>}
     */
    public onTranslationChange: EventEmitter<TranslationChangeEvent> = new EventEmitter<TranslationChangeEvent>();

    /**
     * An EventEmitter to listen to lang change events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<LangChangeEvent>}
     */
    public onLangChange: EventEmitter<LangChangeEvent> = new EventEmitter<LangChangeEvent>();

    /**
     * An EventEmitter to listen to default lang change events
     * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
     * @type {EventEmitter<DefaultLangChangeEvent>}
     */
    public onDefaultLangChange: EventEmitter<DefaultLangChangeEvent> = new EventEmitter<DefaultLangChangeEvent>();
}
