export * from "./lib/extraction-marker";
export { translate, injectTranslateService } from "./lib/translate.function";
export * from "./lib/translate-block.directive";
export * from "./lib/missing-translation-handler";
export * from "./lib/translate.compiler";
export * from "./lib/translate.directive";
export * from "./lib/translate.loader";
export * from "./lib/translate.parser";
export * from "./lib/translate.pipe";
export * from "./lib/translate.service";
export * from "./lib/translate.store";
export {
    provideTranslateService,
    provideChildTranslateService,
    provideTranslateLoader,
    provideTranslateCompiler,
    provideTranslateParser,
    provideMissingTranslationHandler,
} from "./lib/translate.providers";
export type {
    RootTranslateServiceConfig,
    ChildTranslateServiceConfig,
    TranslateProviders,
    TranslateProvider,
} from "./lib/translate.providers";
export * from "./lib/util";
export { ITranslateService } from "./lib/translate.service.interface";
export type { FallbackLangChangeEvent } from "./lib/translate.service.interface";
export type { LangChangeEvent } from "./lib/translate.service.interface";
export type { TranslationChangeEvent } from "./lib/translate.service.interface";
export type { Language } from "./lib/translate.service.interface";
export type { InterpolatableTranslationObject } from "./lib/translate.service.interface";
export type { InterpolatableTranslation } from "./lib/translate.service.interface";
export type { TranslationObject } from "./lib/translate.service.interface";
export type { Translation } from "./lib/translate.service.interface";
export type { StrictTranslation } from "./lib/translate.service.interface";
export type { InterpolationParameters } from "./lib/translate.service.interface";
export type { NgxTranslateConfig } from "./lib/translate.service.interface";
export type { TranslationKey } from "./lib/translate.service.interface";
export type { DeepKeys } from "./lib/translate.service.interface";
