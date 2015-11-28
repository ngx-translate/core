# ng2-translate
An implementation of angular translate for Angular 2.

Simple examples using ng2-translate:
- with ng2-play: https://github.com/ocombe/ng2-play/tree/ng2-translate
- with angular2-seed: https://github.com/ocombe/angular2-seed/tree/ng2-translate

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

Finally, you can use ng2-translate in your Angular 2 project (make sure that you've loaded the angular2/http bundle as well).
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
        <div>{{ 'HELLO_WORLD' | translate:'{value: "world"}' }} world</div>
    `,
    pipes: [TranslatePipe]
})
export class AppComponent {
    constructor(translate: TranslateService) {
        var userLang = navigator.language.split('-')[0]; // use navigator lang if available
        userLang = /(fr|en)/gi.test(userLang) ? userLang : 'en';
        
         // optional, default is "en"
        translate.setDefaultLang('en');
        
         // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use(userLang);
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
    "HELLO_WORLD": "hello {{value}}"
}
```

An then you can get new translations like this:
```js
    translate.getTranslation(userLang);
```

But you can also define your translations manually instead of using `getTranslation`:
```js
translate.setTranslation('en', {
    "HELLO_WORLD": "hello {{value}}"
});
```

## API
### TranslateService
#### Properties:
- `currentLang`: The lang currently used
- `currentLoader`: An instance of the loader currently used (static loader by default)
- `onLangChange`: An EventEmitter to listen to lang changes events
    
    example:
	```js
    onLangChange.subscribe((params: {lang: string, translations: any}) => {
	  // do something
	});
    ```
    
#### Methods:
- `useStaticFilesLoader()`: Use a static files loader
- `setDefaultLang(lang: string)`: Sets the default language to use ('en' by default)
- `use(lang: string): Observable<any>`: Changes the lang currently used
- `getTranslation(lang: string): Observable<any>`: Gets an object of translations for a given language with the current loader
- `setTranslation(lang: string, translations: Object)`: Manually sets an object of translations for a given language
- `getLangs()`: Returns an array of currently available langs
- `get(key: string, interpolateParams?: Object): Observable<string>`: Gets the translated value of a key
- `set(key: string, value: string, lang?: string)`: 

### TranslatePipe
You can call the TranslatePipe with some optional parameters that will be transpolated into the translation for the given key.

Example:
```html
<p>Say {{ 'HELLO_WORLD' | translate:'{value: "world"}' }}</p>
```

With the given translation: `"HELLO_WORLD": "hello {{value}}"`.

### Parser
#### Methods:
- `interpolate(expr: string, params?: any): string`: Interpolates a string to replace parameters.
	
    `This is a {{ key }}` ==> `This is a value` with `params = { key: "value" }`
