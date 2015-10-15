# ng2-translate
An implementation of angular translate for Angular 2

## Installation
First you need to install the npm module:
```sh
npm install ng2-translate --save
```

If you use SystemJS to load your files, you might have to update your config with this:
```js
System.config({
    packages: {
        "/ng2-translate": {"defaultExtension": "js"}
    }
});
```

Finally, you can use ng2-translate in your Angular 2 project:
```js
import {Component, Injectable} from 'angular2/angular2';
import {TranslateService, TranslatePipe} from 'ng2-translate/ng2-translate';

@Injectable()
@Component({
    selector: 'app',
    bindings: [TranslateService],
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

## FAQ
> Typescript gives me the error `TS2304: Cannot find name 'require'.`

You need to install the typescript definitions for node: `tsd install node --save`
