import {
    Language,
    TRANSLATE_SERVICE_CONFIG,
    TranslateService,
    TranslateServiceConfig,
} from "./translate.service";
import { ClassProvider, Provider, Type } from "@angular/core";
import { TranslateNoOpLoader, TranslateLoader } from "./translate.loader";
import { TranslateCompiler, TranslateNoOpCompiler } from "./translate.compiler";
import { TranslateDefaultParser, TranslateParser } from "./translate.parser";
import {
    DefaultMissingTranslationHandler,
    MissingTranslationHandler,
} from "./missing-translation-handler";
import { TranslateStore } from "./translate.store";

export interface TranslateProviders {
    loader?: Provider;
    compiler?: Provider;
    parser?: Provider;
    missingTranslationHandler?: Provider;
}

export interface ChildTranslateServiceConfig extends Partial<TranslateProviders> {
    extend?: boolean;
}

export interface RootTranslateServiceConfig extends ChildTranslateServiceConfig {
    fallbackLang?: Language;
    lang?: Language;

    /* @deprecated use `fallbackLang` */
    useDefaultLang?: boolean;
    /* @deprecated use `fallbackLang` */
    defaultLanguage?: Language;
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
        },
        true,
    );
}

export function provideChildTranslateService(config: ChildTranslateServiceConfig = {}): Provider[] {
    return defaultProviders({ extend:true, ...config }, false);
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

    if (config.useDefaultLang || config.defaultLanguage) {
        console.warn(
            "The `useDefaultLang` and `defaultLanguage` options are deprecated. Please use `fallbackLang` instead.",
        );

        if (config.useDefaultLang === true && config.defaultLanguage) {
            config.fallbackLang = config.defaultLanguage;
        }
    }

    const serviceConfig: TranslateServiceConfig = {
        fallbackLang: config.fallbackLang ?? null,
        lang: config.lang,
        extend: config.extend ?? false,
    };

    providers.push({
        provide: TRANSLATE_SERVICE_CONFIG,
        useValue: serviceConfig,
    });

    providers.push({
        provide: TranslateService,
        useClass: TranslateService,
        deps: [
            TranslateStore,
            TranslateLoader,
            TranslateCompiler,
            TranslateParser,
            MissingTranslationHandler,
            TRANSLATE_SERVICE_CONFIG,
        ],
    });

    return providers;
}
