import { Directive, Inject, Injectable, Input, Optional, Self, SkipSelf, TemplateRef, ViewContainerRef } from '@angular/core';
import { map, Observable, zip } from 'rxjs';
import { MissingTranslationHandler } from './missing-translation-handler';
import { TranslateCompiler } from './translate.compiler';
import { TranslateLoader } from './translate.loader';
import { TranslateParser } from './translate.parser';
import { DEFAULT_LANGUAGE, TranslateService, USE_DEFAULT_LANG, USE_EXTEND, USE_STORE } from './translate.service';
import { TranslateStore } from './translate.store';


@Injectable()
class TranslateContextService extends TranslateService {

  constructor(
    @Inject(TranslateService) @Optional() @SkipSelf() private parentContext: TranslateService,

    store: TranslateStore,
    currentLoader: TranslateLoader,
    compiler: TranslateCompiler,
    parser: TranslateParser,
    missingTranslationHandler: MissingTranslationHandler,
    @Inject(DEFAULT_LANGUAGE) defaultLanguage: string,
    @Inject(USE_DEFAULT_LANG) useDefaultLang: boolean = true,
    @Inject(USE_STORE) isolate: boolean = false,
    @Inject(USE_EXTEND) extend: boolean = false
  ) {
    super(store, currentLoader, compiler, parser, missingTranslationHandler, useDefaultLang, isolate, extend, defaultLanguage);
  }

  params = {};
  namespace: string | null = null;

  public override get(key: string | Array<string>, interpolateParams?: {}): Observable<any> {

    const paramsWithContext = { ...this.params, ...interpolateParams };

    let result$ = this.parentContext.get(key, paramsWithContext);

    if (this.namespace) {
      const namespacedKey = `${this.namespace}.${key}`;

      result$ = zip(result$, this.parentContext.get(namespacedKey, paramsWithContext)).pipe(
        map(([label, namespacedLabel]) => namespacedLabel === namespacedKey ? label : namespacedLabel)
      );
    }

    return result$;
  }

}

@Directive({
  selector: '[translateContext],[ngx-translateContext]',
  providers: [{ provide: TranslateService, useClass: TranslateContextService }]
})
export class TranslateContextDirective {

  constructor(
    @Inject(TranslateService) @Self() private contextTranslateService: TranslateContextService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) { }


  @Input() set translateContext(params: {}) {
    this.contextTranslateService.params = params;
    this.viewContainer.clear();
    this.viewContainer.createEmbeddedView(this.templateRef);
  }

  @Input() set translateContextNamespace(namespace: string) {
    this.contextTranslateService.namespace = namespace;
  }
}