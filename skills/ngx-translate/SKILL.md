---
name: ngx-translate
description: Configure or migrate ngx-translate in Angular apps and audit JSON translation catalogues for missing keys, value types, and interpolation parameters. Use when adding translated UI, changing ngx-translate providers or loaders, upgrading the library, or checking language files.
license: MIT
---

# ngx-translate

## Match the application's version

Read the installed Angular, `@ngx-translate/core`, and `@ngx-translate/http-loader` versions and
the existing provider/loader configuration. Use the [official documentation](https://ngx-translate.org/)
with its version selector and the installed package's exports/types to choose supported APIs.
Keep the application's translation key conventions and catalogue layout.

For setup and translated UI:

- Configure the loader where the translation service is provided, and verify its URL prefix against
  the application's served assets. Import the translation pipe/directive where templates use them.
- Use reactive translation APIs when text must follow language changes. Use `instant()` only after
  the necessary catalogues are loaded; it does not wait for an HTTP request.
- In v18, `provideTranslateService()` starts an independent hierarchy;
  `provideChildTranslateService()` connects to the parent. Choose according to the intended scope.

For migrations, read the [migration guide](https://ngx-translate.org/getting-started/migration-guide/)
for the target major and inspect every affected caller. In v18, `TranslateModule` is removed and
`currentLang` is a signal. Preserve existing language selection, fallback behavior, and intentional
service isolation. Verify the affected application build/tests after changing providers or APIs.

## Audit catalogues

The bundled checker requires Node.js 22+ and has no dependencies or build step. Resolve
`scripts/check.mjs` relative to this skill's installed directory, even when the working directory
is the consumer application. Run its `--help` for the command reference and resource limits.

Identify the source language from the application's configuration or the user's request. If the
intended source remains ambiguous, ask before comparing. Choose the smallest directory containing
the relevant catalogues as `--root`; other paths are relative to it.

```bash
node "/path/to/installed/ngx-translate/scripts/check.mjs" list --root "/path/to/app/public/i18n"
node "/path/to/installed/ngx-translate/scripts/check.mjs" audit --root "/path/to/app/public/i18n" --source en.json --target fr.json --target de.json
```

The checker reads files and returns JSON. Interpret its exit code:

- `0`: completed with no differences, or a successful listing/help request.
- `1`: completed with differences; read the report on stdout.
- `2`: invalid input or an incomplete audit; read the JSON error on stderr. Resolve the cause and
  rerun before claiming any requested file passed.

Reports contain `sourceFile` and one entry in `results` per target: `file`, `missingKeys`,
`extraKeys`, `placeholderMismatches`, and `typeMismatches`. Placeholder mismatches identify the
key and its missing/extra parameter names. Type mismatches identify expected and actual types.

Interpret findings in the application's context:

- Nested objects and dotted keys are compared by flattened paths; arrays use numeric indices.
  Ambiguous flat/nested paths produce an error instead of silently selecting a value.
- Placeholder checks follow `TranslateDefaultParser`'s `{{parameter}}` syntax. Repeated parameters
  and their order are ignored. Custom parsers and ICU/messageformat compilers need their own validation.
- Files are compared as supplied. Account for runtime fallback languages and merged loader resources
  before treating an absent key as a defect.
- Extra keys are absent from the source catalogue. Confirm their usage, including dynamic keys,
  before proposing deletion. The checker does not scan application references.

For an audit request, report findings by file/key and explain any intentional differences. When the
user asks for fixes, preserve interpolation parameters and intended wording, then rerun the checker
on the affected catalogues. Report remaining differences and any validation limits explicitly.
