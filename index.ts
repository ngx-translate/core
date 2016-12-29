import {NgModule, ModuleWithProviders, Injector} from "@angular/core";
import {Http, HttpModule} from "@angular/http";
import {TranslatePipe} from "./src/translate.pipe";
import {TranslateParser, DefaultTranslateParser} from "./src/translate.parser";
import {TranslateService, TranslateLoader, TranslateStaticLoader, ModuleLoader} from "./src/translate.service";
import {TranslateDirective} from "./src/translate.directive";

export * from "./src/translate.pipe";
export * from "./src/translate.service";
export * from "./src/translate.parser";
export * from "./src/translate.directive";

export function translateLoaderFactory(http: Http) {
    return new TranslateStaticLoader(http);
}

@NgModule({
    imports: [HttpModule],
    declarations: [
        TranslatePipe,
        TranslateDirective
    ],
    exports: [
        HttpModule, // todo remove this when removing the loader from core
        TranslatePipe,
        TranslateDirective
    ]
})
export class TranslateModule {

    static INJECTOR: Injector;

    constructor(Injector: Injector) {
      TranslateModule.INJECTOR = Injector;
    }
    static forRoot(providedLoader: any = {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [Http]
    }): ModuleWithProviders {
        // var id = 'root';
        return {
            ngModule: TranslateModule,
            providers: [
                providedLoader,
                TranslateService,
                { provide: ModuleLoader, useValue: {uid: 'root'} },
                { provide: TranslateParser, useClass: DefaultTranslateParser }
            ]
        };
    }
    static forChild(providedLoader: any = {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [Http]
    }): ModuleWithProviders {
        let service: TranslateService = TranslateModule.INJECTOR.get(TranslateService);
        let moduleLoader = new ModuleLoader(service, TranslateModule.INJECTOR, providedLoader);
        return {
            ngModule: TranslateModule,
            providers: [
                providedLoader,
                { provide: ModuleLoader, useValue: moduleLoader }
            ]
        };
    }
}
