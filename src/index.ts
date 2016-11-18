import {NgModule, ModuleWithProviders} from "@angular/core";
import {Http, HttpModule} from "@angular/http";
import {TranslatePipe} from "./translate/translate.pipe";
import {TranslateService, TranslateLoader, TranslateStaticLoader} from "./translate/translate.service";

export * from "./translate/translate.pipe";
export * from "./translate/translate.service";
export * from "./translate/translate.parser";

export function translateLoaderFactory(http: Http) {
    return new TranslateStaticLoader(http);
}

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
        useFactory: translateLoaderFactory,
        deps: [Http]
    }): ModuleWithProviders {
        return {
            ngModule: TranslateModule,
            providers: [providedLoader, TranslateService]
        };
    }
}
