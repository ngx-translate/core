import { ClassProvider, Provider, Type } from "@angular/core";
import {
    DefaultMissingTranslationHandler,
    MissingTranslationHandler,
} from "./missing-translation-handler";
import { TranslateCompiler, TranslateNoOpCompiler } from "./translate.compiler";
import { TranslateLoader, TranslateNoOpLoader } from "./translate.loader";
import { TranslateDefaultParser, TranslateParser } from "./translate.parser";
import {
    TRANSLATE_SERVICE_CONFIG,
    TranslateService,
    TranslateServiceConfig,
} from "./translate.service";
import { TranslateStore } from "./translate.store";
import { Language } from "./translate.service.interface";

export interface TranslateProviders {
    loader?: Provider;
    compiler?: Provider;
    parser?: Provider;
    missingTranslationHandler?: Provider;
}

export type ChildTranslateServiceConfig = Partial<TranslateProviders>;

export interface RootTranslateServiceConfig extends ChildTranslateServiceConfig {
    fallbackLang?: Language;
    lang?: Language;
    isRoot?: boolean;

}

export function provideTranslateLoader(loader: Type<TranslateLoader>): ClassProvider {
    return { provide: TranslateLoader, useClass: loader };
}

export function provideTranslateCompiler(compiler: Type<TranslateCompiler>): ClassProvider {
    return { provide: TranslateCompiler, useClass: compiler };
}

export function provideTranslateParser(parser: Type<TranslateParser>): ClassProvider {
    return { provide: TranslateParser, useClass: parser };
}

export function provideMissingTranslationHandler(
    handler: Type<MissingTranslationHandler>,
): ClassProvider {
    return { provide: MissingTranslationHandler, useClass: handler };
}

export function provideTranslateService(config: RootTranslateServiceConfig = {}): Provider[] {
    return defaultProviders(
        {
            compiler: provideTranslateCompiler(TranslateNoOpCompiler),
            parser: provideTranslateParser(TranslateDefaultParser),
            loader: provideTranslateLoader(TranslateNoOpLoader),
            missingTranslationHandler: provideMissingTranslationHandler(
                DefaultMissingTranslationHandler,
            ),
            ...config,
            isRoot: true,
        },
        true,
    );
}

export function provideChildTranslateService(config: ChildTranslateServiceConfig = {}): Provider[] {
    return defaultProviders(
        {
            compiler: provideTranslateCompiler(TranslateNoOpCompiler),
            parser: provideTranslateParser(TranslateDefaultParser),
            loader: provideTranslateLoader(TranslateNoOpLoader),
            missingTranslationHandler: provideMissingTranslationHandler(
                DefaultMissingTranslationHandler,
            ),
            ...config,
            isRoot: false,
        },
        true,
    );
}

export function defaultProviders(
    config: RootTranslateServiceConfig = {},
    provideStore: boolean,
): Provider[] {
    const providers: Provider[] = [];

    if (config.loader) {
        providers.push(config.loader);
    }
    if (config.compiler) {
        providers.push(config.compiler);
    }
    if (config.parser) {
        providers.push(config.parser);
    }
    if (config.missingTranslationHandler) {
        providers.push(config.missingTranslationHandler);
    }

    if (provideStore) {
        providers.push(TranslateStore);
    }

    const serviceConfig: TranslateServiceConfig = {
        fallbackLang: config.fallbackLang ?? null,
        lang: config.lang,
        isRoot: config.isRoot ?? false,
    };

    providers.push({
        provide: TRANSLATE_SERVICE_CONFIG,
        useValue: serviceConfig,
    });

    providers.push({
        provide: TranslateService,
        useClass: TranslateService,
    });

    return providers;
}
