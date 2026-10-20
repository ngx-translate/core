// Artifact-consumability fixture: references the public type surface of the
// packed v22/TS6-built packages so `tsc` must resolve their emitted .d.ts.
// Type-checked under each older TypeScript with skipLibCheck:false — see run.sh.
import {
  ITranslateService,
  provideTranslateService,
  TranslateDirective,
  TranslatePipe,
  TranslateService,
} from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";

export const _p: typeof provideTranslateService = provideTranslateService;
export type _S = TranslateService;
export type _Pipe = TranslatePipe;
export type _Dir = TranslateDirective;
export const _h: typeof provideTranslateHttpLoader = provideTranslateHttpLoader;

// Checks that implementations without the new methods still satisfy ITranslateService.
export function legacyService(
    service: Omit<ITranslateService, "getAsync" | "hasTranslationKey" | "deleteLanguage">,
): ITranslateService {
    return service;
}

// Checks that the new methods are callable through ITranslateService with these arguments.
export function serviceCapabilities(service: ITranslateService) {
    const result = service.getAsync?.(["HELLO"], { name: "Ada" }, "en");
    const exists = service.hasTranslationKey?.("HELLO", "en");
    service.deleteLanguage?.("en");
    return { result, exists };
}
