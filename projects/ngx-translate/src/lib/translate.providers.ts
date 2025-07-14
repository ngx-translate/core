import {
    TRANSLATE_SERVICE_CONFIG,
    TranslateService,
    TranslateServiceConfig,
} from "./translate.service";
import { Provider, Type } from "@angular/core";
import { TranslateFakeLoader, TranslateLoader } from "./translate.loader";
import { TranslateCompiler, TranslateFakeCompiler } from "./translate.compiler";
import { TranslateDefaultParser, TranslateParser } from "./translate.parser";
import {
    FakeMissingTranslationHandler,
    MissingTranslationHandler,
} from "./missing-translation-handler";
import { TranslateStore } from "./translate.store";
import { TranslateModuleConfig } from "./translate.module";

export interface ProvideTranslateServiceConfig extends Partial<TranslateServiceConfig> {
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

export function provideTranslateService(config: ProvideTranslateServiceConfig = {}): Provider[] {
    return defaultProviders({ ...config });
}

export function defaultProviders(config: TranslateModuleConfig = {}): Provider[] {
    const serviceConfig: TranslateServiceConfig = {
        defaultLanguage: config.defaultLanguage,
        extend: config.extend ?? false,
        isolate: config.isolate ?? true,
        useDefaultLang: config.useDefaultLang ?? true,
    };

    return [
        {
            provide: TRANSLATE_SERVICE_CONFIG,
            useValue: serviceConfig,
        },
        ...(serviceConfig.isolate ? [TranslateStore] : []),
        config.compiler ?? provideTranslateCompiler(TranslateFakeCompiler),
        config.parser ?? provideTranslateParser(TranslateDefaultParser),
        config.loader ?? provideTranslateLoader(TranslateFakeLoader),
        config.missingTranslationHandler ??
            provideTranslateMissingTranslationHandler(FakeMissingTranslationHandler),
        {
            provide: TranslateService,
            useClass: TranslateService,
            deps: [TranslateLoader, TranslateCompiler, TranslateParser, MissingTranslationHandler],
        },
    ];
}

