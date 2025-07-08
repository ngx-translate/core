import {
    EnvironmentProviders,
    makeEnvironmentProviders,
    ModuleWithProviders,
    NgModule,
    Provider,
    Type,
} from "@angular/core";
import {
    FakeMissingTranslationHandler,
    MissingTranslationHandler,
} from "./lib/missing-translation-handler";
import { TranslateCompiler, TranslateFakeCompiler } from "./lib/translate.compiler";
import { TranslateDirective } from "./lib/translate.directive";
import { TranslateFakeLoader, TranslateLoader } from "./lib/translate.loader";
import { TranslateDefaultParser, TranslateParser } from "./lib/translate.parser";
import { TranslatePipe } from "./lib/translate.pipe";
import {
    TRANSLATE_CONFIG,
    TranslateService,
    TranslateServiceConfig,
} from "./lib/translate.service";
import { TranslateStore } from "./lib/translate.store";

export * from "./lib/extraction-marker";
export * from "./lib/missing-translation-handler";
export * from "./lib/translate.compiler";
export * from "./lib/translate.directive";
export * from "./lib/translate.loader";
export * from "./lib/translate.parser";
export * from "./lib/translate.pipe";
export * from "./lib/translate.service";
export * from "./lib/translate.store";
export * from "./lib/util";

export interface TranslateModuleConfig extends Partial<TranslateServiceConfig> {
    loader?: Provider;
    compiler?: Provider;
    parser?: Provider;
    missingTranslationHandler?: Provider;
}

export function provideTranslateLoader(loader: Type<TranslateLoader>): Provider {
    return { provide: TranslateLoader, useClass: loader };
}

export function provideTranslateCompiler(compiler: Type<TranslateCompiler>): Provider {
    return { provide: TranslateCompiler, useClass: compiler };
}

export function provideTranslateParser(parser: Type<TranslateParser>): Provider {
    return { provide: TranslateParser, useClass: parser };
}

export function provideTranslateMissingTranslationHandler(
    handler: Type<MissingTranslationHandler>,
): Provider {
    return { provide: MissingTranslationHandler, useClass: handler };
}

export function provideTranslateService(config: TranslateModuleConfig = {}): EnvironmentProviders {
    return makeEnvironmentProviders(providers(config));
}

function providers(config: TranslateModuleConfig = {}, includeStore = true): Provider[] {
    const serviceConfig: TranslateServiceConfig = {
        defaultLanguage: config.defaultLanguage,
        extend: config.extend ?? false,
        isolate: config.isolate ?? false,
        useDefaultLang: config.useDefaultLang ?? true,
    };

    const providers: Provider[] = [
        config.loader || provideTranslateLoader(TranslateFakeLoader),
        config.compiler || provideTranslateCompiler(TranslateFakeCompiler),
        config.parser || provideTranslateParser(TranslateDefaultParser),
        config.missingTranslationHandler ||
            provideTranslateMissingTranslationHandler(FakeMissingTranslationHandler),
        {
            provide: TRANSLATE_CONFIG,
            useValue: serviceConfig,
        },
        TranslateService,
    ];

    if (includeStore) {
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
