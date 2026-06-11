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

/**
 * Provider shape accepted by the four plugin slots on
 * {@link RootTranslateServiceConfig} and {@link ChildTranslateServiceConfig}.
 *
 * Accepts any Angular {@link Provider} — including bare classes (TypeProvider)
 * and bare factory functions. When a bare class or factory is passed, it is
 * automatically wrapped by the corresponding `provideTranslate*` helper so it
 * is registered under the correct DI token.
 */
export type TranslateProvider = Provider | (() => unknown);

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
    // for declarations, "class" is followed by \s: class Foo {...
    // for expressions, "class" can be unnamed and followed by {: foo = class{...
    return /^class[{\s]/.test(Function.prototype.toString.call(fn));
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

/**
 * Resolves a plugin slot to a concrete Angular provider.
 *
 * - If `value` is `undefined`, the default class is wrapped with `toProvider`.
 * - If `value` is a function (bare class or bare factory), it is auto-wrapped
 *   via `toProvider`, which uses `isClass` to pick `useClass` vs `useFactory`.
 *   A bare class additionally triggers a one-line `console.warn` nudging the
 *   caller toward the explicit `provideTranslate*` helper. Bare factories
 *   pass through silently — they are the documented compact form.
 * - Otherwise `value` is already a proper Provider object and is passed through.
 */
function resolvePluginProvider<T>(
    token: ProviderToken<T>,
    value: TranslateProvider | undefined,
    defaultClass: Type<T>,
    fieldName: keyof TranslateProviders,
    helperName: string,
): Provider {
    if (value === undefined) return toProvider(token, defaultClass);
    if (typeof value === "function") {
        if (isClass(value as Type<T> | (() => T))) {
            const className = (value as { name?: string }).name || "YourClass";
            console.warn(
                `@ngx-translate/core: "${fieldName}" received a bare class (${className}); ` +
                    `auto-wrapping with ${helperName}(). For clarity, prefer ` +
                    `${fieldName}: ${helperName}(${className}).`,
            );
        }
        return toProvider(token, value as Type<T> | (() => T));
    }
    return value as Provider;
}

function defaultProviders(config: InternalProvidersConfig): Provider[] {
    const providers: Provider[] = [];

    const loader = resolvePluginProvider(
        TranslateLoader,
        config.loader,
        TranslateNoOpLoader,
        "loader",
        "provideTranslateLoader",
    );
    const compiler = resolvePluginProvider(
        TranslateCompiler,
        config.compiler,
        TranslateNoOpCompiler,
        "compiler",
        "provideTranslateCompiler",
    );
    const parser = resolvePluginProvider(
        TranslateParser,
        config.parser,
        TranslateDefaultParser,
        "parser",
        "provideTranslateParser",
    );
    const missingTranslationHandler = resolvePluginProvider(
        MissingTranslationHandler,
        config.missingTranslationHandler,
        DefaultMissingTranslationHandler,
        "missingTranslationHandler",
        "provideMissingTranslationHandler",
    );

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
