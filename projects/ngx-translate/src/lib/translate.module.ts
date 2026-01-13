import { NgModule } from "@angular/core";
import { TranslateDirective } from "./translate.directive";
import { TranslatePipe } from "./translate.pipe";
import { TranslateProviders } from "./translate.providers";

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
