# Providers and isolation

## Configuration

### Root service

```
provideTranslateService({
    fallbackLanguage: "en",
    language: "de",

    loader: ...,
    compiler: ...,
    parser: ...,
    missingTranslationHandler: ...
})
```

User can provide loaders etc., otherwise defaults are used.

`fallbackLanguage` replaces `defaultLang` + `useDefaultLang`

- we make defaultLang und useDefaultLang deprecated

This defines the root component which provides the components to itself and the children.

### Child service

```
provideChildTranslateService({
    loader: ...,
    compiler: ...,
    parser: ...,
    missingTranslationHandler: ...,
})
```

Uses root components, can override them for its children - e.g. HttpLoader with own path.

Uses parents language and fallbackLanguage

## Isolated

**isolated**

- provideTranslateService() <-- store: A
    - provideTranslateService() <-- store: B uses own store
        - provideChildTranslateService() <-- B uses parent store

**extended**

- provideTranslateService() <-- store: A
    - provideChildTranslateService() <-- add to A
        - provideChildTranslateService() <-- add to A
            - provideChildTranslateService() <-- add to A

**module** (Module concept with forChild)

- forRoot() <-- store: A
- forChild() <-- A

**scoped** (future enhancement)

- provideTranslateService() <-- store: A
    - provideChildTranslateService() <-- B uses A
        - provideChildTranslateService() <-- C uses B
            - provideChildTranslateService() <-- D uses C
