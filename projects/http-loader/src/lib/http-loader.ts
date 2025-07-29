import { HttpBackend, HttpClient } from "@angular/common/http";
import { inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { mergeDeep, TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { forkJoin, map, Observable } from "rxjs";

export interface TranslateHttpLoaderResource {
    prefix: string;
    suffix?: string;
}

export interface TranslateHttpLoaderConfig {
    prefix: string;
    suffix: string;
    ressources: (string | TranslateHttpLoaderResource)[];
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
            ressources: [],
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

        if (this.config.ressources.length > 0) {
            const requests = this.config.ressources.map((resource) => {
                let path: string;

                if (typeof resource === "string") path = `${resource}${lang}.json`;
                else path = `${resource.prefix}${lang}${resource.suffix ?? ".json"}`;

                return this.http.get(`${path}${cacheBuster}`);
            }) as Observable<TranslationObject>[];

            return forkJoin(requests).pipe(
                map((response) => response.reduce((acc, curr) => mergeDeep(acc, curr), {})),
            ) as Observable<TranslationObject>;
        }

        return this.http.get<TranslationObject>(
            `${this.config.prefix}${lang}${this.config.suffix}${cacheBuster}`,
        );
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
