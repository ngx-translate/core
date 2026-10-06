# @ngx-translate/core

## Overview

`@ngx-translate/core` is the primary internationalization (i18n) library for Angular  
applications, allowing developers to easily implement and manage multiple languages  
in their projects. With `@ngx-translate/core`, you can dynamically switch languages  
within the app, seamlessly adapting content to suit various locales.

### Documentation

- [Official Documentation](https://ngx-translate.org/)
- [Getting Started Tutorial: How to Translate Your Angular App with NGX-Translate](https://www.codeandweb.com/babeledit/tutorials/how-to-translate-your-angular-app-with-ngx-translate)

## Templates inside translations

`TranslateSlotsComponent` renders a translation and puts your own Angular templates where the
message has placeholders. Import `TranslateSlotsComponent` and `TranslateSlotDirective`, plus
whatever the templates use, for example `TranslatePipe` or `RouterLink`.

```html
<p translateSlots="UPLOAD_HINT" [translateParams]="{ max: 5 }">
    <ng-template translateSlot="link">
        <a routerLink="/upload">{{ "UPLOAD_LINK" | translate }}</a>
    </ng-template>
</p>
```

```json
{
    "UPLOAD_HINT": "Drop up to {{max}} files here or {{link}}.",
    "UPLOAD_LINK": "select them"
}
```

- Bind `[translateSlots]` for a dynamic key. Don't combine it with `translate` or `ngx-translate`
  on the same element.
- Slots are `ng-template` children of the element, also inside `@if`. Other children aren't
  rendered, but Angular still creates them.
- The message and the params are rendered as text, never as HTML. A param value containing
  `{{link}}` doesn't render a slot.
- Every occurrence of a slot gets its own view. Views are kept when the language or the order of
  the slots changes.
- Slots are passed to the parser like params, so custom parsers and compiled translations work as
  well. A slot name can't also be used as a param.
- Key extraction tools don't know `translateSlots` yet. Mark the key with `_()` in TypeScript and
  bind it with `[translateSlots]`.

See also: [Angular template fragments](https://angular.dev/guide/templates/ng-template).
