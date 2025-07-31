# Copilot Instructions for ngx-translate/core Monorepo

## Project Overview
- This monorepo contains the main `@ngx-translate/core` library (Angular i18n), the `@ngx-translate/http-loader` for loading translations via HTTP, and related test/demo apps.
- Supports Angular 16+ (see https://ngx-translate.org for full docs and migration guides).
- Key packages: `projects/ngx-translate` (core), `projects/http-loader` (HTTP loader), `projects/test-app` (demo/test app).

## Architecture & Patterns
- **Core Service:** `TranslateService` in `projects/ngx-translate/src/lib/translate.service.ts` is the main API for translation, language switching, and parameter interpolation.
- **Store:** `TranslateStore` manages language state and loaded translations. It exposes observables for language/translation changes and an `initialized$` BehaviorSubject for first-load detection.
- **Loader:** `TranslateLoader` is an interface for loading translations. `@ngx-translate/http-loader` implements this for HTTP/JSON files, supporting multiple resources and error silencing via `catchError`.
- **Customizability:** Most behaviors (missing translation handling, parameter interpolation, etc.) are injectable and overrideable.
- **Testing:** Uses Angular's TestBed and HttpTestingController for unit/integration tests. See `*.spec.ts` files for patterns.

## Developer Workflows
- **Build all packages:**
  ```sh
  npm run build-all
  # or for a specific Angular version:
  npm run build -- --configuration production
  ```
- **Test all packages:**
  ```sh
  npm run test-ci
  # or for a single package:
  ng test ngx-translate
  ```
- **Demo/test app:**
  - Located in `projects/test-app`. Use `ng serve` to run locally.
- **Multi-version support:**
  - Scripts and configs for Angular 16/17/18/19+ are in `package-a16.json`, `package-a17.json`, etc.
  - Use `test-and-build-for-all.sh` to loop over all supported versions.

## Project Conventions
- **Translation files:** JSON, loaded from `/assets/i18n/` by default. Multiple resources supported via config.
- **Error handling:** HTTP loader always silences errors and returns `{}` if a translation file fails to load.
- **Observables:** All state changes (language, translation, fallback) are observable. Use `.subscribe()` or `async` pipe in Angular templates.
- **Initialization:** The first successful translation load triggers `TranslateStore.initialized$` to `true`.
- **Testing:** Always use Angular's `HttpTestingController` for HTTP loader tests. See `http-loader.spec.ts` for patterns.

## Key Files & Directories
- `projects/ngx-translate/src/lib/translate.service.ts` — main translation logic
- `projects/ngx-translate/src/lib/translate.store.ts` — state management
- `projects/http-loader/src/lib/http-loader.ts` — HTTP loader implementation
- `projects/http-loader/src/lib/http-loader.spec.ts` — loader tests/examples
- `test-and-build-for-all.sh` — multi-version build/test script

## External Integrations
- **Angular CLI** for builds/tests

---
For more, see https://ngx-translate.org and the `README.md` files in each package.
