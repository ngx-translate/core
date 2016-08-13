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
#### 1. Import the `TranslateModule`:
Finally, you can use ng2-translate in your Angular 2 project.
It is recommended to import `TranslateModule.forRoot()` in the NgModule of your application.


The `forRoot` method is a convention for modules that provide a singleton service (such as the Angular 2 Router), you can also use it to configure the `TranslateModule` loader. By default it will use the `TranslateStaticLoader`, but you can provide another loader instead as a parameter of this method (see below [Write & use your own loader](#write--use-your-own-loader)).


```ts
import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from '@angular/core';
import {TranslateModule} from 'ng2-translate/ng2-translate';

@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot()
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
```

If you have multiple NgModules and you use one as a shared NgModule (that you import in all of your other NgModules), don't forget that you can use it to export the `TranslateModule` that you imported in order to avoid having to import it multiple times.

```ts
@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot()
    ],
    exports: [TranslateModule],
})
export class SharedModule {
}
```

By default, only the `TranslateStaticLoader` is available. It will search for files in i18n/*.json, if you want you can customize this behavior by changing the default prefix/suffix:

```ts
@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot({ 
          provide: TranslateLoader,
          useFactory: (http: Http) => new TranslateStaticLoader(http, '/assets/i18n', '.json'),
          deps: [Http]
        })
    ],
    exports: [TranslateModule],
})
export class SharedModule {
}
```

##### _Ionic 2 users:_

For Ionic 2 here is a complete bootstrap with configuration (this may not be working as of RC5, don't hesitate to raise an issue if it's the case):
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

#### 2. Init the `TranslateService` for your application:

```ts
import {Component} from '@angular/core';
import {TranslateService} from 'ng2-translate/ng2-translate';

@Component({
    selector: 'app',
    template: `
        <div>{{ 'HELLO' | translate:{value: param} }}</div>
    `
})
export class AppComponent {
    param: string = "world";

    constructor(translate: TranslateService) {
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');

         // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use('en');
    }
}
```

#### 3. Define the translations:

Once you've imported the `TranslateModule`, put your translations in a json file that looks like this (for `en.json`) and that will be imported with the `TranslateStaticLoader`:
```json
{
    "HELLO": "hello {{value}}"
}
```

But you can also define your translations manually instead with `setTranslation`:
```ts
translate.setTranslation('en', {
    "HELLO": "hello {{value}}"
});
```

The `TranslateParser` is able to understand json keys, which means that you can organize your translations like that:
```json
{
    "HOME": {
      "HELLO": "hello {{value}}"
    }
}
```

And then access them using the key `HOME.HELLO`.

#### 4. Use the service or the pipe:

You can use the `TranslateService` to get new translations like this:
```ts
translate.get('SOME_KEY').subscribe((res: string) => {
    // do something with res
});
```

Or use the `TranslatePipe` in any template:
```html
<div>{{ 'HELLO' | translate:{value: param} }}</div>
```


## API
### TranslateService
#### Properties:
- `currentLang`: The lang currently used
- `currentLoader`: An instance of the loader currently used (static loader by default)
- `onLangChange`: An EventEmitter to listen to lang change events. A `LangChangeEvent` is an object with the properties `lang: string` & `translations: any` (an object containing your translations).

    example:
    ```ts
    onLangChange.subscribe((event: LangChangeEvent) => {
	  // do something
	});
    ```
- `onTranslationChange`: An EventEmitter to listen to translation change events. A `TranslationChangeEvent` is an object with the properties `lang: string` & `translations: any` (an object containing your translations).

    example:
    ```ts
    onTranslationChange.subscribe((event: TranslationChangeEvent) => {
	  // do something
	});
    ```

#### Methods:
- `setDefaultLang(lang: string)`: Sets the default language to use as a fallback
- `use(lang: string): Observable<any>`: Changes the lang currently used
- `getTranslation(lang: string): Observable<any>`: Gets an object of translations for a given language with the current loader
- `setTranslation(lang: string, translations: Object, shouldMerge: boolean = false)`: Manually sets an object of translations for a given language, set `shouldMerge` to true if you want to append the translations instead of replacing them
- `addLangs(langs: Array<string>)`: Add new langs to the list
- `getLangs()`: Returns an array of currently available langs
- `get(key: string|Array<string>, interpolateParams?: Object): Observable<string|Object>`: Gets the translated value of a key (or an array of keys)
- `instant(key: string|Array<string>, interpolateParams?: Object): string|Object`: Gets the instant translated value of a key (or an array of keys). /!\ This method is **synchronous** and the default file loader is asynchronous. You are responsible for knowing when your translations have been loaded and it is safe to use this method. If you are not sure then you should use the `get` method instead.
- `set(key: string, value: string, lang?: string)`: Sets the translated value of a key
- `reloadLang(lang: string): Observable<string|Object>`: Calls resetLang and retrieves the translations object for the current loader
- `resetLang(lang: string)`: Removes the current translations for this lang. /!\ You will have to call `use`, `reloadLang` or `getTranslation` again to be able to get translations
- `getBrowserLang(): string | undefined`: Returns the current browser lang if available, or undefined otherwise 

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

Once you've defined your loader, you can provide it in your NgModule by adding it to its `providers` property.
Don't forget that you have to import `TranslateModule` as well:
```ts
@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot({ provide: TranslateLoader, useClass: CustomLoader })
    ],
    exports: [TranslateModule],
})
export class SharedModule {
}
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

Setup the Missing Translation Handler in your NgModule (recommended) by adding it to its `providers` property:
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
If you need it for some reason, you can use the `TranslateParser` service.

#### Methods:
- `interpolate(expr: string, params?: any): string`: Interpolates a string to replace parameters.

    `This is a {{ key }}` ==> `This is a value` with `params = { key: "value" }`
- `getValue(target: any, key: stirng): any`:  Gets a value from an object by composed key
     `parser.getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'`
     
## Additional Framework Support

* [NativeScript](https://www.nativescript.org/) via [nativescript-ng2-translate](https://github.com/NathanWalker/nativescript-ng2-translate)

