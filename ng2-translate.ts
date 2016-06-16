import {provide} from '@angular/core';
import {Http} from '@angular/http';
import {TranslateDirective} from './src/translate.directive';
import {TranslatePipe} from './src/translate.pipe';
import {TranslateService, TranslateLoader, TranslateStaticLoader} from './src/translate.service';

export * from './src/translate.directive';
export * from './src/translate.pipe';
export * from './src/translate.service';
export * from './src/translate.parser';

export const TRANSLATE_PROVIDERS: any = [
    provide(TranslateLoader, {
        useFactory: (http: Http) => new TranslateStaticLoader(http),
        deps: [Http]
    }),
    TranslateService
];

// for angular-cli
export default {
    directives: [TranslateDirective],
    pipes: [TranslatePipe],
    providers: [TranslateService]
}
