import {NgModule, ModuleWithProviders, Provider} from "@angular/core";
import {TranslateStore} from "./src/translate.store";
import {TranslateLoader, TranslateFakeLoader} from "./src/translate.loader";
import {TranslateService} from "./src/translate.service";
import {MissingTranslationHandler, FakeMissingTranslationHandler} from "./src/missing-translation-handler";
import {TranslateParser, TranslateDefaultParser} from "./src/translate.parser";
import {TranslateDirective} from "./src/translate.directive";
import {TranslatePipe} from "./src/translate.pipe";

export * from "./src/translate.store";
export * from "./src/translate.loader";
export * from "./src/translate.service";
export * from "./src/missing-translation-handler";
export * from "./src/translate.parser";
export * from "./src/translate.directive";
export * from "./src/translate.pipe";

export interface TranslateModuleConfig {
    loader?: Provider;
    parser?: Provider;
    missingTranslationHandler?: Provider;
}

@NgModule({
    declarations: [
        TranslatePipe,
        TranslateDirective
    ],
    exports: [
        TranslatePipe,
        TranslateDirective
    ]
})
export class TranslateModule {
    /**
     * Use this method in your root module to provide the TranslateService
     * @param {TranslateModuleConfig} config
     * @returns {ModuleWithProviders}
     */
    static forRoot(config: TranslateModuleConfig = {}): ModuleWithProviders {
        let baseConfig = this.forChild(config);
        Array.prototype.push.call(baseConfig.providers, TranslateStore);
        return baseConfig;
    }

    /**
     * Use this method in your other (non root) modules to import the directive/pipe
     * @param {TranslateModuleConfig} config
     * @returns {ModuleWithProviders}
     */
    static forChild(config: TranslateModuleConfig = {}): ModuleWithProviders {
        let optionalProviders: Provider[] = [];
        if(config.missingTranslationHandler) {
            Array.prototype.push.call(optionalProviders, config.missingTranslationHandler);
        }

        return {
            ngModule: TranslateModule,
            providers: [
                config.loader || {provide: TranslateLoader, useClass: TranslateFakeLoader},
                config.parser || {provide: TranslateParser, useClass: TranslateDefaultParser},
                config.missingTranslationHandler || {provide: MissingTranslationHandler, useClass: FakeMissingTranslationHandler},
                ...optionalProviders,
                TranslateService
            ]
        };
    }
}
