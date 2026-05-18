import { HttpBackend, HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { mergeDeep, TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { catchError, forkJoin, map, Observable, of } from "rxjs";

export interface TranslateHttpLoaderConfig {
    prefix?: string;
    suffix?: string;
    enforceLoading: boolean;
    useHttpBackend: boolean;
    /**
     * If true, a failed HTTP fetch (e.g. 404) propagates the error and fails
     * the whole language load (v17 behaviour). If false (default), each
     * resource failure is caught and replaced with an empty object, with a
     * `console.warn` per failure; remaining resources still contribute their
     * keys. Set this to `true` if you want deploys to fail loudly on a
     * missing translation file rather than serve partial translations.
     */
    failOnError?: boolean;
}

export interface TranslateHttpLoaderResource {
    prefix: string;
    suffix?: string;
}

export interface TranslateMultiHttpLoaderConfig {
    resources: (string | TranslateHttpLoaderResource)[];
    enforceLoading: boolean;
    useHttpBackend: boolean;
    /** See {@link TranslateHttpLoaderConfig.failOnError}. */
    failOnError?: boolean;
}

export const TRANSLATE_HTTP_LOADER_CONFIG = new InjectionToken<
    Partial<TranslateMultiHttpLoaderConfig>
>("TRANSLATE_HTTP_LOADER_CONFIG");

@Injectable()
export class TranslateHttpLoader implements TranslateLoader {
    private http: HttpClient;
    private config: TranslateMultiHttpLoaderConfig;

    constructor() {
        this.config = {
            resources: [],
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

        const requests = this.config.resources.map((resource) => {
            const path =  (typeof resource === "string")
                        ? `${resource}${lang}.json`
                        : `${resource.prefix}${lang}${resource.suffix ?? ".json"}`;

            const request$ = this.http.get<TranslationObject>(`${path}${cacheBuster}`);

            if (this.config.failOnError) {
                return request$;
            }

            return request$.pipe(
                catchError((err: HttpErrorResponse) => {
                    console.warn(`@ngx-translate/http-loader: error loading translation for ${lang}:`, err);
                    return of({});
                }),
            );
        });

        if (requests.length === 0) {
            return of({});
        }

        return forkJoin(requests).pipe(
            map((response) => response.reduce((acc, curr) => mergeDeep(acc, curr), {})),
        ) as Observable<TranslationObject>;
    }
}

export function provideTranslateHttpLoader(
    config: Partial<TranslateHttpLoaderConfig | TranslateMultiHttpLoaderConfig> = {},
): Provider[] {
    // If config already has resources, it's a multi-config, pass it through
    if ("resources" in config && config.resources) {
        return provideTranslateMultiHttpLoader(config as Partial<TranslateMultiHttpLoaderConfig>);
    }

    // Otherwise, convert single config to multi-config
    const singleConfig = config as Partial<TranslateHttpLoaderConfig>;
    const multiConfig: Partial<TranslateMultiHttpLoaderConfig> = {
        enforceLoading: singleConfig.enforceLoading ?? false,
        useHttpBackend: singleConfig.useHttpBackend ?? false,
        failOnError: singleConfig.failOnError ?? false,
        resources: [
            {
                prefix: singleConfig.prefix ?? "/assets/i18n/",
                suffix: singleConfig.suffix ?? ".json",
            },
        ],
    };

    return provideTranslateMultiHttpLoader(multiConfig);
}

export function provideTranslateMultiHttpLoader(
    config: Partial<TranslateMultiHttpLoaderConfig> = {},
): Provider[] {
    return [
        {
            provide: TRANSLATE_HTTP_LOADER_CONFIG,
            useValue: {
                resources: ["/assets/i18n/"],
                ...config,
            },
        },
        {
            provide: TranslateLoader,
            useClass: TranslateHttpLoader,
        },
    ];
}
