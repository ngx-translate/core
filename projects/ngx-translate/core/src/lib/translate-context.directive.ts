import { Directive, Inject, Input, Optional, Self, SkipSelf, TemplateRef, ViewContainerRef } from '@angular/core';
import { TranslateContextService } from './translate-context.service';
import { TranslateService } from './translate.service';

@Directive({
  selector: '[translateContext],[ngx-translateContext]',
  providers: [{ provide: TranslateService, useClass: TranslateContextService }]
})
export class TranslateContextDirective {

  constructor(
    @Inject(TranslateService) @Self() private contextTranslateService: TranslateContextService,
    @Inject(TranslateService) @Optional() @SkipSelf() private readonly parentContext: TranslateService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {
    this.contextTranslateService.parentContext = this.parentContext;
  }


  @Input() set translateContext(params: {}) {
    this.contextTranslateService.params = params;
    this.viewContainer.clear();
    this.viewContainer.createEmbeddedView(this.templateRef);
  }

  @Input() set translateContextNamespace(namespace: string) {
    this.contextTranslateService.namespace = namespace;
  }
}