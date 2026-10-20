# @ngx-translate/core ![Buildstatus](https://github.com/ngx-translate/core/actions/workflows/ngx-translate-test.yml/badge.svg) [![npm version](https://badge.fury.io/js/%40ngx-translate%2Fcore.svg)](https://badge.fury.io/js/%40ngx-translate%2Fcore)

The internationalization (i18n) library for Angular.
<br/>

## Angular 16 - 21

The new [documentation](https://ngx-translate.org/) now covers installation on
Angular 16+ and is divided into smaller, more readable sections, making it
easier to digest than this big README. It also documents the additional
interfaces and explains how to develop custom plugins.

- [Full documentation](https://ngx-translate.org)
- [Migration guide ngx-translate v17 -> v18](https://ngx-translate.org/getting-started/migration-guide/)
- [Migration guide ngx-translate v16 -> v17](https://ngx-translate.org/v17/getting-started/migration-guide/)
- [Release Notes](https://github.com/ngx-translate/core/releases)

In addition to that, a getting started tutorial is available here:
[How to Translate Your Angular App with NGX-Translate](https://www.codeandweb.com/babeledit/tutorials/how-to-translate-your-angular-app-with-ngx-translate)

## Support for older versions

We only support the current version with new updates and fixes.

When using an EOL (End Of Lifetime) version, you have a few options:

- **Upgrade** to the current version of Ngx-translate. We have worked hard to make upgrading simple. You can view our migration guide to assist you in your upgrade.

- **Remain Out of Date**: Continue using the outdated version, but be aware that you will be subject to security risks and bugs.

- **Commercial Support** for EOL versions Our partner [HeroDevs](https://www.herodevs.com/support/nes-angular?utm_source=ngx-translate&utm_medium=referral&utm_campaign=angular_support_link&utm_id=NgxTranslateReferral) offers commercial security support for EOL versions of Ngx-translate. If you cannot migrate but must remain secure you can contact them [here](https://www.herodevs.com/support/nes-angular?utm_source=ngx-translate&utm_medium=referral&utm_campaign=angular_support_link&utm_id=NgxTranslateReferral).

## Recommended tools

- [BabelEdit](https://www.codeandweb.com/babeledit) — translation editor for ngx-translate files

## Development tests

Tests use Vitest with jsdom and do not require Chrome.

```sh
pnpm install
pnpm run build-all
pnpm run test-ci                  # Both libraries, once
pnpm test --watch                 # Core tests with coverage, in watch mode
pnpm run coverage                # Core coverage report in coverage/
pnpm exec ng test http-loader --watch=false
pnpm exec ng test test-app --watch=false
```

Angular 21–22 use the native `@angular/build:unit-test` builder. On Angular 22,
code splitting is disabled to avoid uninitialized exports across test bundles with Vitest 4.
Angular 18–20 use Analog's Vitest builder and the shared setup in `compat/`.
Angular 18–19 have no native Vitest builder; Angular 20's experimental runner
fails to initialize shared classes in this suite.
These older configurations run the same specs with Vitest 3 and Vite 6 to
retain Node 18 support. `test-and-build-for-all.sh` runs the compatibility matrix.

Use Vitest spies and fake timers in new specs. Return a promise or use `async`/`await`
for asynchronous assertions; callback-style `done` tests are not supported.
