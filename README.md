# ng2-translate [![Build Status](https://travis-ci.org/ocombe/ng2-translate.svg?branch=master)](https://travis-ci.org/ocombe/ng2-translate) [![npm version](https://img.shields.io/npm/v/ng2-translate.svg)](https://www.npmjs.com/package/ng2-translate)
An implementation of angular translate for Angular 2.

Simple example using ng2-translate: https://github.com/ocombe/ng2-play/tree/ng2-translate

Get the complete changelog here: https://github.com/ocombe/ng2-translate/releases

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
* [Additional Framework Support](#additional-framework-support)

## Installation
First you need to install the npm module:
```sh
npm install ng2-translate --save
```

**If you use SystemJS** to load your files, you might have to update your config like [in this example](https://github.com/ocombe/ng2-play/blob/ng2-translate/index.html#L25-L28).

## Usage

Finally, you can use ng2-translate in your Angular 2 project (make sure that you've loaded the @angular/http bundle as well).
It is recommended to use `TRANSLATE_PROVIDERS` in the bootstrap of your application and to never add `TranslateService` to the "providers" property of your components, this way you will keep it as a singleton.
`TRANSLATE_PROVIDERS` provides a default configuration for the static translation file loader.
If you add `TranslateService` to the "providers" property of a component it will instantiate a new instance of the service that won't be initialized with the language to use or the default language.

```ts
import {HTTP_PROVIDERS} from '@angular/http';
import {Component, Injectable} from '@angular/core';
import {TRANSLATE_PROVIDERS, TranslateService, TranslatePipe, TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';
import {bootstrap} from '@angular/platform-browser-dynamic';

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

For now, only the static loader is available. You can configure it like this during bootstrap or in the `providers` property of a component:
```ts
bootstrap(AppComponent, [
  HTTP_PROVIDERS,
  { 
    provide: TranslateLoader,
    useFactory: (http: Http) => new TranslateStaticLoader(http, 'assets/i18n', '.json'),
    deps: [Http]
  },
  // use TranslateService here, and not TRANSLATE_PROVIDERS (which will define a default TranslateStaticLoader)
  TranslateService
]);

```

For Ionic 2 here is a complete bootstrap with configuration:
```ts
import {TranslateService, TranslateLoader, TranslateStaticLoader} from 'ng2-translate/ng2-translate';

@Component({
  templateUrl: '....',
  providers: [
    { 
      provide: TranslateLoader,
      useFactory: (http: Http) => new TranslateStaticLoader(http, 'assets/i18n', '.json'),
      deps: [Http]
    },
    TranslateService
  ]
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
```ts
translate.setTranslation('en', {
    "HELLO": "hello {{value}}"
});
```

## API
### TranslateService
#### Properties:
- `currentLang`: The lang currently used
- `currentLoader`: An instance of the loader currently used (static loader by default)
- `onLangChange`: An EventEmitter to listen to lang change events. A `LangChangeEvent` is an object with the properties `lang: string` & `translations: any` (an object containing your translations).

    example:
    ```ts
    onLangChange.subscribe(event: LangChangeEvent) => {
	  // do something
	});
    ```

#### Methods:
- `setDefaultLang(lang: string)`: Sets the default language to use as a fallback
- `use(lang: string): Observable<any>`: Changes the lang currently used
- `getTranslation(lang: string): Observable<any>`: Gets an object of translations for a given language with the current loader
- `setTranslation(lang: string, translations: Object)`: Manually sets an object of translations for a given language
- `getLangs()`: Returns an array of currently available langs
- `get(key: string|Array<string>, interpolateParams?: Object): Observable<string|Object>`: Gets the translated value of a key (or an array of keys)
- `instant(key: string|Array<string>, interpolateParams?: Object): string|Object`: Gets the instant translated value of a key (or an array of keys). /!\ This method is **synchronous** and the default file loader is asynchronous. You are responsible for knowing when your translations have been loaded and it is safe to use this method. If you are not sure then you should use the `get` method instead.
- `set(key: string, value: string, lang?: string)`: Sets the translated value of a key
- `reloadLang(lang: string): Observable<string|Object>`: Calls resetLang and retrieves the translations object for the current loader
- `resetLang(lang: string)`: Removes the current translations for this lang. /!\ You will have to call `use`, `reloadLang` or `getTranslation` again to be able to get translations

#### Write & use your own loader
If you want to write your own loader, you need to create a class that implements `TranslateLoader`.
The only required method is `getTranslation` that must return an `Observable`. If your loader is synchronous, just use `Observable.of` to create an observable from your static value.

##### Example
```ts
class CustomLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<any> {
        return Observable.of({"KEY": "Value"});
    }
}
```

Once you've defined your loader, you can provide it during bootstrap or by adding a Provider object to the `providers` property of a component:
```ts
{ provide: TranslateLoader, useClass: CustomLoader }
```

#### How to handle missing translations
You can setup a provider for `MissingTranslationHandler` in the bootstrap of your application (recommended), or in the `providers` property of a component.
It will be called when the requested translation is not available.
The only required method is `handle` where you can do whatever you want. If this method returns a value or an observable (that should return a string), then this will be used.
Just don't forget that it will be called synchronously from the `instant` method.

##### Example:
Create a Missing Translation Handler
```ts
import {MissingTranslationHandler} from 'ng2-translate/ng2-translate';

export class MyMissingTranslationHandler implements MissingTranslationHandler {
  handle(key: string) {
      return 'some value';
  }
}
```

Setup the Missing Translation Handler in bootstrap (recommended) or by adding a Provider object to the `providers` property of a component
```ts
{ provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler }
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
     
## Additional Framework Support

* [NativeScript](https://www.nativescript.org/) via [nativescript-ng2-translate](https://github.com/NathanWalker/nativescript-ng2-translate)

