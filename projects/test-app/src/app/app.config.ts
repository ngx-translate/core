import { provideHttpClient } from "@angular/common/http";
import {
    ApplicationConfig,
    inject,
    provideAppInitializer,
    provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(),
        provideTranslateService({
            loader: provideTranslateHttpLoader({
                prefix: "./i18n/",
                suffix: ".json",
                enforceLoading: true,
            }),
        }),
        provideAppInitializer(() => {
            const translate = inject(TranslateService);
            translate.addLangs(["de", "en"]);
            translate.setFallbackLang("en");
            translate.use("en");
        }),
    ],
};

console.log("appConfig", appConfig);
