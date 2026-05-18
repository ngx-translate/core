import {
    ClassProvider,
    FactoryProvider,
    Provider,
    ProviderToken,
    Type,
    TypeProvider,
} from "@angular/core";
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

/**
 * Provider shape accepted by the four plugin slots on
 * {@link RootTranslateServiceConfig} and {@link ChildTranslateServiceConfig}.
 *
 * Excludes {@link TypeProvider} (a bare class) because a bare class registers
 * under its own token instead of the plugin's DI token, which silently
 * disables the plugin. Use the matching `provideTranslate*` helper to wrap
 * a class, or pass an explicit `{ provide: Token, useClass|useValue|... }`
 * object.
 */
export type TranslateProvider = Exclude<Provider, TypeProvider>;

export interface TranslateProviders {
    loader?: TranslateProvider;
    compiler?: TranslateProvider;
    parser?: TranslateProvider;
    missingTranslationHandler?: TranslateProvider;
}

export type ChildTranslateServiceConfig = Partial<TranslateProviders>;

export interface RootTranslateServiceConfig extends ChildTranslateServiceConfig {
    fallbackLang?: Language;
    lang?: Language;
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
    return defaultProviders({ ...config, isRoot: true });
}

export function provideChildTranslateService(config: ChildTranslateServiceConfig = {}): Provider[] {
    return defaultProviders({ ...config, isRoot: false });
}

interface InternalProvidersConfig extends RootTranslateServiceConfig {
    isRoot: boolean;
}

const BARE_CLASS_HELPER: Record<keyof TranslateProviders, string> = {
    loader: "provideTranslateLoader",
    compiler: "provideTranslateCompiler",
    parser: "provideTranslateParser",
    missingTranslationHandler: "provideMissingTranslationHandler",
};

function isBareClass(value: unknown): boolean {
    return typeof value === "function";
}

function warnIfBareClass(fieldName: keyof TranslateProviders, value: unknown): void {
    if (isBareClass(value)) {
        const className =
            (value as { name?: string }).name && (value as { name: string }).name.length > 0
                ? (value as { name: string }).name
                : "YourClass";
        const helper = BARE_CLASS_HELPER[fieldName];
        console.warn(
            `@ngx-translate/core: "${fieldName}" received a bare class (${className}). ` +
                `It will be ignored. Wrap it: ${fieldName}: ${helper}(${className})`,
        );
    }
}

function defaultProviders(config: InternalProvidersConfig): Provider[] {
    const providers: Provider[] = [];

    const loader: TranslateProvider =
        (config.loader as TranslateProvider | undefined) ??
        provideTranslateLoader(TranslateNoOpLoader);
    const compiler: TranslateProvider =
        (config.compiler as TranslateProvider | undefined) ??
        provideTranslateCompiler(TranslateNoOpCompiler);
    const parser: TranslateProvider =
        (config.parser as TranslateProvider | undefined) ??
        provideTranslateParser(TranslateDefaultParser);
    const missingTranslationHandler: TranslateProvider =
        (config.missingTranslationHandler as TranslateProvider | undefined) ??
        provideMissingTranslationHandler(DefaultMissingTranslationHandler);

    warnIfBareClass("loader", config.loader);
    warnIfBareClass("compiler", config.compiler);
    warnIfBareClass("parser", config.parser);
    warnIfBareClass("missingTranslationHandler", config.missingTranslationHandler);

    providers.push(loader, compiler, parser, missingTranslationHandler);
    providers.push(TranslateStore);

    const serviceConfig: TranslateServiceConfig = {
        fallbackLang: config.fallbackLang ?? null,
        lang: config.lang,
        isRoot: config.isRoot,
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
