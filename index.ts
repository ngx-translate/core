import {NgModule, ModuleWithProviders} from "@angular/core";
import {Http, HttpModule} from "@angular/http";
import {TranslatePipe} from "./src/translate.pipe";
import {TranslateParser, DefaultTranslateParser} from "./src/translate.parser";
import {TranslateService, TranslateLoader, TranslateStaticLoader, ModuleLoader, ModuleIdentifier} from "./src/translate.service";
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
                { provide: ModuleIdentifier, useValue: {uid: 'root'} },
                { provide: TranslateParser, useClass: DefaultTranslateParser }
            ]
        };
    }
    static forChild(providedLoader: any = {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [Http]
    }): ModuleWithProviders {
        let uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
          function(c: string) {
              var r = Math.floor(Math.random() * 16),
                  v = c === 'x' ? r : (r % 4 + 4);
              return v.toString(16);
          }).toUpperCase();
        return {
            ngModule: TranslateModule,
            providers: [
                providedLoader,
                ModuleLoader,
                { provide: ModuleIdentifier, useValue: {uid: uid} }
            ]
        };
    }
}
