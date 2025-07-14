import { ModuleWithProviders, NgModule, Provider } from "@angular/core";
import { TranslatePipe } from "./translate.pipe";
import { TranslateDirective } from "./translate.directive";
import { TranslateServiceConfig } from "../public-api";
import { defaultProviders } from "./translate.providers";

export interface TranslateModuleConfig extends Partial<TranslateServiceConfig> {
    loader?: Provider;
    compiler?: Provider;
    parser?: Provider;
    missingTranslationHandler?: Provider;
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
            providers: [...defaultProviders({ isolate: true , ...config})],
        };
    }

    /**
     * Use this method in your other (non-root) modules to import the directive/pipe
     */
    static forChild(config: TranslateModuleConfig = {}): ModuleWithProviders<TranslateModule> {
        return {
            ngModule: TranslateModule,
            providers: [...defaultProviders({ isolate: false, ...config})],
        };
    }
}
