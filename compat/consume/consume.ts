// Artifact-consumability fixture: references the public type surface of the
// packed v22/TS6-built packages so `tsc` must resolve their emitted .d.ts.
// Type-checked under each older TypeScript with skipLibCheck:false — see run.sh.
import {
    ITranslateService,
    provideChildTranslateService,
    provideTranslateService,
    TranslateDirective,
    TranslatePipe,
    TranslateRetryConfig,
    TranslateService,
    TranslateSlotDirective,
    TranslateSlotsComponent,
} from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";

export const fallbackChain = provideTranslateService({ fallbackLangs: ["fr", "en"] as const });

export const _p: typeof provideTranslateService = provideTranslateService;
export type _S = TranslateService;
export type _Pipe = TranslatePipe;
export type _Dir = TranslateDirective;
export type _Slots = TranslateSlotsComponent;
export type _Slot = TranslateSlotDirective;
export const _h: typeof provideTranslateHttpLoader = provideTranslateHttpLoader;

export const retryPolicy: TranslateRetryConfig = {
    count: 2,
    delay: (_error, retryAttempt) => 250 * 2 ** (retryAttempt - 1),
    shouldRetry: (error) => error instanceof Error,
};
export const retryProviders = [
    provideTranslateService({ retry: retryPolicy }),
    provideChildTranslateService({ retry: { count: 1, delay: 500 } }),
    provideTranslateService({ retry: 2 }),
];

provideTranslateService({
    // @ts-expect-error Retry delays must be numbers, not strings.
    retry: { count: 1, delay: "250" },
});
provideTranslateService({
    // @ts-expect-error Retry delay callbacks must return numbers.
    retry: { count: 1, delay: () => "250" },
});

export const flattenLoader = provideTranslateHttpLoader({
    resources: ["/library/", "/application/"],
    flatten: true,
});

export const reportingLoader = provideTranslateHttpLoader({
    onLoadError: ({ lang, resource, url, error }) => {
        const requestUrl: string | undefined = url;
        const prefix: string = typeof resource === "string" ? resource : resource.prefix;
        console.warn(lang, prefix, requestUrl, error);
    },
});

// Checks that implementations without the new methods still satisfy ITranslateService.
export function legacyService(
    service: Omit<
        ITranslateService,
        | "getAsync"
        | "hasTranslationKey"
        | "deleteLanguage"
        | "setFallbackLangs"
        | "getFallbackLangs"
        | "fallbackLangs"
    >,
): ITranslateService {
    return service;
}

// Checks that the new methods are callable through ITranslateService with these arguments.
export function serviceCapabilities(service: ITranslateService) {
    service.setFallbackLangs?.(["fr", "en"]);
    const fallbacks: readonly string[] | undefined = service.getFallbackLangs?.();
    const reactiveFallbacks: readonly string[] | undefined = service.fallbackLangs?.();
    void [fallbacks, reactiveFallbacks];
    const result = service.getAsync?.(["HELLO"], { name: "Ada" }, "en");
    const exists = service.hasTranslationKey?.("HELLO", "en");
    service.deleteLanguage?.("en");
    return { result, exists };
}
