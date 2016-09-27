import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Injectable,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer,
  Sanitizer,
  SecurityContext,
  SimpleChange
} from '@angular/core';
import { TranslateService, LangChangeEvent } from './translate.service';

@Injectable()
@Component({
  selector: '[translate]',
  template: '<ng-content></ng-content>',
  providers: [TranslateService]
})
export class TranslateComponent implements OnInit, OnChanges, OnDestroy {
  @Input('translate')
  private translateKey: string;
  @Input('translate-values')
  private translateValues: { [key: string]: string };
  private key: string;
  onLangChange: EventEmitter<LangChangeEvent>;

  constructor(
    public sanitizer: Sanitizer,
    public translate: TranslateService,
    public _elementRef: ElementRef,
    public _changeDetectorRef: ChangeDetectorRef
  ) {
    this.onLangChange = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.updateValue(this.key, "onLangeChange");
    });
  }

  /**
   * preserves the key from the translate attribute or from innerHTML
   */
  ngOnInit() {
    this.key = this.translateKey ? this.translateKey : this._elementRef.nativeElement.innerHTML;
    this.updateValue(this.key);
  }

  /**
   * updates the translation if the interpolation params change
   * @param  changes
   */
  ngOnChanges(changes: { [key: string]: SimpleChange; }) {
    if (changes["translateValues"] && this.key) {
      this.updateValue(this.key);
    }
  }

  /**
   * updates the translation
   * @param  key
   */
  updateValue(key: string, debug?: any) {
    Object.keys(this.translateValues).forEach(valueKey => {
      this.translateValues[valueKey] = this.sanitizer.sanitize(SecurityContext.HTML, this.translateValues[valueKey]);
    });
    this.translate.get(key, this.translateValues).subscribe((res: string | any) => {
      this._elementRef.nativeElement.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, res);
      this._changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy() {
    this.onLangChange.unsubscribe();
  }
}
