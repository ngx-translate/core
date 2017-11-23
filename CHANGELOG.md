# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="9.0.0"></a>
# [9.0.0](https://github.com/ngx-translate/core/compare/v8.0.0...v9.0.0) (2017-11-23)


### Bug Fixes

* **ngx-translate:** updated build to fix "Unexpected token import errors" ([9add703](https://github.com/ngx-translate/core/commit/9add703)), closes [#724](https://github.com/ngx-translate/core/issues/724) [#581](https://github.com/ngx-translate/core/issues/581)


### BREAKING CHANGES

* **ngx-translate:** I've finally taken the time to update the entire build system for the library using ng-packagr instead of my own custom webpack config.
I've also added support for rxjs lettable operators at the same time, it means that I've been forced to add a peer dependency for RxJS >= 5.5.2. and I've updated the minimum Angular version to >=5.0.0.
The library should be much smaller (from ~80ko to ~20ko for the umd bundle!) and it now supports ES2015 to be tree-shackable which might drop the size even more. 
It should also fix the "Unexpected token import errors" that some people were experiencing.
Unfortunately this might be breaking people since the peer dependency have changed and that's why it's a new major version.
