import { TestBed } from "@angular/core/testing";
import {
    provideTranslateService,
    provideChildTranslateService,
    provideTranslateLoader,
    provideTranslateCompiler,
    provideTranslateParser,
    provideMissingTranslationHandler,
    defaultProviders,
    RootTranslateServiceConfig,
    ChildTranslateServiceConfig,
} from "../lib/translate.providers";
import { Observable, of } from "rxjs";

import {
    TranslateService,
    TRANSLATE_SERVICE_CONFIG,
    TranslationObject,
    InterpolationParameters,
    InterpolatableTranslationObject,
} from "../lib/translate.service";
import { TranslateLoader, TranslateNoOpLoader } from "../lib/translate.loader";
import { TranslateCompiler, TranslateNoOpCompiler } from "../lib/translate.compiler";
import {
    TranslateParser,
    TranslateDefaultParser,
    InterpolateFunction,
} from "../lib/translate.parser";
import {
    MissingTranslationHandler,
    DefaultMissingTranslationHandler,
    MissingTranslationHandlerParams,
} from "../lib/missing-translation-handler";
import { TranslateStore } from "../lib/translate.store";

class TestTranslateLoader extends TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        return of({ [lang]: "test translation" });
    }
}

class TestTranslateCompiler extends TranslateCompiler {
    compile(value: string): string {
        return `compiled: ${value}`;
    }

    compileTranslations(
        translations: TranslationObject,
        lang: string,
    ): InterpolatableTranslationObject {
        return { x: `compiled translations {lang}: ${lang} {x}: ${translations}}` };
    }
}

class TestTranslateParser extends TranslateParser {
    interpolate(expr: InterpolateFunction | string, params?: InterpolationParameters): string {
        return `parsed: ${expr} params=` + JSON.stringify(params);
    }
}

class TestMissingTranslationHandler extends MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams): string {
        return `missing: ${params.key}`;
    }
}

