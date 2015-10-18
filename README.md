# ng2-translate
An implementation of angular translate for Angular 2.

Simple example using ng2-translate: https://github.com/ocombe/ng2-play/tree/ng2-translate-test

## Installation
First you need to install the npm module:
```sh
npm install ng2-translate --save
```

If you use SystemJS to load your files, you might have to update your config with this if you don't use `defaultJSExtensions: true`:
```js
System.config({
    packages: {
        "/ng2-translate": {"defaultExtension": "js"}
    }
});
```

Finally, you can use ng2-translate in your Angular 2 project (be sure that you've loaded the angular2/http bundle as well).
It is recommended to instantiate `TranslateService` in the bootstrap of your application and to never add it to the "providers" property of your components, this way you will keep it as a singleton.
If you add it to the "providers" property of a component it will instantiate a new instance of the service that won't be initialized.

```js
import {HTTP_PROVIDERS} from 'angular2/http';

bootstrap(AppComponent, [
    HTTP_PROVIDERS,
    TranslateService
]);


import {Component, Injectable} from 'angular2/angular2';
import {TranslateService, TranslatePipe} from 'ng2-translate/ng2-translate';

@Injectable()
@Component({
    selector: 'app',
    template: `
        <div>{{ 'HELLO' | translate }} world</div>
    `,
    pipes: [TranslatePipe]
})
export class AppComponent {
    constructor(translate: TranslateService) {
        var userLang = navigator.language.split('-')[0]; // use navigator lang if available
        userLang = /(fr|en)/gi.test(userLang) ? userLang : 'en';
        
         // optional, default is "en"
        translate.setDefault('en');
         // the lang to use, if the lang isn't available, it will use the loader defined to get them
        translate.use(userLang);
        
        // if you manually want to get new translations, you can call this:
        // use the loader defined (static by default) to get the translations
        translate.getTranslation(userLang);
    }
}
```

For now, only the static loader is available. You can configure it like this:
```js
var prefix = 'assets/i18n/';
var suffix = '.json';
translate.useStaticFilesLoader(prefix, suffix);
```

Then put your translations in a json file that looks like this (for `en.json`):
```json
{
    "HELLO": "Hello"
}
```

But you can also define your translations manually instead of using `getTranslation`:
```js
translate.setTranslation('en', {
    'HELLO': 'hello'
});
```
