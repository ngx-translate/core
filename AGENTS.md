# Agent instructions for ngx-translate/core

## Repository map

This Angular workspace develops `@ngx-translate/core`, `@ngx-translate/http-loader`, and a demo app.

| Location                                | Purpose                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `projects/ngx-translate/src/lib/`       | Translation service, store, providers, pipes, directives, and plugin interfaces         |
| `projects/ngx-translate/src/tests/`     | Core Jasmine tests and shared `test-helpers.ts`                                         |
| `projects/http-loader/src/lib/`         | HTTP loaders and their colocated tests                                                  |
| `projects/http-loader/src/test-helper/` | HTTP test providers and interceptor helpers                                             |
| `projects/*/src/public-api.ts`          | Published library exports                                                               |
| `projects/test-app/`                    | Demo for translation APIs and service hierarchies                                       |
| `compat/`                               | Older Angular toolchain configurations and packed-package consumer checks               |
| `docs/`                                 | Internal design proposals; website documentation lives in the separate repository below |

## Setup and validation

Use a Node.js version from the latest-build job in `.github/workflows/ngx-translate-test.yml`
and the pnpm version declared in `package.json`'s `packageManager`. Install with
`pnpm install --frozen-lockfile`; keep `pnpm-lock.yaml` as the workspace lockfile.

Run commands from the repository root:

| Task                              | Command                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Build both libraries, core first  | `pnpm run build-all`                                                                                       |
| Lint the workspace                | `pnpm run lint`                                                                                            |
| Run both library test suites once | `pnpm run test-ci`                                                                                         |
| Run a focused core test           | `pnpm exec ng test ngx-translate --watch=false --browsers=ChromeHeadless --include='tests/<name>.spec.ts'` |
| Run HTTP loader tests once        | `pnpm exec ng test http-loader --watch=false --browsers=ChromeHeadless`                                    |
| Serve the demo                    | `pnpm exec ng serve test-app`                                                                              |
| Build the demo                    | `pnpm exec ng build test-app`                                                                              |

- Build libraries before tests or the demo: `tsconfig.json` resolves package-name imports to
  `dist/ngx-translate` and `dist/http-loader`. Rebuild after library changes to avoid testing stale
  artifacts. Edit source files under `projects/`; `dist/` is generated output.
- Tests use Jasmine/Karma and require Chrome for `ChromeHeadless`. Set `CHROME_BIN` to an installed
  Chrome executable if discovery fails.
- For library changes, run lint, build-all, and test-ci as CI does. For demo changes, also build the
  demo. For instruction-only edits, check formatting and `git diff --check`.
- Add a focused regression test for behavioral fixes. Reuse the existing test helpers; use
  `HttpTestingController` for HTTP requests and controlled observables or `fakeAsync` for async
  behavior. Cover success and failure paths when changing loading or retry behavior.

## Implementation and public API

- Follow the strict TypeScript and Angular template settings and the existing ESLint/Prettier
  configuration. Format only touched files; `pnpm run format` rewrites the whole repository.
- `TranslateService` coordinates language selection, loading, fallback lookup, and reactive APIs;
  `TranslateStore` owns translations and their change notifications. Preserve both signal updates
  and observable events, including subscription cleanup when the owning injector is destroyed.
- `provideTranslateService()` starts an independent hierarchy; `provideChildTranslateService()`
  connects to a parent. When changing scoping or lookup, test connected children and isolated
  subtrees. `docs/proposal-providers-and-scoping.md` explains the design; verify behavior against
  current source and tests.
- HTTP loaders return empty translations for failed resources by default. `failOnError: true`
  propagates failures and enables service-level retries. Preserve both modes when changing loading.
- For public API changes, check the package's `src/public-api.ts`, `ITranslateService`, callers,
  tests, and `compat/consume/consume.ts` as applicable. Keep existing third-party service
  implementations compatible; newer optional capabilities on `ITranslateService` are intentional.

## Angular compatibility

- The workspace toolchain is newer than the minimum Angular version supported by the libraries.
  Check package `peerDependencies`, `compat/a*/`, and the CI matrix before using newer Angular or
  TypeScript APIs in published code.
- `test-and-build-for-all.sh [major|latest]` switches toolchains using nvm, replaces root
  `package.json` and `angular.json`, removes lockfiles and dependencies, and restores files from
  `compat/latest/` on exit. Run it in a disposable checkout. Its restore step does not preserve
  the original root files, and `compat/latest/` can differ from them.
- When changing dependency or build configuration, review both the root files and their
  `compat/latest/` counterparts, plus affected older-version configurations.
- For changes to public types or the build toolchain, use the packed-artifact check in
  `compat/consume/run.sh`. Build both libraries, run `npm pack` inside each library's `dist/`
  directory, then run `bash compat/consume/run.sh`. This checks emitted declarations with older
  TypeScript versions and `skipLibCheck: false`; source builds alone do not establish compatibility.

## Documentation

- The documentation website is maintained in the separate [CodeAndWeb/ngx-translate.org](https://github.com/CodeAndWeb/ngx-translate.org) repository.
- For website documentation changes, use the sibling checkout at `../ngx-translate.org` when available; its documentation source is in `src/content/docs/`. Read that repository's agent instructions before editing.
- Propose documentation pull requests in `CodeAndWeb/ngx-translate.org`. When a change needs both library code and website documentation updates, prepare separate PRs in their respective repositories and cross-link them.

## Contributions

- Use Conventional Commit messages, enforced by `commitlint.config.ts` and the commit-msg hook.
- The pre-commit hook runs lint-staged, builds both libraries, and runs both library test suites;
  account for the Chrome requirement when committing.
- Library and demo PRs target `ngx-translate/core`. Describe the behavior change and validation;
  route website documentation PRs as described below.
