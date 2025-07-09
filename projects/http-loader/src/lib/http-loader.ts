import { HttpBackend, HttpClient } from "@angular/common/http";
import { inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { Observable } from "rxjs";

export interface TranslateHttpLoaderConfig {
    prefix: string;
    suffix: string;
    enforceLoading: boolean;
    useHttpBackend: boolean;
}

export const TRANSLATE_HTTP_LOADER_CONFIG = new InjectionToken<Partial<TranslateHttpLoaderConfig>>(
    "TRANSLATE_HTTP_LOADER_CONFIG",
);

@Injectable()
export class TranslateHttpLoader implements TranslateLoader {
    private http: HttpClient;
    private config: TranslateHttpLoaderConfig;

    constructor() {
        this.config = {
            prefix: "/assets/i18n/",
            suffix: ".json",
            enforceLoading: false,
            useHttpBackend: false,
            ...inject(TRANSLATE_HTTP_LOADER_CONFIG),
        };

        this.http = this.config.useHttpBackend
            ? new HttpClient(inject(HttpBackend))
            : inject(HttpClient);
    }

    /**
     * Gets the translations from the server
     */
    public getTranslation(lang: string): Observable<TranslationObject> {
        const cacheBuster = this.config.enforceLoading ? `?enforceLoading=${Date.now()}` : "";

        return this.http.get(
            `${this.config.prefix}${lang}${this.config.suffix}${cacheBuster}`,
        ) as Observable<TranslationObject>;
    }
}

export function provideTranslateHttpLoader(
    config: Partial<TranslateHttpLoaderConfig> = {},
): Provider[] {
    const useBackend = config.useHttpBackend ?? false;

    return [
        {
            provide: TRANSLATE_HTTP_LOADER_CONFIG,
            useValue: config,
        },
        {
            provide: TranslateLoader,
            useClass: TranslateHttpLoader,
            deps: [useBackend ? HttpBackend : HttpClient, TRANSLATE_HTTP_LOADER_CONFIG],
        },
    ];
}
