# ng2-translate [![Build Status](https://travis-ci.org/ocombe/ng2-translate.svg?branch=master)](https://travis-ci.org/ocombe/ng2-translate) [![npm version](https://img.shields.io/npm/v/ng2-translate.svg)](https://www.npmjs.com/package/ng2-translate)
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
It is recommended to use `TRANSLATE_PROVIDERS` in the bootstrap of your application and to never add `TranslateService` to the "providers" property of your components, this way you will keep it as a singleton.
`TRANSLATE_PROVIDERS` provides a default configuration for the static translation file loader.
If you add `TranslateService` to the "providers" property of a component it will instantiate a new instance of the service that won't be initialized with the language to use or the default language.

```js
import {HTTP_PROVIDERS} from 'angular2/http';
import {Component, Injectable, provide} from 'angular2/core';
import {TRANSLATE_PROVIDERS, TranslateService, TranslatePipe,
    TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';
import {bootstrap} from 'angular2/platform/browser';

bootstrap(AppComponent, [
    HTTP_PROVIDERS,
    // not required, but recommended to have 1 unique instance of your service
    TRANSLATE_PROVIDERS
]);

@Component({
    selector: 'app',
    template: `
        <div>{{ 'HELLO' | translate:{value: param} }}</div>
    `,
    pipes: [TranslatePipe]
})
export class AppComponent {
    param: string = "world";

    constructor(translate: TranslateService) {
        var userLang = navigator.language.split('-')[0]; // use navigator lang if available
        userLang = /(fr|en)/gi.test(userLang) ? userLang : 'en';

         // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');

         // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use(userLang);
    }
}
```

For now, only the static loader is available. You can configure it like this during bootstrap:
```js
provide(TranslateLoader, {
    useFactory: (http: Http) => new TranslateStaticLoader(http, 'assets/i18n', '.json'),
    deps: [Http]
})
```

Then put your translations in a json file that looks like this (for `en.json`):
```json
{
    "HELLO": "hello {{value}}"
}
```

An then you can get new translations like this:
```js
translate.getTranslation(userLang);
```

But you can also define your translations manually instead of using `getTranslation`:
```js
translate.setTranslation('en', {
    "HELLO": "hello {{value}}"
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
- `useLoader(loader: TranslateLoader)`: Use a different loader
- `setDefaultLang(lang: string)`: Sets the default language to use as a fallback
- `use(lang: string): Observable<any>`: Changes the lang currently used
- `getTranslation(lang: string): Observable<any>`: Gets an object of translations for a given language with the current loader
- `setTranslation(lang: string, translations: Object)`: Manually sets an object of translations for a given language
- `setMissingTranslationHandler(handler: MissingTranslationHandler): void`: sets the Missing Translation Handler which will be
used when the requested translation is not available
- `getLangs()`: Returns an array of currently available langs
- `get(key: string|Array<string>, interpolateParams?: Object): Observable<string|Object>`: Gets the translated value of a key (or an array of keys)
- `instant(key: string|Array<string>, interpolateParams?: Object): string|Object`: Gets the instant translated value of a key (or an array of keys)
- `set(key: string, value: string, lang?: string)`: set the translated value of a key

#### Write & use your own loader
If you want to write your own loader, you need to create a class that implements `TranslateLoader`.
The only required method is `getTranslation` that must return an `Observable`. If your loader is synchronous, just use `Observable.of` to create an observable from your static value.

##### Example
```js
class CustomLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<any> {
        return Observable.of({"KEY": "Value"});
    }
}
```

Once you've defined your loader, you can provide it in bootstrap:
```js
bootstrap(AppComponent, [
    HTTP_PROVIDERS,
    provide(TranslateLoader, {useClass: CustomLoader}),
    TranslateService
]);
```

Or you can just use the `useLoader` method:
```js
export class AppComponent {
    constructor(translate: TranslateService, myLoader: CustomLoader) {
        translate.useLoader(myLoader);
    }
}
```

#### How to handle missing translations
You can setup a provider for `MissingTranslationHandler` in the bootstrap of your application (recommended), or you can use the method `setMissingTranslationHandler` later to define a handler that will be called when the requested translation is not available.
The only required method is `handle` where you can do whatever you want. Just don't forget that it will be called synchronously from the `get` & `instant` methods.

##### Example:
Create a Missing Translation Handler
```js
import {MissingTranslationHandler} from 'ng2-translate/ng2-translate';

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(key: string) {
      console.log(key);
  }
}
```

Setup the Missing Translation Handler in bootstrap (recommended)
```js
provide(MissingTranslationHandler, { useClass: MyMissingTranslationHandler })
```

Set the Missing Translation Handler later
```js
constructor(translate: TranslateService) {
  ...
  translate.setMissingTranslationHandler(new MyMissingTranslationHandler());
  ...
}  
```

### TranslatePipe
You can call the TranslatePipe with some optional parameters that will be transpolated into the translation for the given key.

Example:
```html
<p>Say {{ 'HELLO' | translate:{value: "world"} }}</p>
```

With the given translation: `"HELLO": "hello {{value}}"`.

### Parser
#### Methods:
- `interpolate(expr: string, params?: any): string`: Interpolates a string to replace parameters.

    `This is a {{ key }}` ==> `This is a value` with `params = { key: "value" }`
- `getValue(target: any, key: stirng): any`:  Gets a value from an object by composed key
     `parser.getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'`
