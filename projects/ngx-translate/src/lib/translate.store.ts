import {
    InterpolatableTranslationObject,
    DefaultLangChangeEvent,
    LangChangeEvent,
    TranslationChangeEvent
} from "./translate.service";
import {Observable, Subject} from "rxjs";


export class TranslateStore
{
    private _onTranslationChange: Subject<TranslationChangeEvent> = new Subject<TranslationChangeEvent>();
    private _onLangChange: Subject<LangChangeEvent> = new Subject<LangChangeEvent>();
    private _onDefaultLangChange: Subject<DefaultLangChangeEvent> = new Subject<DefaultLangChangeEvent>();


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
     * An Observable to listen to translation change events
     * onTranslationChange.subscribe((params: TranslationChangeEvent) => {
     *     // do something
     * });
     */
    get onTranslationChange(): Observable<TranslationChangeEvent>
    {
        return this._onTranslationChange.asObservable();
    }

    public emitTranslationChange(event:TranslationChangeEvent): void
    {
        this._onTranslationChange.next(event);
    }

    /**
     * An Observable to listen to lang change events
     * onLangChange.subscribe((params: LangChangeEvent) => {
     *     // do something
     * });
     */
    get onLangChange(): Observable<LangChangeEvent>
    {
        return this._onLangChange.asObservable();
    }

    public emitLangChange(event:LangChangeEvent): void
    {
        this._onLangChange.next(event);
    }

    /**
     * An Observable to listen to default lang change events
     * onDefaultLangChange.subscribe((params: DefaultLangChangeEvent) => {
     *     // do something
     * });
     */
    get onDefaultLangChange(): Observable<DefaultLangChangeEvent>
    {
        return this._onDefaultLangChange.asObservable();
    }

    public emitDefaultLangChange(event:DefaultLangChangeEvent): void
    {
        this._onDefaultLangChange.next(event);
    }
}
