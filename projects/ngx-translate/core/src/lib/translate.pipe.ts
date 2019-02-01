import {ChangeDetectorRef, Injectable, OnDestroy, Pipe, PipeTransform} from '@angular/core';

import {Subscription} from 'rxjs'

import {LangChangeEvent, TranslateService, TranslationChangeEvent} from './translate.service';
import {equals, isDefined} from './util';

@Injectable()
@Pipe({
  name: 'translate',
  pure: false // required to update the value when the promise is resolved
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  value: string = '';
  lastKey: string;
  lastParams: any[];

  private _onTranslationChangeSub: Subscription;
  private _onLangChangeSub: Subscription;
  private _onDefaultLangChangeSub: Subscription;

  constructor(private translate: TranslateService, private _ref: ChangeDetectorRef) {
  }

  updateValue(key: string, interpolateParams?: Object, translations?: any): void {
    let onTranslation = (res: string) => {
      this.value = res !== undefined ? res : key;
      this.lastKey = key;
      this._ref.markForCheck();
    };
    if (translations) {
      let res = this.translate.getParsedResult(translations, key, interpolateParams);
      if (typeof res.subscribe === 'function') {
        res.subscribe(onTranslation);
      } else {
        onTranslation(res);
      }
    }
    this.translate.get(key, interpolateParams).subscribe(onTranslation);
  }

  transform(query: string, ...args: any[]): any {
    if (!query || query.length === 0) {
      return query;
    }

    // if we ask another time for the same key, return the last value
    if (equals(query, this.lastKey) && equals(args, this.lastParams)) {
      return this.value;
    }

    let interpolateParams: Object;
    if (isDefined(args[0]) && args.length) {
      if (typeof args[0] === 'string' && args[0].length) {
        // we accept objects written in the template such as {n:1}, {'n':1}, {n:'v'}
        // which is why we might need to change it to real JSON objects such as {"n":1} or {"n":"v"}
        let validArgs: string = args[0]
          .replace(/(\')?([a-zA-Z0-9_]+)(\')?(\s)?:/g, '"$2":')
          .replace(/:(\s)?(\')(.*?)(\')/g, ':"$3"');
        try {
          interpolateParams = JSON.parse(validArgs);
        } catch (e) {
          throw new SyntaxError(`Wrong parameter in TranslatePipe. Expected a valid Object, received: ${args[0]}`);
        }
      } else if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
        interpolateParams = args[0];
      }
    }

    // store the query, in case it changes
    this.lastKey = query;

    // store the params, in case they change
    this.lastParams = args;

    // set the value
    this.updateValue(query, interpolateParams);

    // if there is a subscription to onLangChange, clean it
    this._dispose();

    // subscribe to onTranslationChange event, in case the translations change
    if (this._onTranslationChangeSub == null) {
      this._onTranslationChangeSub = this.translate.onTranslationChange.subscribe((event: TranslationChangeEvent) => {
        if (this.lastKey && event.lang === this.translate.currentLang) {
          this.lastKey = null;
          this.updateValue(query, interpolateParams, event.translations);
        }
      });
    }

    // subscribe to onLangChange event, in case the language changes
    if (this._onLangChangeSub == null) {
      this._onLangChangeSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
        if (this.lastKey) {
          this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
          this.updateValue(query, interpolateParams, event.translations);
        }
      });
    }

    // subscribe to onDefaultLangChange event, in case the default language changes
    if (this._onDefaultLangChangeSub == null) {
      this._onDefaultLangChangeSub = this.translate.onDefaultLangChange.subscribe(() => {
        if (this.lastKey) {
          this.lastKey = null; // we want to make sure it doesn't return the same value until it's been updated
          this.updateValue(query, interpolateParams);
        }
      });
    }

    return this.value;
  }

  /**
   * Clean any existing subscription to change events
   */
  private _dispose(): void {
    if (this._onDefaultLangChangeSub != null) {
      this._onDefaultLangChangeSub.unsubscribe();
    }
    if (this._onLangChangeSub != null) {
      this._onLangChangeSub.unsubscribe();
    }
    if (this._onDefaultLangChangeSub != null) {
      this._onDefaultLangChangeSub.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    this._dispose();
  }
}
