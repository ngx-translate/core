import { ModuleWithProviders, NgModule } from "@angular/core";
import { DefaultMissingTranslationHandler } from "./missing-translation-handler";
import { TranslateNoOpCompiler } from "./translate.compiler";
import { TranslateDirective } from "./translate.directive";
import { TranslateNoOpLoader } from "./translate.loader";
import { TranslateDefaultParser } from "./translate.parser";
import { TranslatePipe } from "./translate.pipe";
import {
    defaultProviders,
    provideMissingTranslationHandler,
    provideTranslateCompiler,
    provideTranslateLoader,
    provideTranslateParser,
    TranslateProviders,
} from "./translate.providers";

import { Language } from "./translate.service.interface";

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
export class TranslateModule { }
