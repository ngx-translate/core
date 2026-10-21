import { HttpBackend, HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { mergeDeep, TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { catchError, defer, forkJoin, map, Observable, of, throwError } from "rxjs";

// Browsers resolve "." and ".." as path navigation even though they contain nothing to encode.
const DOT_SEGMENT = /^\.{1,2}$/;

/*
 * AI GENERATED CODE: This snippet was produced or modified by AI. Review it carefully before relying on it.
 * Model: GPT-6
 * Prompt: Add opt-in flattening to the single and multiple resource loader configuration.
 */
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
}

export interface TranslateHttpLoaderResource {
    prefix: string;
    suffix?: string;
}

/*
 * AI GENERATED CODE: This snippet was produced or modified by AI. Review it carefully before relying on it.
 * Model: GPT-6
 * Prompt: Add opt-in flattening to the single and multiple resource loader configuration.
 */
export interface TranslateMultiHttpLoaderConfig {
    resources: (string | TranslateHttpLoaderResource)[];
    enforceLoading: boolean;
    useHttpBackend: boolean;
    /** See {@link TranslateHttpLoaderConfig.failOnError}. */
    failOnError?: boolean;
    /** See {@link TranslateHttpLoaderConfig.flatten}. */
    flatten?: boolean;
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
    /*
     * AI GENERATED CODE: This snippet was produced or modified by AI. Review it carefully before relying on it.
     * Model: GPT-6
     * Prompt: Add opt-in resource flattening before translation files are merged.
     */
    public getTranslation(lang: string): Observable<TranslationObject> {
        const cacheBuster = this.config.enforceLoading ? `?enforceLoading=${Date.now()}` : "";

        const requests = this.config.resources.map((resource) => {
            const request$ = defer(() => {
                // The language may come from a route or query parameter. Encoding it keeps it a
                // single path segment, so it cannot escape the prefix, drop the suffix, or change
                // the origin of the request.
                const langSegment = encodeURIComponent(lang);
                const path =
                    typeof resource === "string"
                        ? `${resource}${langSegment}.json`
                        : `${resource.prefix}${langSegment}${resource.suffix ?? ".json"}`;

                return DOT_SEGMENT.test(lang)
                    ? throwError(() => new Error(`"${lang}" is a path segment, not a language`))
                    : this.http.get<TranslationObject>(`${path}${cacheBuster}`);
            });

            if (this.config.failOnError) {
                return request$;
            }

            return request$.pipe(
                catchError((err: HttpErrorResponse | Error) => {
                    console.warn(
                        `@ngx-translate/http-loader: error loading translation for ${lang}:`,
                        err,
                    );
                    return of({});
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
                        mergeDeep(acc, this.config.flatten ? flattenTranslations(curr) : curr),
                    {},
                ),
            ),
        ) as Observable<TranslationObject>;
    }
}

/*
 * AI GENERATED CODE: This snippet was produced or modified by AI. Review it carefully before relying on it.
 * Model: GPT-6
 * Prompt: Flatten translation objects while preserving arrays, null and empty objects.
 */
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

/*
 * AI GENERATED CODE: This snippet was produced or modified by AI. Review it carefully before relying on it.
 * Model: GPT-6
 * Prompt: Forward the optional flatten setting for single-resource HTTP loaders.
 */
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
