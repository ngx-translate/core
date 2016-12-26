import {NgModule, ModuleWithProviders} from "@angular/core";
import {TranslatePipe} from "./src/translate.pipe";
import {TranslateParser, DefaultTranslateParser} from "./src/translate.parser";
import {TranslateService, TranslateLoader} from "./src/translate.service";
import {TranslateDirective} from "./src/translate.directive";

export * from "./src/translate.pipe";
export * from "./src/translate.service";
export * from "./src/translate.parser";
export * from "./src/translate.directive";

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
    static forRoot(providedLoader: any = {
        provide: TranslateLoader,
        useFactory: () => {}
    }): ModuleWithProviders {
        return {
            ngModule: TranslateModule,
            providers: [
                providedLoader,
                TranslateService,
                { provide: TranslateParser, useClass: DefaultTranslateParser }
            ]
        };
    }
}
