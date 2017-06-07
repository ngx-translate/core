# Migration guide from ng2-translate 5 to ngx-translate 6

The 6.0.0 release has introduced a lot of breaking changes.
Hopefully it shouldn't take long to update all of your code and be up and running with the new version.

The main steps are:
- update the imports
- update the npm packages
- replace the `TranslateStaticLoader` (if you use it) with the `TranslateHttpLoader`
- update the module import

Here is a detailed list of the changes that you need to make:

1. The library is now available under the namespace `ngx-translate`, rename your imports to `@ngx-translate/core`:
    
    From `import {TranslateModule} from 'ng2-translate';`
    
    To `import {TranslateModule} from '@ngx-translate/core';`

2. Update your package.json accordingly, replace `ng2-translate` with `@ngx-translate/core`, and update the version number to the latest 6.x version ([check the current release here](https://github.com/ngx-translate/core/releases)).

If you're using the `TranslateStaticLoader`, it is no longer part of the core but it is available as an external plugin now named `TranslateHttpLoader`, available on npm as `@ngx-translate/http-loader`.
The idea behind this is that I don't want to force the dependency to the `HttpModule` when it might not be necessary.
If you don't use this loader, go directly to point 5.

3. Extract the `TranslateStaticLoader` from your imports, and rename it to `TranslateHttpLoader` that you will import from `@ngx-translate/http-loader`:
 
    From `import {TranslateStaticLoader} from 'ng2-translate';`
     
    To `import {TranslateHttpLoader} from '@ngx-translate/http-loader';`
    
4. Update your package.json accordingly by adding `@ngx-translate/http-loader` ([check the current release here](https://github.com/ngx-translate/http-loader/releases)).

5. Run `npm install` to install the new packages.

6. The module import `root` method has changed a bit, it expects an object of parameters. If you use any kind of loader, you will have to provide it. It doesn't use the `TranslateStaticLoader` by default anymore.
    But it is now easier to provide a custom parser or missing translation handler.
    
    ```ts
    TranslateModule.forRoot({
        provide: TranslateLoader,
        useFactory: (http: Http) => new TranslateStaticLoader(http, '/assets/i18n', '.json'),
        deps: [Http]
    })
    ```
    
    Is now:
    
    ```ts
    TranslateModule.forRoot({
        loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [Http]
        }
    })
    ```
    
    And if you want to also specify a custom parser or missing translation handler, you can do it like that:
    
    ```ts
    TranslateModule.forRoot({
        loader: {provide: TranslateLoader, useClass: CustomLoader},
        parser: {provide: TranslateParser, useClass: CustomParser},
        missingTranslationHandler: {provide: MissingTranslationHandler, useClass: CustomHandler}
    })
    ```
    
7. If you use lazy loaded modules, a new `forChild` method has been added.
It has the benefit to declare the pipe/directive/service for your module, but it doesn't declare a new instance of the `TranslateStore`.
In this new release, the store has been added to link all instances of the service. It is used behind the scenes by the service and you don't have to use it yourself.

    This means that by default the lazy loaded modules will work just as before and use the available translations that you might have loaded in your application,
but you can also use a different configuration from the main one.

    For example you can have a different custom loader for each lazy loaded module that only add a specific subset of translations to your existing ones.
    
    Also since you might want this module to run in complete isolation, there is a new parameter `isolate` that you can use when you import the module:
    
    ```ts
    TranslateModule.forChild({
        isolate: true
    })
    ```
    
    This will ensure that your instance of the `TranslateService` doesn't use the store and is completely independent from the other instances.
    If you use this, make sure that you setup the service for this module (calling `.use`, ...).
    

Hopefully this should be all that you need to do to use this new release of ngx-translate.
