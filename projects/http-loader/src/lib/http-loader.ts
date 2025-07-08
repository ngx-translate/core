import { HttpBackend, HttpClient } from "@angular/common/http";
import { inject, Injectable, InjectionToken, Provider } from "@angular/core";
import { TranslateLoader, TranslationObject } from "@ngx-translate/core";
import { Observable } from "rxjs";

export interface TranslateHttpLoaderConfig {
    prefix?: string;
    suffix?: string;
    enforceLoading?: boolean;
}

export const TRANSLATE_LOADER_CONFIG = new InjectionToken<TranslateHttpLoaderConfig>(
    "TRANSLATE_LOADER_CONFIG",
);

@Injectable()
export class TranslateHttpLoader implements TranslateLoader {
    private http: HttpClient = inject(HttpClient);

    private prefix = "/assets/i18n/";
    private suffix = ".json";
    private enforceLoading = false;

    public setPrefix(prefix: string): void {
        this.prefix = prefix;
    }

    public setSuffix(suffix: string): void {
        this.suffix = suffix;
    }

    public setClient(client: HttpClient): void {
        this.http = client;
    }

    public setEnforceLoading(enforceLoading: boolean): void {
        this.enforceLoading = enforceLoading;
    }

    /**
     * Gets the translations from the server
     */
    public getTranslation(lang: string): Observable<TranslationObject> {
        const cacheBuster = this.enforceLoading ? `?enforceLoading=${Date.now()}` : "";

        return this.http.get(
            `${this.prefix}${lang}${this.suffix}${cacheBuster}`,
        ) as Observable<TranslationObject>;
    }
}

function translateLoaderFactroy(
    client: HttpClient,
    prefix?: string,
    suffix?: string,
    enforceLoading?: boolean,
): TranslateHttpLoader {
    const loader: TranslateHttpLoader = new TranslateHttpLoader();
    loader.setClient(client);
    loader.setEnforceLoading(enforceLoading ?? false);
    loader.setPrefix(prefix ?? "/assets/i18n/");
    loader.setSuffix(suffix ?? ".json");
    return loader;
}

export function provideTranslateHttpLoader(
    prefix?: string,
    suffix?: string,
    enforceLoading?: boolean,
): Provider {
    return [
        {
            provide: TranslateLoader,
            useFactory: () =>
                translateLoaderFactroy(inject(HttpClient), prefix, suffix, enforceLoading),
            deps: [HttpClient],
        },
    ];
}

export function provideTranslateHttpLoaderFromHttpBackend(
    prefix?: string,
    suffix?: string,
    enforceLoading?: boolean,
): Provider {
    return [
        {
            provide: TranslateLoader,
            useFactory: () =>
                translateLoaderFactroy(
                    new HttpClient(inject(HttpBackend)),
                    prefix,
                    suffix,
                    enforceLoading,
                ),
            deps: [HttpBackend],
        },
    ];
}
