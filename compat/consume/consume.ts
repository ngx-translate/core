// Artifact-consumability fixture: references the public type surface of the
// packed v22/TS6-built packages so `tsc` must resolve their emitted .d.ts.
// Type-checked under each older TypeScript with skipLibCheck:false — see run.sh.
import {
    provideTranslateService,
    TranslateService,
    ITranslateService,
    TranslatePipe,
    TranslateDirective,
} from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";

export const _p: typeof provideTranslateService = provideTranslateService;
export type _S = TranslateService;
export type _Pipe = TranslatePipe;
export type _Dir = TranslateDirective;
export const _h: typeof provideTranslateHttpLoader = provideTranslateHttpLoader;

// Existing v18.0 implementations need not acquire the v18.1 capabilities.
export function _legacyService(
    service: Omit<ITranslateService, "getAsync" | "hasTranslationKey" | "deleteLanguage">,
): ITranslateService {
    return service;
}

export function _serviceCapabilities(service: ITranslateService) {
    const result = service.getAsync?.(["HELLO"], { name: "Ada" }, "en");
    const exists = service.hasTranslationKey?.("HELLO", "en");
    service.deleteLanguage?.("en");
    return { result, exists };
}
