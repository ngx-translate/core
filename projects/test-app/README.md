# Providers and isolation

```
provideTranslateService()
```

Provides the service with all components

- store
- loader
- compiler
- parser
- missingTranslationsHandler

This creates an ISOLATED instance.

I don't know why somebody would not like to create an isolated instance when using
this function.

## Scenarios

### Single TranslateService for the whole app

No problem with `provideTranslateService()` in _app.config.ts_.
Simply use `inject(TranslateService)` to get access to it from everywhere.

### Sub-Tree of the app uses different language

The main app is for a user (e.g. 'en') who configures pages for his customers (e.g. in 'fr').

No problem:

- `provideTranslateService()` in _app.config.ts_ with language set to "en"
- `provideTranslateService()` in _customerview.component.ts_ with language set to "fr"

Loader, parser, compiler must be provided for this component.

### Lazy loading

???
