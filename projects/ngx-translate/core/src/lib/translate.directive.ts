import { AfterViewChecked, ChangeDetectorRef, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { TranslateService } from './translate.service';
import { BaseTranslateDirective } from './base-translate.directive';
import { Observable } from 'rxjs';

@Directive({
  selector: '[translate],[ngx-translate]'
})
export class TranslateDirective extends BaseTranslateDirective implements AfterViewChecked, OnDestroy {

  @Input() set translate(value: string) {
    this.setTranslate(value);
  }

  @Input() set translateParams(value: any) {
    this.setTranslateParams(value);
  }

  constructor(translateService: TranslateService, element: ElementRef, _ref: ChangeDetectorRef) {
    super(translateService, element, _ref);
  }

  getParsedResult(translations: any, key: string | string[], interpolateParams?: Object): any {
    return this.translateService.getParsedResult(translations, key, interpolateParams);
  }

  get(key: string | string[], interpolateParams?: Object): Observable<any> {
    return this.translateService.get(key, interpolateParams);
  }

}
