import {NgModule, ModuleWithProviders} from "@angular/core";
import {Http, HttpModule} from "@angular/http";
import {TranslatePipe} from "./src/translate.pipe";
import {TranslateService, TranslateLoader, TranslateStaticLoader} from "./src/translate.service";

export * from "./src/translate.pipe";
export * from "./src/translate.service";
export * from "./src/translate.parser";

/**
 * Deprecated, import the new TranslateModule in your NgModule instead
 * @deprecated
 */
export const TRANSLATE_PROVIDERS: any = [
    {
        provide: TranslateLoader,
        useFactory: (http: Http) => new TranslateStaticLoader(http),
        deps: [Http]
    },
    TranslateService
];

// for angular-cli
export default {
    pipes: [TranslatePipe],
    providers: [TranslateService]
};

/**
 * This module doesn't provide a Translate Loader, you will have to provide one for yourself
 */
@NgModule({
    imports: [],
    declarations: [
        TranslatePipe
    ],
    exports: [
        TranslatePipe
    ]
})
export class TranslateModule {
    static forRoot(providedLoader: any = {
        provide: TranslateLoader,
        useFactory: (http: Http) => new TranslateStaticLoader(http),
        deps: [Http]
    }): ModuleWithProviders {
        return {
            ngModule: TranslateModule,
            providers: [providedLoader, TranslateService]
        };
    }
}