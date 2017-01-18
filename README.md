# ng2-translate [![Build Status](https://travis-ci.org/ocombe/ng2-translate.svg?branch=master)](https://travis-ci.org/ocombe/ng2-translate) [![npm version](https://img.shields.io/npm/v/ng2-translate.svg)](https://www.npmjs.com/package/ng2-translate)

An implementation of angular translate for Angular 2.

Simple example using ng2-translate: http://plnkr.co/edit/btpW3l0jr5beJVjohy1Q?p=preview

Get the complete changelog here: https://github.com/ocombe/ng2-translate/releases

* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
* [FAQ](#faq)
* [Plugins](#plugins)
* [Additional Framework Support](#additional-framework-support)


## Installation

First you need to install the npm module:

```sh
npm install ng2-translate --save
```

**If you use SystemJS** to load your files, you can check the [plunkr example](http://plnkr.co/edit/btpW3l0jr5beJVjohy1Q?p=preview) for a working setup that uses the cdn [https://unpkg.com/](https://unpkg.com/).
If you're importing directly from `node_modules`, you should edit your systemjs config file and add `'ng2-translate': 'node_modules/ng2-translate/bundles'` in the map and `'ng2-translate' : { defaultExtension: 'js' }` in packages.


## Usage

#### 1. Import the `TranslateModule`:

Finally, you can use ng2-translate in your Angular 2 project.It is recommended to import `TranslateModule.forRoot()` in the NgModule of your application.

The [`forRoot`](https://angular.io/docs/ts/latest/guide/ngmodule.html#!#core-for-root) static method is a convention that provides and configures services at the same time. Make sure you only call this method at the root module of your application, most of the time called `AppModule`. This method allows you to configure the `TranslateModule` loader. By default it will use the `TranslateStaticLoader`, but you can provide another loader instead as a parameter of this method (see below [Write & use your own loader](#write--use-your-own-loader)).

For now ng2-translate requires HttpModule from `@angular/http` (this will change soon).

```ts
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {TranslateModule} from 'ng2-translate';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        TranslateModule.forRoot()
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

##### SharedModule

If you use a [`SharedModule`](https://angular.io/docs/ts/latest/guide/ngmodule.html#!#shared-modules) that you import in multiple other feature modules, you can easily export the `TranslateModule` to make sure you don't have to import it in every module.

```ts
@NgModule({
    exports: [
        CommonModule,
        TranslateModule
    ]
})
export class SharedModule { }
```

> Note: Never call a `forRoot` static method in the `SharedModule`. You will end up with multiple different instances of a service in your injector tree.

##### Configuration

By default, only the `TranslateStaticLoader` is available. It will search for files in `i18n/*.json`, if you want you can customize this behavior by changing the default prefix/suffix:

```ts
@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        TranslateModule.forRoot({
            provide: TranslateLoader,
            useFactory: (http: Http) => new TranslateStaticLoader(http, '/assets/i18n', '.json'),
            deps: [Http]
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

##### AoT

If you want to configure a custom `TranslateLoader` while using [AoT compilation](https://angular.io/docs/ts/latest/cookbook/aot-compiler.html) or [Ionic 2](http://ionic.io/), you must use an exported function instead of an inline function.

```ts
export function createTranslateLoader(http: Http) {
    return new TranslateStaticLoader(http, './assets/i18n', '.json');
}

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        TranslateModule.forRoot({
            provide: TranslateLoader,
            useFactory: (createTranslateLoader),
            deps: [Http]
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

#### 2. Init the `TranslateService` for your application:

```ts
import {Component} from '@angular/core';
import {TranslateService} from 'ng2-translate';

@Component({
    selector: 'app',
    template: `
        <div>{{ 'HELLO' | translate:param }}</div>
    `
})
export class AppComponent {
    param = {value: 'world'};

    constructor(translate: TranslateService) {
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');

         // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use('en');
    }
}
```

#### 3. Define the translations:

Once you've imported the `TranslateModule`, you can put your translations in a json file that will be imported with the `TranslateStaticLoader`. The following translations should be stored in `en.json`.

```json
{
    "HELLO": "hello {{value}}"
}
```

You can also define your translations manually with `setTranslation`.

```ts
translate.setTranslation('en', {
    HELLO: 'hello {{value}}'
});
```

The `TranslateParser` understands nested JSON objects. This means that you can have a translation that looks like this:

```json
{
    "HOME": {
        "HELLO": "hello {{value}}"
    }
}
```

You can then access the value by using the dot notation, in this case `HOME.HELLO`.

#### 4. Use the service, the pipe or the directive:

You can either use the `TranslateService`, the `TranslatePipe` or the `TranslateDirective` to get your translation values.

With the **service**, it looks like this:

```ts
translate.get('HELLO', {value: 'world'}).subscribe((res: string) => {
    console.log(res);
    //=> 'hello world'
});
```

This is how you do it with the **pipe**:

```html
<div>{{ 'HELLO' | translate:param }}</div>
```

And in your component define `param` like this:
```ts
param = {value: 'world'};
```

This is how you use the **directive**:
```html
<div [translate]="'HELLO'" [translateParams]="{value: 'world'}"></div>
```

Or even simpler using the content of your element as a key:
```html
<div translate [translateParams]="{value: 'world'}">HELLO</div>
```

#### 5. Use HTML tags:

You can easily use raw HTML tags within your translations.

```json
{
    "HELLO": "Welcome to my Angular application!<br><strong>This is an amazing app which uses the latest technologies!</strong>"
}
```

To render them, simply use the `innerHTML` attribute with the pipe on any element.

```html
<div [innerHTML]="'HELLO' | translate"></div>
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
- `onDefaultLangChange`: An EventEmitter to listen to default lang change events. A `DefaultLangChangeEvent` is an object with the properties `lang: string` & `translations: any` (an object containing your translations).

    example:
    ```ts
    onDefaultLangChange.subscribe((event: DefaultLangChangeEvent) => {
	  // do something
	});
    ```
    
#### Methods:

- `setDefaultLang(lang: string)`: Sets the default language to use as a fallback
- `getDefaultLang(): string`: Gets the default language
- `use(lang: string): Observable<any>`: Changes the lang currently used
- `getTranslation(lang: string): Observable<any>`: Gets an object of translations for a given language with the current loader
- `setTranslation(lang: string, translations: Object, shouldMerge: boolean = false)`: Manually sets an object of translations for a given language, set `shouldMerge` to true if you want to append the translations instead of replacing them
- `addLangs(langs: Array<string>)`: Add new langs to the list
- `getLangs()`: Returns an array of currently available langs
- `get(key: string|Array<string>, interpolateParams?: Object): Observable<string|Object>`: Gets the translated value of a key (or an array of keys) or the key if the value was not found
- `instant(key: string|Array<string>, interpolateParams?: Object): string|Object`: Gets the instant translated value of a key (or an array of keys). /!\ This method is **synchronous** and the default file loader is asynchronous. You are responsible for knowing when your translations have been loaded and it is safe to use this method. If you are not sure then you should use the `get` method instead.
- `set(key: string, value: string, lang?: string)`: Sets the translated value of a key
- `reloadLang(lang: string): Observable<string|Object>`: Calls resetLang and retrieves the translations object for the current loader
- `resetLang(lang: string)`: Removes the current translations for this lang. /!\ You will have to call `use`, `reloadLang` or `getTranslation` again to be able to get translations
- `getBrowserLang(): string | undefined`: Returns the current browser lang if available, or undefined otherwise
- `getBrowserCultureLang(): string | undefined`: Returns the current browser culture language name (e.g. "de-DE" if available, or undefined otherwise

#### Write & use your own loader

If you want to write your own loader, you need to create a class that implements `TranslateLoader`. The only required method is `getTranslation` that must return an `Observable`. If your loader is synchronous, just use [`Observable.of`](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/of.md) to create an observable from your static value.

##### Example

```ts
class CustomLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<any> {
        return Observable.of({KEY: 'value'});
    }
}
```

Once you've defined your loader, you can provide it in your configuration by adding it to its `providers` property.

```ts
@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot({
            provide: TranslateLoader,
            useClass: CustomLoader
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

#### How to handle missing translations

You can setup a provider for the `MissingTranslationHandler` in the bootstrap of your application (recommended), or in the `providers` property of a component. It will be called when the requested translation is not available. The only required method is `handle` where you can do whatever you want. If this method returns a value or an observable (that should return a string), then this will be used. Just don't forget that it will be called synchronously from the `instant` method.

##### Example:

Create a Missing Translation Handler

```ts
import {MissingTranslationHandler, MissingTranslationHandlerParams} from 'ng2-translate';

export class MyMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams) {
        return 'some value';
    }
}
```

Setup the Missing Translation Handler in your module by adding it to the `providers` list.

```ts
@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot()
    ],
    providers: [
        { provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

### Parser

If you need it for some reason, you can use the `TranslateParser` service.

#### Methods:
- `interpolate(expr: string, params?: any): string`: Interpolates a string to replace parameters.

    `This is a {{ key }}` ==> `This is a value` with `params = { key: "value" }`
- `getValue(target: any, key: stirng): any`:  Gets a value from an object by composed key
     `parser.getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'`

## FAQ

#### I'm getting an error `No provider for Http!`

Because of the TranslateStaticLoader you have to load the HttpModule from `@angular/http`, even if you don't use this Loader

#### I'm still using RC4, but I cannot use ng2-translate because I get errors?!

If you're still using RC4, you should fix the version of ng2-translate to 2.2.2.

#### I'm getting an error `npm ERR! peerinvalid Peer [...]`

If you're using npm 2.x, upgrade to npm 3.x, because npm 2 doesn't handle peer dependencies well. With npm 2 you could only use fixed versions, but with npm 3 you can use `^` to use a newer version if available.

If you're already on npm 3, check if it's an error (`npm ERR!`) or a warning (`npm WARN!`), warning are just informative and if everything works then don't worry !

If you're using an old version of angular 2 and ng2-translate wants a newer version then you should consider upgrading your application to use the newer angular 2 version. I cannot support old versions because the framework keeps doing breaking changes... If it's not an option for you, then check [the changelog](https://github.com/ocombe/ng2-translate/releases) to know which version is the last compatible version.


## Plugins
- [Localize Router](https://github.com/Greentube/localize-router) by @meeroslav: An implementation of routes localization for Angular 2. If you need localized urls (for example /fr/page and /en/page).
- [.po files Loader](https://www.npmjs.com/package/@biesbjerg/ng2-translate-po-loader) by @biesbjerg: Use .po translation files with ng2-translate
- [ng2-translate-extract](https://www.npmjs.com/package/@biesbjerg/ng2-translate-extract) by @biesbjerg: Extract translatable strings from your projects

## Additional Framework Support

* [Use with NativeScript](https://github.com/NathanWalker/nativescript-ng2-translate/issues/5#issuecomment-257606661)
