import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
    Injectable,
    Input,
    OnChanges,
    OnInit,
    SimpleChange
} from '@angular/core';
import { DomSanitizationService, SecurityContext } from '@angular/platform-browser';
import {TranslateService} from './translate.service';

@Injectable()
@Directive({
    selector: '[translate]'
})
export class TranslateDirective implements OnInit, OnChanges {
    @Input()
    private translate: string;
    @Input('translate-values')
    private interpolateParams: { [key: string]: string };
    private key: string;

    constructor(
        public domSanitizationService: DomSanitizationService,
        public translateService: TranslateService,
        public _elementRef: ElementRef,
        public _changeDetectorRef: ChangeDetectorRef
    ) {
    }

    /**
     * preserves the key from the translate attribute or from innerHTML
     */
    ngOnInit() {
        this.key = this.translate ? this.translate : this._elementRef.nativeElement.innerHTML;
        this.updateValue(this.key);
        this.translateService.onLangChange.subscribe(() => {
            this.updateValue(this.key);
        });
    }

    /**
     * updates the translation if the interpolation params change
     * @param  changes
     */
    ngOnChanges(changes: { [key: string]: SimpleChange; }) {
        if (changes["interpolateParams"] && this.key) {
            this.updateValue(this.key);
        }
    }

    /**
     * updates the translation
     * @param  key
     */
    updateValue(key: string) {
        Object.keys(this.interpolateParams).forEach(key => {
            this.interpolateParams[key] = this.domSanitizationService.sanitize(SecurityContext.HTML, this.interpolateParams[key]);
        });
        this.translateService.get(key, this.interpolateParams).subscribe((res: string) => {
            this._elementRef.nativeElement.innerHTML = this.domSanitizationService.sanitize(SecurityContext.HTML, res);
            this._changeDetectorRef.markForCheck();
        });
    }
}
