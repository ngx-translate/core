import {
    TRANSLATE_SERVICE_CONFIG,
    TranslateService,
    TranslateServiceConfig,
} from "./translate.service";
import { EnvironmentProviders, makeEnvironmentProviders, Provider, Type } from "@angular/core";
import { TranslateLoader } from "./translate.loader";
import { TranslateCompiler } from "./translate.compiler";
import { TranslateParser } from "./translate.parser";
import { MissingTranslationHandler } from "./missing-translation-handler";
import { TranslateStore } from "./translate.store";
import { TranslateModuleConfig } from "./translate.module";

export interface ProvideTranslateServiceConfig extends Partial<TranslateServiceConfig> {
    /** @deprecated Use `provideTranslateLoader()` instead. */
    loader?: Provider;

    /** @deprecated Use `provideTranslateCompiler()` instead. */
    compiler?: Provider;

    /** @deprecated Use `provideTranslateParser()` instead. */
    parser?: Provider;

    /** @deprecated Use `provideTranslateMissingTranslationHandler()` instead. */
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

export function provideTranslateService(
    config: ProvideTranslateServiceConfig = {},
): EnvironmentProviders {
    return makeEnvironmentProviders(defaultProviders(config));
}

export function defaultProviders(
    config: TranslateModuleConfig = {},
    includeStore = true,
): Provider[] {
    const serviceConfig: TranslateServiceConfig = {
        defaultLanguage: config.defaultLanguage,
        extend: config.extend ?? false,
        isolate: config.isolate ?? false,
        useDefaultLang: config.useDefaultLang ?? true,
    };

    const providers: Provider[] = [
        {
            provide: TRANSLATE_SERVICE_CONFIG,
            useValue: serviceConfig,
        },
        {
            provide: TranslateService,
        },
    ];

    if (config.compiler) {
        providers.push(config.compiler);
    }

    if (config.parser) {
        providers.push(config.parser);
    }

    if (config.loader) {
        providers.push(config.loader);
    }

    if (config.missingTranslationHandler) {
        providers.push(config.missingTranslationHandler);
    }

    if (includeStore) {
        providers.push(TranslateStore);
    }

    return providers;
}
