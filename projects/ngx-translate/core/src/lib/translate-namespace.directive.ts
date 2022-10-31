import { Directive, Inject, Input, Optional, Self, SkipSelf, TemplateRef, ViewContainerRef } from '@angular/core';
import { TranslateContextService } from './translate-context.service';
import { TranslateService } from './translate.service';


@Directive({
  selector: '[translateNamespace],[ngx-translateNamespace]',
  providers: [{ provide: TranslateService, useClass: TranslateContextService }]
})
export class TranslateNamespaceDirective {

  constructor(
    @Inject(TranslateService) @Self() private contextTranslateService: TranslateContextService,
    @Inject(TranslateService) @Optional() @SkipSelf() private readonly parentContext: TranslateService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) { 
    this.contextTranslateService.parentContext = this.parentContext;
  }


  @Input() set translateNamespace(namespace: string) {
    this.contextTranslateService.namespace = namespace;
    this.viewContainer.clear();
    this.viewContainer.createEmbeddedView(this.templateRef);
  }
}