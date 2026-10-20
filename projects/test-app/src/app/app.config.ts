import { provideHttpClient, withXhr } from "@angular/common/http";
import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(withXhr()),
        provideTranslateService({
            langs: ["de", "en"],
            fallbackLang: "en",
            lang: "en",
            loader: provideTranslateHttpLoader({
                enforceLoading: true,
                resources: [
                    { prefix: "./i18n/multiloader/", suffix: ".json" },
                    { prefix: "./i18n/" },
                ],
            }),
        }),
    ],
};
