import { ChangeDetectorRef, Injectable, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from './translate.service';
import { BaseTranslatePipe } from './base-translate.pipe';

@Injectable()
@Pipe({
  name: 'translate',
  pure: false // required to update the value when the promise is resolved
})
export class TranslatePipe extends BaseTranslatePipe implements PipeTransform, OnDestroy {

  constructor(translate: TranslateService, _ref: ChangeDetectorRef) {
    super(translate, _ref);
  }

  protected getParsedResult(translations: any, key: string | string[], interpolateParams?: Object) {
    return this.translate.getParsedResult(translations, key, interpolateParams);
  }
  protected get(key: string | string[], interpolateParams?: Object) {
    return this.translate.get(key, interpolateParams);
  }

  protected pipeName = "TranslatePipe";

}
