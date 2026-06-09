// @ts-check
const tseslint = require("typescript-eslint");
const rootConfig = require("../../eslint.config.js");

module.exports = tseslint.config(
    ...rootConfig,
    {
        files: ["**/*.ts"],
        rules: {
            // test-app is a non-shipped demo. Its components keep an explicit
            // ChangeDetectionStrategy.Default (the cross-version-safe equivalent of
            // the v22 schematic's Eager) to preserve their observable-subscribe
            // rendering (e.g. AppComponent subscribes to onLangChange/onTranslationChange
            // and assigns plain properties). Enforcing OnPush here would mean
            // refactoring demo code, which is out of scope for the toolchain upgrade.
            "@angular-eslint/prefer-on-push-component-change-detection": "off",
        },
    },
    {
        files: ["**/*.html"],
        rules: {
            // test-app is desktop-only; accessibility findings are intentionally out
            // of scope for the demo app.
            "@angular-eslint/template/click-events-have-key-events": "off",
            "@angular-eslint/template/interactive-supports-focus": "off",
        },
    },
);
