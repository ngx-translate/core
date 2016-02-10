import {
  Directive,
  ElementRef,
  Injectable,
  Input,
  OnInit
} from 'angular2/core';
import {TranslateService} from './translate.service';

@Injectable()
@Directive({
  selector: '[translate]'
})
export class TranslateDirective implements OnInit {
  @Input()
  private translate: string;
  @Input('translate-values')
  private interpolateParams: {};
  private key: string;

  constructor(
    public translateService: TranslateService,
    public ref: ElementRef
  ) {
  }

  /**
   * preserves the key from the translate attribute or from innerHTML
   */
  ngOnInit() {
    this.key = this.translate ? this.translate : this.ref.nativeElement.innerHTML;
    this.updateValue(this.key);
    this.translateService.onLangChange.subscribe(() => {
      this.updateValue(this.key);
    });
  }

  /**
   * updates the translation
   * @param  key
   */
  updateValue(key: string) {
    this.translateService.get(key, this.interpolateParams).subscribe((res: string) => {
      this.ref.nativeElement.innerHTML = res;
    });
  }
}
