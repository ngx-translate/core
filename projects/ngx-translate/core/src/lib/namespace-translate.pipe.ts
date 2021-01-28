import { ChangeDetectorRef, Injectable, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from './translate.service';
import { BaseTranslatePipe } from './base-translate.pipe';
import { NamespaceTranslateService } from './namespace-translate.service';

@Injectable()
@Pipe({
  name: 'namespaceTranslate',
  pure: false // required to update the value when the promise is resolved
})
export class NamespaceTranslatePipe extends BaseTranslatePipe implements PipeTransform, OnDestroy {


  constructor(private namespaceTranslate: NamespaceTranslateService, translate: TranslateService, _ref: ChangeDetectorRef) {
    super(translate, _ref);
  }

  protected getParsedResult(translations: any, key: string | string[], interpolateParams?: Object) {
    return this.namespaceTranslate.getParsedResult(translations, key, interpolateParams);
  }
  protected get(key: string | string[], interpolateParams?: Object) {
    return this.namespaceTranslate.get(key, interpolateParams);
  }

  protected pipeName = "NamespaceTranslatePipe";

}
