import {provide} from 'angular2/core';
import {Http} from 'angular2/http';
import {TranslatePipe} from './src/translate.pipe';
import {TranslateService, TranslateLoader, TranslateStaticLoader} from './src/translate.service';

export * from './src/translate.pipe';
export * from './src/translate.service';
export * from './src/translate.parser';

export const NG_TRANSLATE_PROVIDERS: any = [
    provide(TranslateLoader, {
        useFactory: (http: Http) => new TranslateStaticLoader(http),
        deps: [Http]
    }),
    TranslateService
];