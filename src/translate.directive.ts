import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Sanitizer,
  SecurityContext,
  SimpleChange
} from '@angular/core';
import {
  LangChangeEvent,
  TranslateService,
  TranslationChangeEvent
} from './translate.service';

@Component({
  selector: '[translate]',
  template: '<ng-content></ng-content>'
})
export class TranslateComponent implements OnInit, OnChanges, OnDestroy {
  @Input('translate')
  private translateKey: string;
  // I'll name it translate-values, because of compatibility to Pascal Prechts angular-translate
  @Input('translate-values')
  private interpolationParams: { [key: string]: string } = {};
  private key: string;
  onTranslationChange: EventEmitter<TranslationChangeEvent>;
  onLangChange: EventEmitter<LangChangeEvent>;

  constructor(
    public sanitizer: Sanitizer,
    public translate: TranslateService,
    public _elRef: ElementRef,
    public _cdRef: ChangeDetectorRef
  ) {

  }

  /**
   * preserves the key from the translate attribute or from innerHTML
   */
  ngOnInit() {
    this.key = this.translateKey ? this.translateKey : this._elRef.nativeElement.innerHTML;
    this.updateValue();

    // if there is a subscription to onLangChange, clean it
    this._dispose();

    // subscribe to onTranslationChange event, in case the translations change
    if (!this.onTranslationChange) {
      this.onTranslationChange = this.translate.onTranslationChange.subscribe((event: TranslationChangeEvent) => {
        if (event.lang === this.translate.currentLang) {
          this.updateValue();
        }
      });
    }

    // subscribe to onLangChange event, in case the language changes
    if (!this.onLangChange) {
      this.onLangChange = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
        this.updateValue();
      });
    }
  }

  /**
   * updates the translation if the interpolation params change
   * @param  changes
   */
  ngOnChanges(changes: { [key: string]: SimpleChange; }) {
    if (changes["interpolationParams"] && this.key) {
      this.updateValue();
    }
  }

  /**
   * updates the translation
   * @param  key
   */
  updateValue() {
    Object.keys(this.interpolationParams).forEach(valueKey => {
      this.interpolationParams[valueKey] = this.sanitizer.sanitize(SecurityContext.HTML, this.interpolationParams[valueKey]);
    });
    this.translate.get(this.key, this.interpolationParams).subscribe((res: string | any) => {
      this._elRef.nativeElement.innerHTML = res ? this.sanitizer.sanitize(SecurityContext.HTML, res) : this.key;
      this._cdRef.markForCheck();
    });
  }

  /**
   * Clean any existing subscription to change events
   * @private
   */
  _dispose(): void {
    if (typeof this.onTranslationChange !== 'undefined') {
      this.onTranslationChange.unsubscribe();
      this.onTranslationChange = undefined;
    }
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }

  ngOnDestroy(): void {
    this._dispose();
  }
}