describe("Translate Providers", () => {
    describe("provideTranslateLoader", () => {
        it("should provide TranslateLoader with specified class", () => {
            const provider = provideTranslateLoader(TestTranslateLoader);
            expect(provider.provide).toBe(TranslateLoader);
            expect(provider.useClass).toBe(TestTranslateLoader);
        });
    });

    describe("provideTranslateCompiler", () => {
        it("should provide TranslateCompiler with specified class", () => {
            const provider = provideTranslateCompiler(TestTranslateCompiler);
            expect(provider.provide).toBe(TranslateCompiler);
            expect(provider.useClass).toBe(TestTranslateCompiler);
        });
    });

    describe("provideTranslateParser", () => {
        it("should provide TranslateParser with specified class", () => {
            const provider = provideTranslateParser(TestTranslateParser);
            expect(provider.provide).toBe(TranslateParser);
            expect(provider.useClass).toBe(TestTranslateParser);
        });
    });

    describe("provideMissingTranslationHandler", () => {
        it("should provide MissingTranslationHandler with specified class", () => {
            const provider = provideMissingTranslationHandler(TestMissingTranslationHandler);
            expect(provider.provide).toBe(MissingTranslationHandler);
            expect(provider.useClass).toBe(TestMissingTranslationHandler);
        });
    });

    describe("provideChildTranslateService", () => {
        it("should provide child translate service with default config", () => {
            const providers = provideChildTranslateService();
            expect(providers).toEqual([
                {
                    provide: TRANSLATE_SERVICE_CONFIG,
                    useValue: {
                        fallbackLang: null,
                        lang: undefined,
                        extend: true,
                    },
                },
                {
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
                },
            ]);
        });

        it("should provide child translate service with custom config", () => {
            const config: ChildTranslateServiceConfig = {
                extend: false,
                loader: provideTranslateLoader(TestTranslateLoader),
            };
            const providers = provideChildTranslateService(config);
            expect(providers).toEqual([
                { provide: TranslateLoader, useClass: TestTranslateLoader },
                {
                    provide: TRANSLATE_SERVICE_CONFIG,
                    useValue: {
                        fallbackLang: null,
                        lang: undefined,
                        extend: false,
                    },
                },
                {
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
                },
            ]);
            expect(Array.isArray(providers)).toBe(true);
        });
    });

    describe("provideTranslateService", () => {
        it("should provide translate service with default config", () => {
            const providers = provideTranslateService();
            expect(providers).toEqual([
                { provide: TranslateLoader, useClass: TranslateNoOpLoader },
                { provide: TranslateCompiler, useClass: TranslateNoOpCompiler },
                { provide: TranslateParser, useClass: TranslateDefaultParser },
                { provide: MissingTranslationHandler, useClass: DefaultMissingTranslationHandler },
                TranslateStore,
                {
                    provide: TRANSLATE_SERVICE_CONFIG,
                    useValue: {
                        fallbackLang: null,
                        lang: undefined,
                        extend: false,
                    },
                },
                {
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
                },
            ]);
        });

        it("should provide translate service with custom config", () => {
            const providers = provideTranslateService({
                extend: true,
                loader: provideTranslateLoader(TestTranslateLoader),
                compiler: provideTranslateCompiler(TestTranslateCompiler),
                parser: provideTranslateParser(TestTranslateParser),
                missingTranslationHandler: provideMissingTranslationHandler(
                    TestMissingTranslationHandler,
                ),
            });
            expect(providers).toEqual([
                { provide: TranslateLoader, useClass: TestTranslateLoader },
                { provide: TranslateCompiler, useClass: TestTranslateCompiler },
                { provide: TranslateParser, useClass: TestTranslateParser },
                { provide: MissingTranslationHandler, useClass: TestMissingTranslationHandler },
                TranslateStore,
                {
                    provide: TRANSLATE_SERVICE_CONFIG,
                    useValue: {
                        fallbackLang: null,
                        lang: undefined,
                        extend: true,
                    },
                },
                {
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
                },
            ]);
            expect(Array.isArray(providers)).toBe(true);
        });
    });

    describe("defaultProviders", () => {
        it("should handle default empty config", () => {
            const providers = defaultProviders(undefined, true);
            expect(providers).toBeDefined();
            expect(Array.isArray(providers)).toBe(true);
        });

        it("should handle deprecated useDefaultLang option", () => {
            spyOn(console, "warn");
            const config: RootTranslateServiceConfig = {
                useDefaultLang: true,
                defaultLanguage: "en",
            };
            const providers = defaultProviders(config, true);
            expect(console.warn).toHaveBeenCalledWith(
                "The `useDefaultLang` and `defaultLanguage` options are deprecated. Please use `fallbackLang` instead.",
            );
            expect(providers).toBeDefined();
        });

        it("should handle deprecated defaultLanguage option without useDefaultLang", () => {
            spyOn(console, "warn");
            const config: RootTranslateServiceConfig = {
                defaultLanguage: "en",
            };
            const providers = defaultProviders(config, true);
            expect(console.warn).toHaveBeenCalledWith(
                "The `useDefaultLang` and `defaultLanguage` options are deprecated. Please use `fallbackLang` instead.",
            );
            expect(providers).toBeDefined();
        });

        it("should set fallbackLang when useDefaultLang is true and defaultLanguage is provided", () => {
            spyOn(console, "warn");
            const config: RootTranslateServiceConfig = {
                useDefaultLang: true,
                defaultLanguage: "en",
            };
            const providers = defaultProviders(config, true);
            expect(console.warn).toHaveBeenCalled();

            // Find the service config provider
            const serviceConfigProvider = providers.find(
                (p) => (p as { provide: unknown }).provide === TRANSLATE_SERVICE_CONFIG,
            ) as { useValue?: { fallbackLang: string | null } };
            expect(serviceConfigProvider).toBeDefined();
            expect(serviceConfigProvider?.useValue?.fallbackLang).toBe("en");
        });

        it("should not set fallbackLang when useDefaultLang is false", () => {
            spyOn(console, "warn");
            const config: RootTranslateServiceConfig = {
                useDefaultLang: false,
                defaultLanguage: "en",
            };
            const providers = defaultProviders(config, true);
            expect(console.warn).toHaveBeenCalled();

            // Find the service config provider
            const serviceConfigProvider = providers.find(
                (p) => (p as { provide: unknown }).provide === TRANSLATE_SERVICE_CONFIG,
            ) as { useValue?: { fallbackLang: string | null } };
            expect(serviceConfigProvider).toBeDefined();
            expect(serviceConfigProvider?.useValue?.fallbackLang).toBeNull();
        });
    });

    describe("Integration tests", () => {
        it("should create TranslateService with provideChildTranslateService", () => {
            TestBed.configureTestingModule({
                providers: [provideTranslateService({}), provideChildTranslateService({})],
            });

            const service = TestBed.inject(TranslateService);
            expect(service).toBeTruthy();
        });

        it("should work with all provider functions", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        loader: provideTranslateLoader(TranslateNoOpLoader),
                        compiler: provideTranslateCompiler(TranslateNoOpCompiler),
                        parser: provideTranslateParser(TranslateDefaultParser),
                        missingTranslationHandler: provideMissingTranslationHandler(
                            DefaultMissingTranslationHandler,
                        ),
                    }),
                ],
            });

            const service = TestBed.inject(TranslateService);
            const loader = TestBed.inject(TranslateLoader);
            const compiler = TestBed.inject(TranslateCompiler);
            const parser = TestBed.inject(TranslateParser);
            const handler = TestBed.inject(MissingTranslationHandler);

            expect(service).toBeTruthy();
            expect(loader).toBeInstanceOf(TranslateNoOpLoader);
            expect(compiler).toBeInstanceOf(TranslateNoOpCompiler);
            expect(parser).toBeInstanceOf(TranslateDefaultParser);
            expect(handler).toBeInstanceOf(DefaultMissingTranslationHandler);
        });
    });
});
