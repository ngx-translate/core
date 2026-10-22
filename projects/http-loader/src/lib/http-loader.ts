import { HttpBackend, HttpClient } from "@angular/common/http";
import { inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { mergeDeep, TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { catchError, defer, forkJoin, map, Observable, of, throwError } from "rxjs";

// Browsers resolve "." and ".." as path navigation even though they contain nothing to encode.
const DOT_SEGMENT = /^\.{1,2}$/;

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
     * Must be `true` for the translation service's `retry` option to retry HTTP failures.
     */
    failOnError?: boolean;
    /**
     * Flatten each resource's nested objects into dotted keys before merging (default false).
     * Later resources then override equivalent flat or nested keys. Arrays and null stay intact.
     * Within one resource, the last encountered equivalent key wins.
     */
    flatten?: boolean;
    /**
     * Reports each failed resource attempt instead of the loader's default warning.
     * Called in both failure modes; failOnError still controls error propagation.
     * Exceptions from this callback are warned about without replacing the loading error.
     * Does not suppress separate TranslateService warnings after a terminal loading failure.
     */
    onLoadError?: (failure: TranslateHttpLoaderError) => void;
}

export interface TranslateHttpLoaderResource {
    prefix: string;
    suffix?: string;
}

export interface TranslateHttpLoaderError {
    lang: string;
    resource: string | TranslateHttpLoaderResource;
    /** The request URL, or undefined if language encoding failed before URL construction. */
    url: string | undefined;
    error: unknown;
}

export interface TranslateMultiHttpLoaderConfig {
    resources: (string | TranslateHttpLoaderResource)[];
    enforceLoading: boolean;
    useHttpBackend: boolean;
    /** See {@link TranslateHttpLoaderConfig.failOnError}. */
    failOnError?: boolean;
    /** See {@link TranslateHttpLoaderConfig.flatten}. */
    flatten?: boolean;
    /** See {@link TranslateHttpLoaderConfig.onLoadError}. */
    onLoadError?: (failure: TranslateHttpLoaderError) => void;
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
            let url: string | undefined;
            const request$ = defer(() => {
                // The language may come from a route or query parameter. Encoding it keeps it a
                // single path segment, so it cannot escape the prefix, drop the suffix, or change
                // the origin of the request.
                const langSegment = encodeURIComponent(lang);
                const path =
                    typeof resource === "string"
                        ? `${resource}${langSegment}.json`
                        : `${resource.prefix}${langSegment}${resource.suffix ?? ".json"}`;
                url = `${path}${cacheBuster}`;

                return DOT_SEGMENT.test(lang)
                    ? throwError(() => new Error(`"${lang}" is a path segment, not a language`))
                    : this.http.get<TranslationObject>(url);
            });

            return request$.pipe(
                catchError((error: unknown) => {
                    this.reportError({ lang, resource, url, error });
                    return this.config.failOnError ? throwError(() => error) : of({});
                }),
            );
        });

        if (requests.length === 0) {
            return of({});
        }

        return forkJoin(requests).pipe(
            map((response) =>
                response.reduce(
                    (acc, curr) =>
                        mergeDeep(
                            acc,
                            this.config.flatten ? flattenTranslations(curr ?? {}) : curr,
                        ),
                    {},
                ),
            ),
        ) as Observable<TranslationObject>;
    }

    private reportError(failure: TranslateHttpLoaderError): void {
        if (this.config.onLoadError) {
            try {
                this.config.onLoadError(failure);
            } catch (error) {
                console.warn("@ngx-translate/http-loader: onLoadError callback failed:", error);
            }
        } else if (!this.config.failOnError) {
            console.warn(
                `@ngx-translate/http-loader: error loading translation for ${failure.lang}:`,
                failure.error,
            );
        }
    }
}

function flattenTranslations(translations: TranslationObject): TranslationObject {
    return Object.fromEntries(
        Object.entries(translations).flatMap(([key, value]) =>
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            Object.keys(value).length
                ? Object.entries(flattenTranslations(value)).map(([child, translation]) => [
                      `${key}.${child}`,
                      translation,
                  ])
                : [[key, value]],
        ),
    );
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
        flatten: singleConfig.flatten ?? false,
        onLoadError: singleConfig.onLoadError,
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
