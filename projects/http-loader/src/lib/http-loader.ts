import { HttpBackend, HttpClient } from "@angular/common/http";
import { inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { mergeDeep, TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { catchError, forkJoin, map, Observable, of } from "rxjs";

export interface TranslateHttpLoaderResource {
    prefix: string;
    suffix?: string;
    showLog?: boolean;
}

export interface TranslateHttpLoaderConfig {
    /**
     * @deprecated Use `resources` instead. `prefix` and `suffix` will be removed in a future version.
     */
    prefix?: string;
    /**
     * @deprecated Use `resources` instead. `prefix` and `suffix` will be removed in a future version.
     */
    suffix?: string;
    showLog?: boolean;
    resources: (string | TranslateHttpLoaderResource)[];
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

        if ((!this.config.resources || this.config.resources.length <= 0) && this.config.prefix)
            this.config.resources = [{ prefix: this.config.prefix, suffix: this.config.suffix }];

        const requests = this.config.resources.map((resource) => {
            let path: string;

            if (typeof resource === "string") path = `${resource}${lang}.json`;
            else path = `${resource.prefix}${lang}${resource.suffix ?? ".json"}`;

            return this.http.get<TranslationObject>(`${path}${cacheBuster}`).pipe(
                catchError((err) => {
                    if (this.config.showLog || (resource as TranslateHttpLoaderResource).showLog) {
                        console.error(`Error loading translation for ${lang}:`, err);
                    }
                    return of({});
                }),
            );
        });

        return forkJoin(requests).pipe(
            map((response) => response.reduce((acc, curr) => mergeDeep(acc, curr), {})),
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
