import { ModuleWithProviders, NgModule } from "@angular/core";
import { TranslatePipe } from "./translate.pipe";
import { TranslateDirective } from "./translate.directive";
import {
    defaultProviders,
    provideTranslateCompiler,
    provideTranslateLoader,
    provideMissingTranslationHandler,
    provideTranslateParser,
    TranslateProviders,
} from "./translate.providers";
import { TranslateNoOpCompiler } from "./translate.compiler";
import { TranslateDefaultParser } from "./translate.parser";
import { TranslateNoOpLoader } from "./translate.loader";
import { DefaultMissingTranslationHandler } from "./missing-translation-handler";
import { Language } from "./translate.service";

export interface TranslateModuleConfig extends TranslateProviders {
    isolate?: boolean;
    extend?: boolean;
    fallbackLang?: Language;
    lang?: Language;

    /** @deprecated use fallbackLang */
    defaultLanguage?: string;
    /** @deprecated use fallbackLang */
    useDefaultLang?: boolean;
}

@NgModule({
    imports: [TranslatePipe, TranslateDirective],
    exports: [TranslatePipe, TranslateDirective],
})
export class TranslateModule {
    /**
     * Use this method in your root module to provide the TranslateService
     */
    static forRoot(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
        return {
            ngModule: TranslateModule,
            providers: [
                ...defaultProviders(
                    {
                        compiler: provideTranslateCompiler(TranslateNoOpCompiler),
                        parser: provideTranslateParser(TranslateDefaultParser),
                        loader: provideTranslateLoader(TranslateNoOpLoader),
                        missingTranslationHandler: provideMissingTranslationHandler(
                            DefaultMissingTranslationHandler,
                        ),
                        ...config,
                    },
                    true,
                ),
            ],
        };
    }

    /**
     * Use this method in your other (non-root) modules to import the directive/pipe
     */
    static forChild(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
        return {
            ngModule: TranslateModule,
            providers: [...defaultProviders(config, config.isolate ?? false)],
        };
    }
}
