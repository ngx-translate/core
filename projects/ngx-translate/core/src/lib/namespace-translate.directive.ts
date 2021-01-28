import { AfterViewChecked, ChangeDetectorRef, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { TranslateService } from './translate.service';
import { BaseTranslateDirective } from './base-translate.directive';
import { NamespaceTranslateService } from './namespace-translate.service';

@Directive({
  selector: '[namespace-translate],[ngx-namespace-translate]'
})
export class NamespaceTranslateDirective extends BaseTranslateDirective implements AfterViewChecked, OnDestroy {

  @Input("namespace-translate") set namespaceTranslate(value: string) {
    this.setTranslate(value);
  }

  @Input() set translateParams(value: any) {
    this.setTranslateParams(value);
  }

  constructor(private namespaceTranslateService: NamespaceTranslateService, translateService: TranslateService, element: ElementRef, _ref: ChangeDetectorRef) {
    super(translateService, element, _ref);
  }

  getParsedResult(translations: any, key: string | string[], interpolateParams?: Object) {
    return this.namespaceTranslateService.getParsedResult(translations, key, interpolateParams);
  }
  get(key: string | string[], interpolateParams?: Object) {
    return this.namespaceTranslateService.get(key, interpolateParams);
  }

}
