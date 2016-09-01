import {NgModule, ModuleWithProviders} from "@angular/core";
import {Http, HttpModule} from "@angular/http";
import {TranslatePipe} from "./src/translate.pipe";
import {TranslateService, TranslateLoader, TranslateStaticLoader} from "./src/translate.service";

export * from "./src/translate.pipe";
export * from "./src/translate.service";
export * from "./src/translate.parser";

// for angular-cli
export default {
    pipes: [TranslatePipe],
    providers: [TranslateService]
};

@NgModule({
    imports: [HttpModule],
    declarations: [
        TranslatePipe
    ],
    exports: [
        HttpModule, // todo remove this when removing the loader from core
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
