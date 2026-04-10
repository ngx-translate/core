import { ClassProvider, FactoryProvider, Provider, ProviderToken, Type } from "@angular/core";
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

function isClass<T>(fn: Type<T> | (() => T)): fn is Type<T> {
    return /^class\s/.test(Function.prototype.toString.call(fn));
}

function toProvider<T>(
    token: ProviderToken<T>,
    value: Type<T> | (() => T),
): ClassProvider | FactoryProvider {
    return isClass(value)
        ? { provide: token, useClass: value }
        : { provide: token, useFactory: value };
}

export function provideTranslateLoader(loader: Type<TranslateLoader>): ClassProvider;
export function provideTranslateLoader(factory: () => TranslateLoader): FactoryProvider;
export function provideTranslateLoader(
    loaderOrFactory: Type<TranslateLoader> | (() => TranslateLoader),
): ClassProvider | FactoryProvider {
    return toProvider(TranslateLoader, loaderOrFactory);
}

export function provideTranslateCompiler(compiler: Type<TranslateCompiler>): ClassProvider;
export function provideTranslateCompiler(factory: () => TranslateCompiler): FactoryProvider;
export function provideTranslateCompiler(
    compilerOrFactory: Type<TranslateCompiler> | (() => TranslateCompiler),
): ClassProvider | FactoryProvider {
    return toProvider(TranslateCompiler, compilerOrFactory);
}

export function provideTranslateParser(parser: Type<TranslateParser>): ClassProvider;
export function provideTranslateParser(factory: () => TranslateParser): FactoryProvider;
export function provideTranslateParser(
    parserOrFactory: Type<TranslateParser> | (() => TranslateParser),
): ClassProvider | FactoryProvider {
    return toProvider(TranslateParser, parserOrFactory);
}

export function provideMissingTranslationHandler(
    handler: Type<MissingTranslationHandler>,
): ClassProvider;
export function provideMissingTranslationHandler(
    factory: () => MissingTranslationHandler,
): FactoryProvider;
export function provideMissingTranslationHandler(
    handlerOrFactory: Type<MissingTranslationHandler> | (() => MissingTranslationHandler),
): ClassProvider | FactoryProvider {
    return toProvider(MissingTranslationHandler, handlerOrFactory);
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
