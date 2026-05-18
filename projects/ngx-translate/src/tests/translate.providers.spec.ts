import { FactoryProvider, InjectionToken, inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
    provideTranslateService,
    provideChildTranslateService,
    provideTranslateLoader,
    provideTranslateCompiler,
    provideTranslateParser,
    provideMissingTranslationHandler,
    ChildTranslateServiceConfig,
} from "../lib/translate.providers";
import { Observable, of } from "rxjs";

import {
    TranslateService,
    TRANSLATE_SERVICE_CONFIG,
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
import {
    InterpolatableTranslationObject,
    InterpolationParameters,
    TranslationObject,
} from "../lib/translate.service.interface";

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

const TEST_PREFIX_TOKEN = new InjectionToken<string>("TEST_PREFIX_TOKEN");

class FactoryTestLoader extends TranslateLoader {
    constructor(public readonly prefix: string) {
        super();
    }
    getTranslation(lang: string): Observable<TranslationObject> {
        return of({ [lang]: `${this.prefix}-${lang}` });
    }
}

class FactoryTestCompiler extends TranslateCompiler {
    constructor(public readonly prefix: string) {
        super();
    }
    compile(value: string): string {
        return `${this.prefix}:${value}`;
    }
    compileTranslations(
        translations: TranslationObject,
        lang: string,
    ): InterpolatableTranslationObject {
        void lang;
        return translations as InterpolatableTranslationObject;
    }
}

class FactoryTestParser extends TranslateParser {
    constructor(public readonly prefix: string) {
        super();
    }
    interpolate(expr: InterpolateFunction | string, params?: InterpolationParameters): string {
        void params;
        return `${this.prefix}:${expr}`;
    }
}

class FactoryTestMissingHandler extends MissingTranslationHandler {
    constructor(public readonly prefix: string) {
        super();
    }
    handle(params: MissingTranslationHandlerParams): string {
        return `${this.prefix}:${params.key}`;
    }
}

describe("Translate Providers", () => {
    describe("provideTranslateLoader", () => {
        it("should provide TranslateLoader with specified class", () => {
            const provider = provideTranslateLoader(TestTranslateLoader);
            expect(provider.provide).toBe(TranslateLoader);
            expect(provider.useClass).toBe(TestTranslateLoader);
        });

        it("should produce a FactoryProvider when given a zero-arg factory", () => {
            const factory = () => new FactoryTestLoader("static");
            const provider = provideTranslateLoader(factory) as FactoryProvider;
            expect(provider.provide).toBe(TranslateLoader);
            expect(provider.useFactory).toBe(factory);
        });

        it("factory form produces a working loader when injected via TestBed", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        loader: provideTranslateLoader(() => new FactoryTestLoader("static")),
                    }),
                ],
            });
            const loader = TestBed.inject(TranslateLoader);
            expect(loader).toBeInstanceOf(FactoryTestLoader);
            expect((loader as FactoryTestLoader).prefix).toBe("static");
        });

        it("factory can use inject() to pull a DI dependency", () => {
            TestBed.configureTestingModule({
                providers: [
                    { provide: TEST_PREFIX_TOKEN, useValue: "from-di" },
                    provideTranslateService({
                        loader: provideTranslateLoader(
                            () => new FactoryTestLoader(inject(TEST_PREFIX_TOKEN)),
                        ),
                    }),
                ],
            });
            const loader = TestBed.inject(TranslateLoader);
            expect(loader).toBeInstanceOf(FactoryTestLoader);
            expect((loader as FactoryTestLoader).prefix).toBe("from-di");
        });
    });

    describe("provideTranslateCompiler", () => {
        it("should provide TranslateCompiler with specified class", () => {
            const provider = provideTranslateCompiler(TestTranslateCompiler);
            expect(provider.provide).toBe(TranslateCompiler);
            expect(provider.useClass).toBe(TestTranslateCompiler);
        });

        it("should produce a FactoryProvider when given a zero-arg factory", () => {
            const factory = () => new FactoryTestCompiler("static");
            const provider = provideTranslateCompiler(factory) as FactoryProvider;
            expect(provider.provide).toBe(TranslateCompiler);
            expect(provider.useFactory).toBe(factory);
        });

        it("factory form produces a working compiler when injected via TestBed", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        compiler: provideTranslateCompiler(() => new FactoryTestCompiler("static")),
                    }),
                ],
            });
            const compiler = TestBed.inject(TranslateCompiler);
            expect(compiler).toBeInstanceOf(FactoryTestCompiler);
            expect((compiler as FactoryTestCompiler).prefix).toBe("static");
        });

        it("factory can use inject() to pull a DI dependency", () => {
            TestBed.configureTestingModule({
                providers: [
                    { provide: TEST_PREFIX_TOKEN, useValue: "from-di" },
                    provideTranslateService({
                        compiler: provideTranslateCompiler(
                            () => new FactoryTestCompiler(inject(TEST_PREFIX_TOKEN)),
                        ),
                    }),
                ],
            });
            const compiler = TestBed.inject(TranslateCompiler);
            expect(compiler).toBeInstanceOf(FactoryTestCompiler);
            expect((compiler as FactoryTestCompiler).prefix).toBe("from-di");
        });
    });

    describe("provideTranslateParser", () => {
        it("should provide TranslateParser with specified class", () => {
            const provider = provideTranslateParser(TestTranslateParser);
            expect(provider.provide).toBe(TranslateParser);
            expect(provider.useClass).toBe(TestTranslateParser);
        });

        it("should produce a FactoryProvider when given a zero-arg factory", () => {
            const factory = () => new FactoryTestParser("static");
            const provider = provideTranslateParser(factory) as FactoryProvider;
            expect(provider.provide).toBe(TranslateParser);
            expect(provider.useFactory).toBe(factory);
        });

        it("factory form produces a working parser when injected via TestBed", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        parser: provideTranslateParser(() => new FactoryTestParser("static")),
                    }),
                ],
            });
            const parser = TestBed.inject(TranslateParser);
            expect(parser).toBeInstanceOf(FactoryTestParser);
            expect((parser as FactoryTestParser).prefix).toBe("static");
        });

        it("factory can use inject() to pull a DI dependency", () => {
            TestBed.configureTestingModule({
                providers: [
                    { provide: TEST_PREFIX_TOKEN, useValue: "from-di" },
                    provideTranslateService({
                        parser: provideTranslateParser(
                            () => new FactoryTestParser(inject(TEST_PREFIX_TOKEN)),
                        ),
                    }),
                ],
            });
            const parser = TestBed.inject(TranslateParser);
            expect(parser).toBeInstanceOf(FactoryTestParser);
            expect((parser as FactoryTestParser).prefix).toBe("from-di");
        });
    });

    describe("provideMissingTranslationHandler", () => {
        it("should provide MissingTranslationHandler with specified class", () => {
            const provider = provideMissingTranslationHandler(TestMissingTranslationHandler);
            expect(provider.provide).toBe(MissingTranslationHandler);
            expect(provider.useClass).toBe(TestMissingTranslationHandler);
        });

        it("should produce a FactoryProvider when given a zero-arg factory", () => {
            const factory = () => new FactoryTestMissingHandler("static");
            const provider = provideMissingTranslationHandler(factory) as FactoryProvider;
            expect(provider.provide).toBe(MissingTranslationHandler);
            expect(provider.useFactory).toBe(factory);
        });

        it("factory form produces a working handler when injected via TestBed", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        missingTranslationHandler: provideMissingTranslationHandler(
                            () => new FactoryTestMissingHandler("static"),
                        ),
                    }),
                ],
            });
            const handler = TestBed.inject(MissingTranslationHandler);
            expect(handler).toBeInstanceOf(FactoryTestMissingHandler);
            expect((handler as FactoryTestMissingHandler).prefix).toBe("static");
        });

        it("factory can use inject() to pull a DI dependency", () => {
            TestBed.configureTestingModule({
                providers: [
                    { provide: TEST_PREFIX_TOKEN, useValue: "from-di" },
                    provideTranslateService({
                        missingTranslationHandler: provideMissingTranslationHandler(
                            () => new FactoryTestMissingHandler(inject(TEST_PREFIX_TOKEN)),
                        ),
                    }),
                ],
            });
            const handler = TestBed.inject(MissingTranslationHandler);
            expect(handler).toBeInstanceOf(FactoryTestMissingHandler);
            expect((handler as FactoryTestMissingHandler).prefix).toBe("from-di");
        });
    });

    describe("provideChildTranslateService", () => {
        it("should provide child translate service with default config", () => {
            const providers = provideChildTranslateService();
            expect(providers).toEqual([
                { provide: TranslateLoader, useClass: TranslateNoOpLoader },
                { provide: TranslateCompiler, useClass: TranslateNoOpCompiler },
                { provide: TranslateParser, useClass: TranslateDefaultParser },
                {
                    provide: MissingTranslationHandler,
                    useClass: DefaultMissingTranslationHandler,
                },
                TranslateStore,
                {
                    provide: TRANSLATE_SERVICE_CONFIG,
                    useValue: {
                        fallbackLang: null,
                        lang: undefined,
                        isRoot: false,
                    },
                },
                {
                    provide: TranslateService,
                    useClass: TranslateService,
                },
            ]);
        });

        it("should provide child translate service with custom config", () => {
            const config: ChildTranslateServiceConfig = {
                loader: provideTranslateLoader(TestTranslateLoader),
            };
            const providers = provideChildTranslateService(config);
            expect(providers).toEqual([
                { provide: TranslateLoader, useClass: TestTranslateLoader },
                { provide: TranslateCompiler, useClass: TranslateNoOpCompiler },
                { provide: TranslateParser, useClass: TranslateDefaultParser },
                {
                    provide: MissingTranslationHandler,
                    useClass: DefaultMissingTranslationHandler,
                },
                TranslateStore,
                {
                    provide: TRANSLATE_SERVICE_CONFIG,
                    useValue: {
                        fallbackLang: null,
                        lang: undefined,
                        isRoot: false,
                    },
                },
                {
                    provide: TranslateService,
                    useClass: TranslateService,
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
                        isRoot: true,
                    },
                },
                {
                    provide: TranslateService,
                    useClass: TranslateService,
                },
            ]);
        });

        it("should provide translate service with custom config", () => {
            const providers = provideTranslateService({
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
                        isRoot: true,
                    },
                },
                {
                    provide: TranslateService,
                    useClass: TranslateService,
                },
            ]);
            expect(Array.isArray(providers)).toBe(true);
        });
    });

    describe("bare-class auto-wrap", () => {
        // Bare classes (TypeProvider) passed to plugin slots are automatically
        // wrapped by the corresponding provideTranslate* helper, registering
        // them under the correct DI token. No warning is emitted.

        class BareLoader extends TranslateLoader {
            getTranslation(lang: string): Observable<TranslationObject> {
                return of({ [lang]: "bare-loader" });
            }
        }
        class BareCompiler extends TranslateCompiler {
            compile(value: string): string {
                return value;
            }
            compileTranslations(
                translations: TranslationObject,
            ): InterpolatableTranslationObject {
                return translations as InterpolatableTranslationObject;
            }
        }
        class BareParser extends TranslateParser {
            interpolate(expr: InterpolateFunction | string): string {
                return `bare:${String(expr)}`;
            }
        }
        class BareHandler extends MissingTranslationHandler {
            handle(params: MissingTranslationHandlerParams): string {
                return `bare-missing:${params.key}`;
            }
        }

        it("auto-wraps a bare loader class to the TranslateLoader token", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({ loader: BareLoader }),
                ],
            });
            const loader = TestBed.inject(TranslateLoader);
            expect(loader).toBeInstanceOf(BareLoader);
        });

        it("bare loader class resolves to useClass provider in the array", () => {
            const providers = provideTranslateService({ loader: BareLoader });
            expect(providers[0]).toEqual({ provide: TranslateLoader, useClass: BareLoader });
        });

        it("auto-wraps a bare compiler class to the TranslateCompiler token", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({ compiler: BareCompiler }),
                ],
            });
            const compiler = TestBed.inject(TranslateCompiler);
            expect(compiler).toBeInstanceOf(BareCompiler);
        });

        it("auto-wraps a bare parser class to the TranslateParser token", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({ parser: BareParser }),
                ],
            });
            const parser = TestBed.inject(TranslateParser);
            expect(parser).toBeInstanceOf(BareParser);
        });

        it("auto-wraps a bare missingTranslationHandler class to the MissingTranslationHandler token", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideChildTranslateService({ missingTranslationHandler: BareHandler }),
                ],
            });
            const handler = TestBed.inject(MissingTranslationHandler);
            expect(handler).toBeInstanceOf(BareHandler);
        });

        it("auto-wraps a bare factory function for any plugin slot", () => {
            const factory = () => new BareLoader();
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({ loader: factory }),
                ],
            });
            const loader = TestBed.inject(TranslateLoader);
            expect(loader).toBeInstanceOf(BareLoader);
        });

        it("explicit provideTranslateLoader(SomeClass) wrap still works (regression guard)", () => {
            TestBed.configureTestingModule({
                providers: [
                    provideTranslateService({
                        loader: provideTranslateLoader(BareLoader),
                    }),
                ],
            });
            const loader = TestBed.inject(TranslateLoader);
            expect(loader).toBeInstanceOf(BareLoader);
        });

        it("does not emit a console warning for bare classes", () => {
            const warnSpy = spyOn(console, "warn");
            provideTranslateService({ loader: BareLoader });
            provideTranslateService({ compiler: BareCompiler });
            provideTranslateService({ parser: BareParser });
            provideChildTranslateService({ missingTranslationHandler: BareHandler });
            expect(warnSpy).not.toHaveBeenCalled();
        });

        it("does not emit a console warning when fields are omitted (defaults used)", () => {
            const warnSpy = spyOn(console, "warn");
            provideTranslateService();
            provideChildTranslateService();
            expect(warnSpy).not.toHaveBeenCalled();
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
