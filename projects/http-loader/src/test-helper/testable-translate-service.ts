import { ClassProvider, Provider } from "@angular/core";
import {
    provideTranslateService,
    RootTranslateServiceConfig,
    TranslateCompiler,
    TranslateLoader,
    TranslateService,
} from "@ngx-translate/core";

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
