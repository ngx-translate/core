import {
    NgModule,
    ModuleWithProviders,
    Provider,
    EnvironmentProviders,
    makeEnvironmentProviders, Type,
} from "@angular/core";
import { TranslateLoader, TranslateFakeLoader } from "./lib/translate.loader";
import {
    MissingTranslationHandler,
    FakeMissingTranslationHandler,
} from "./lib/missing-translation-handler";
import { TranslateParser, TranslateDefaultParser } from "./lib/translate.parser";
import { TranslateCompiler, TranslateFakeCompiler } from "./lib/translate.compiler";
import { TranslateDirective } from "./lib/translate.directive";
import { TranslatePipe } from "./lib/translate.pipe";
import { TranslateStore } from "./lib/translate.store";
import {
    USE_DEFAULT_LANG,
    DEFAULT_LANGUAGE,
    USE_EXTEND,
    ISOLATE_TRANSLATE_SERVICE,
    TranslateService,
} from "./lib/translate.service";

export * from "./lib/translate.loader";
export * from "./lib/translate.service";
export * from "./lib/missing-translation-handler";
export * from "./lib/translate.parser";
export * from "./lib/translate.compiler";
export * from "./lib/translate.directive";
export * from "./lib/translate.pipe";
export * from "./lib/translate.store";
export * from "./lib/extraction-marker";
export * from "./lib/util";

export interface TranslateModuleConfig
{
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
};

export function provideTranslateLoader(loader: Type<TranslateLoader>): Provider
{
    return { provide: TranslateLoader, useClass: loader };
}

export function provideTranslateCompiler(compiler: Type<TranslateCompiler>): Provider
{
    return { provide: TranslateCompiler, useClass: compiler };
}

export function provideTranslateParser(parser: Type<TranslateParser>): Provider
{
    return { provide: TranslateParser, useClass: parser };
}

export function provideTranslateMissingTranslationHandler(
    handler: Type<MissingTranslationHandler>,
): Provider
{
    return { provide: MissingTranslationHandler, useClass: handler };
}

export function provideTranslateService(config: TranslateModuleConfig = {}): EnvironmentProviders
{
    return makeEnvironmentProviders(providers(config));
}


function providers(config: TranslateModuleConfig = {}, includeStore = true): Provider[]
{
    const providers: Provider[] = [
        config.loader || provideTranslateLoader(TranslateFakeLoader),
        config.compiler || provideTranslateCompiler(TranslateFakeCompiler),
        config.parser || provideTranslateParser(TranslateDefaultParser),
        config.missingTranslationHandler || provideTranslateMissingTranslationHandler(FakeMissingTranslationHandler),
        TranslateService,
        { provide: ISOLATE_TRANSLATE_SERVICE, useValue: config.isolate },
        { provide: USE_DEFAULT_LANG, useValue: config.useDefaultLang },
        { provide: USE_EXTEND, useValue: config.extend },
        { provide: DEFAULT_LANGUAGE, useValue: config.defaultLanguage },
    ];

    if(includeStore)
    {
        providers.push(TranslateStore);
    }

    return providers;
}

@NgModule({
    imports: [TranslatePipe, TranslateDirective],
    exports: [TranslatePipe, TranslateDirective],
})
export class TranslateModule {
    /**
     * Use this method in your root module to provide the TranslateService
     */
    static forRoot(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
        return {
            ngModule: TranslateModule,
            providers: providers(config),
        };
    }

    /**
     * Use this method in your other (non-root) modules to import the directive/pipe
     */
    static forChild(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
        return {
            ngModule: TranslateModule,
            providers: providers(config, false),
        };
    }
}
