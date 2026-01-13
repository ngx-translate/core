import { ClassProvider, Injectable, Provider } from "@angular/core";
import { Observable, of, timer } from "rxjs";
import { map } from "rxjs/operators";
import {
    provideTranslateService,
    RootTranslateServiceConfig,
    TranslateCompiler,
    TranslateLoader,
    TranslateService,
    TranslationObject,
} from "../public-api";

@Injectable()
export class DelayedFakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        const translations: Record<string, TranslationObject> = {
            en: { TEST: "This is a test" },
            fr: { TEST: "C'est un test" },
        };

        return timer(9).pipe(map(() => translations[lang]));
    }
}

@Injectable()
export class FakeLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<TranslationObject> {
        const translations: Record<string, TranslationObject> = {
            en: { TEST: "This is a test" },
            fr: { TEST: "C'est un test" },
        };

        return of(translations[lang]);
    }
}

@Injectable()
export class TestableTranslateService extends TranslateService {
    public getCurrentLoader(): TranslateLoader {
        return this.currentLoader;
    }

    public getCompiler(): TranslateCompiler {
        return this.compiler;
    }
}

export function provideTestableTranslateService(
    config: RootTranslateServiceConfig = {},
): Provider[] {
    const providers: Provider[] = provideTranslateService(config);
    const translateServicedProvider: ClassProvider | undefined = providers.find(
        (provider) => (provider as ClassProvider).provide === TranslateService,
    ) as ClassProvider | undefined;
    if (translateServicedProvider === undefined)
        throw new Error("Could not find TranslateService provider in provided providers");
    translateServicedProvider.useClass = TestableTranslateService;
    return providers;
}
