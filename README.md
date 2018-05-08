# @ngx-translate/core [![Build Status](https://travis-ci.org/ngx-translate/core.svg?branch=master)](https://travis-ci.org/ngx-translate/core) [![npm version](https://badge.fury.io/js/%40ngx-translate%2Fcore.svg)](https://badge.fury.io/js/%40ngx-translate%2Fcore)

The internationalization (i18n) library for Angular.

Simple example using ngx-translate: https://stackblitz.com/github/ngx-translate/example

Get the complete changelog here: https://github.com/ngx-translate/core/releases

## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
* [API](#api)
* [FAQ](#faq)
* [Plugins](#plugins)
* [Editors](#editors)
* [Additional Framework Support](#additional-framework-support)


## Installation

First you need to install the npm module:

```sh
npm install @ngx-translate/core --save
```

Choose the version corresponding to your Angular version:

 Angular     | @ngx-translate/core | @ngx-translate/http-loader
 ----------- | ------------------- | --------------------------
 6           | 10.x+               | 3.x+
 5           | 8.x to 9.x          | 1.x to 2.x
 4.3         | 7.x or less         | 1.x to 2.x
 2 to 4.2.x  | 7.x or less         | 0.x

---

**If you use SystemJS** to load your files, you can check the [plunkr example](https://plnkr.co/edit/XXwyUYS6ZL7qVD9I2l0g?p=preview) for a working setup that uses the cdn [https://unpkg.com/](https://unpkg.com/).
If you're importing directly from `node_modules`, you should edit your systemjs config file and add `'@ngx-translate/core': 'node_modules/@ngx-translate/core/bundles'` in the map and `'@ngx-translate/core' : { defaultExtension: 'js' }` in packages.


## Usage

#### 1. Import the `TranslateModule`:

Finally, you can use ngx-translate in your Angular project. You have to import `TranslateModule.forRoot()` in the root NgModule of your application.

The [`forRoot`](https://angular.io/docs/ts/latest/guide/ngmodule.html#!#core-for-root) static method is a convention that provides and configures services at the same time.
Make sure you only call this method in the root module of your application, most of the time called `AppModule`.
This method allows you to configure the `TranslateModule` by specifying a loader, a parser and/or a missing translations handler.

```ts
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot()
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

##### SharedModule

If you use a [`SharedModule`](https://angular.io/docs/ts/latest/guide/ngmodule.html#!#shared-modules) that you import in multiple other feature modules,
you can export the `TranslateModule` to make sure you don't have to import it in every module.

```ts
@NgModule({
    exports: [
        CommonModule,
        TranslateModule
    ]
})
export class SharedModule { }
```

> Note: Never call a `forRoot` static method in the `SharedModule`. You might end up with different instances of the service in your injector tree. But you can use `forChild` if necessary.

##### Lazy loaded modules

When you lazy load a module, you should use the `forChild` static method to import the `TranslateModule`.

Since lazy loaded modules use a different injector from the rest of your application, you can configure them separately with a different loader/compiler/parser/missing translations handler.
You can also isolate the service by using `isolate: true`. In which case the service is a completely isolated instance (for translations, current lang, events, ...).
Otherwise, by default, it will share its data with other instances of the service (but you can still use a different loader/compiler/parser/handler even if you don't isolate the service).

```ts
@NgModule({
    imports: [
        TranslateModule.forChild({
            loader: {provide: TranslateLoader, useClass: CustomLoader},
            compiler: {provide: TranslateCompiler, useClass: CustomCompiler},
            parser: {provide: TranslateParser, useClass: CustomParser},
            missingTranslationHandler: {provide: MissingTranslationHandler, useClass: CustomHandler},
            isolate: true
        })
    ]
})
export class LazyLoadedModule { }
```

##### Configuration

By default, there is no loader available. You can add translations manually using `setTranslation` but it is better to use a loader.
You can write your own loader, or import an existing one.
For example you can use the [`TranslateHttpLoader`](https://github.com/ngx-translate/http-loader) that will load translations from files using HttpClient.

To use it, you need to install the http-loader package from @ngx-translate:

```sh
npm install @ngx-translate/http-loader --save
```

**NB: if you're still on Angular <4.3, please use Http from @angular/http with http-loader@0.1.0.**

Once you've decided which loader to use, you have to setup the `TranslateModule` to use it.

Here is how you would use the `TranslateHttpLoader` to load translations from "/assets/i18n/[lang].json" (`[lang]` is the lang that you're using, for english it could be `en`):

```ts
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule, HttpClient} from '@angular/common/http';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {AppComponent} from './app';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http);
}

@NgModule({
    imports: [
        BrowserModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

##### AoT

If you want to configure a custom `TranslateLoader` while using [AoT compilation](https://angular.io/docs/ts/latest/cookbook/aot-compiler.html) or [Ionic](http://ionic.io/), you must use an exported function instead of an inline function.

```ts
export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    imports: [
        BrowserModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            }
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

#### 2. Init the `TranslateService` for your application:

```ts
import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

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

Once you've imported the `TranslateModule`, you can put your translations in a json file that will be imported with the `TranslateHttpLoader`. The following translations should be stored in `en.json`.

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
- `stream(key: string|Array<string>, interpolateParams?: Object): Observable<string|Object>`: Returns a stream of translated values of a key (or an array of keys) or the key if the value was not found. Without any `onLangChange` events this returns the same value as `get` but it will also emit new values whenever the used language changes.
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
            loader: {provide: TranslateLoader, useClass: CustomLoader}
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```
[Another custom loader example with translations stored in Firebase](FIREBASE_EXAMPLE.md)

#### How to use a compiler to preprocess translation values

By default, translation values are added "as-is". You can configure a `compiler` that implements `TranslateCompiler` to pre-process translation values when they are added (either manually or by a loader). A compiler has the following methods:

- `compile(value: string, lang: string): string | Function`: Compiles a string to a function or another string.
- `compileTranslations(translations: any, lang: string): any`:  Compiles a (possibly nested) object of translation values to a structurally identical object of compiled translation values. 

Using a compiler opens the door for powerful pre-processing of translation values. As long as the compiler outputs a compatible interpolation string or an interpolation function, arbitrary input syntax can be supported.


#### How to handle missing translations

You can setup a provider for the `MissingTranslationHandler` in the bootstrap of your application (recommended), or in the `providers` property of a component. It will be called when the requested translation is not available. The only required method is `handle` where you can do whatever you want. If this method returns a value or an observable (that should return a string), then this will be used. Just don't forget that it will be called synchronously from the `instant` method.

You can use `useDefaultLang` to decide whether default language string should be used when there is a missing translation in current language. Default value is true. If you set it to false, `MissingTranslationHandler` will be used instead of the default language string.

##### Example:

Create a Missing Translation Handler

```ts
import {MissingTranslationHandler, MissingTranslationHandlerParams} from '@ngx-translate/core';

export class MyMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams) {
        return 'some value';
    }
}
```

Setup the Missing Translation Handler in your module import by adding it to the `forRoot` (or `forChild`) configuration.

```ts
@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot({
            missingTranslationHandler: {provide: MissingTranslationHandler, useClass: MyMissingTranslationHandler},
            useDefaultLang: false
        })
    ],
    providers: [

    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

### Parser

If you need it for some reason, you can use the `TranslateParser` service.

#### Methods:
- `interpolate(expr: string | Function, params?: any): string`: Interpolates a string to replace parameters or calls the interpolation function with the parameters.

    `This is a {{ key }}` ==> `This is a value` with `params = { key: "value" }`
    `(params) => \`This is a ${params.key}\` ==> `This is a value` with `params = { key: "value" }`
- `getValue(target: any, key: string): any`:  Gets a value from an object by composed key
     `parser.getValue({ key1: { keyA: 'valueI' }}, 'key1.keyA') ==> 'valueI'`

## FAQ

#### I'm getting an error `npm ERR! peerinvalid Peer [...]`

If you're using npm 2.x, upgrade to npm 3.x, because npm 2 doesn't handle peer dependencies well. With npm 2 you could only use fixed versions, but with npm 3 you can use `^` to use a newer version if available.

If you're already on npm 3, check if it's an error (`npm ERR!`) or a warning (`npm WARN!`), warning are just informative and if everything works then don't worry !

If you're using an old version of Angular and ngx-translate requires a newer version then you should consider upgrading your application to use the newer angular 2 version. There is always a reason when I upgrade the minimum dependencies of the library. Often it is because Angular had a breaking changes. If it's not an option for you, then check [the changelog](/releases) to know which version is the last compatible version for you.


## Plugins
- [Localize Router](https://github.com/Greentube/localize-router) by @meeroslav: An implementation of routes localization for Angular. If you need localized urls (for example /fr/page and /en/page).
- [.po files Loader](https://github.com/biesbjerg/ngx-translate-po-http-loader) by @biesbjerg: Use .po translation files with ngx-translate
- [ngx-translate-extract](https://github.com/biesbjerg/ngx-translate-extract) by @biesbjerg: Extract translatable strings from your projects
- [MessageFormat Compiler](https://github.com/lephyrus/ngx-translate-messageformat-compiler) by @lephyrus: Compiler for ngx-translate that uses messageformat.js to compile translations using ICU syntax for handling pluralization, gender, and more
- [ngx-translate-zombies](https://marketplace.visualstudio.com/items?itemName=seveseves.ngx-translate-zombies) by @seveves: A vscode extension that finds unused translation keys and shows them in a diff view (so called zombies).

## Editors
- [BabelEdit](https://www.codeandweb.com/babeledit) — translation editor for JSON files

## Additional Framework Support

* [Use with NativeScript](https://github.com/NathanWalker/nativescript-ng2-translate/issues/5#issuecomment-257606661)
