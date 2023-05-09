import {NgModule, ModuleWithProviders, Provider} from "@angular/core";
import {TranslateLoader, TranslateFakeLoader} from "./lib/translate.loader";
import {MissingTranslationHandler, FakeMissingTranslationHandler} from "./lib/missing-translation-handler";
import {TranslateParser, TranslateDefaultParser} from "./lib/translate.parser";
import {TranslateCompiler, TranslateFakeCompiler} from "./lib/translate.compiler";
import {TranslateDirective} from "./lib/translate.directive";
import {TranslatePipe} from "./lib/translate.pipe";
import {TranslateStore} from "./lib/translate.store";
import {USE_DEFAULT_LANG, DEFAULT_LANGUAGE, USE_STORE, TranslateService, USE_EXTEND} from "./lib/translate.service";

export * from "./lib/translate.loader";
export * from "./lib/translate.service";
export * from "./lib/missing-translation-handler";
export * from "./lib/translate.parser";
export * from "./lib/translate.compiler";
export * from "./lib/translate.directive";
export * from "./lib/translate.pipe";
export * from "./lib/translate.store";

export interface TranslateModuleConfig {
  loader?: Provider;
  compiler?: Provider;
  parser?: Provider;
  missingTranslationHandler?: Provider;
  // isolate the service instance, only works for lazy loaded modules or components with the "providers" property
  isolate?: boolean;
  // extends translations for a given language instead of ignoring them if present
  extend?: boolean;
  useDefaultLang?: boolean;
  defaultLanguage?: string;
}

@NgModule({
  declarations: [
    TranslatePipe,
    TranslateDirective
  ],
  exports: [
    TranslatePipe,
    TranslateDirective
  ]
})
export class TranslateModule {
  /**
   * Use this method in your root module to provide the TranslateService
   */
  static forRoot(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        config.loader || {provide: TranslateLoader, useClass: TranslateFakeLoader},
        config.compiler || {provide: TranslateCompiler, useClass: TranslateFakeCompiler},
        config.parser || {provide: TranslateParser, useClass: TranslateDefaultParser},
        config.missingTranslationHandler || {provide: MissingTranslationHandler, useClass: FakeMissingTranslationHandler},
        TranslateStore,
        {provide: USE_STORE, useValue: config.isolate},
        {provide: USE_DEFAULT_LANG, useValue: config.useDefaultLang},
        {provide: USE_EXTEND, useValue: config.extend},
        {provide: DEFAULT_LANGUAGE, useValue: config.defaultLanguage},
        TranslateService
      ]
    };
  }

  /**
   * Use this method in your other (non root) modules to import the directive/pipe
   */
  static forChild(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
    return {
      ngModule: TranslateModule,
      providers: [
        config.loader || {provide: TranslateLoader, useClass: TranslateFakeLoader},
        config.compiler || {provide: TranslateCompiler, useClass: TranslateFakeCompiler},
        config.parser || {provide: TranslateParser, useClass: TranslateDefaultParser},
        config.missingTranslationHandler || {provide: MissingTranslationHandler, useClass: FakeMissingTranslationHandler},
        {provide: USE_STORE, useValue: config.isolate},
        {provide: USE_DEFAULT_LANG, useValue: config.useDefaultLang},
        {provide: USE_EXTEND, useValue: config.extend},
        {provide: DEFAULT_LANGUAGE, useValue: config.defaultLanguage},
        TranslateService
      ]
    };
  }
}
