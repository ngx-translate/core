/**
 * Registry augmentation shared by every template-test program.
 *
 * `declare module` augmentation is compilation-global, so these template tests
 * live in their own isolated `ngc` programs (see the `tsconfig.*.json` files in
 * this folder, run via `pnpm run test-templates`) — augmenting the registry in
 * the karma spec or the app would retype every other template.
 */
import { DeepKeys } from "@ngx-translate/core";

interface EnTranslations {
    home: { title: "Home"; subtitle: "Welcome" };
    nav: { back: "Back" };
}

declare module "@ngx-translate/core" {
    interface NgxTranslateConfig {
        keys: DeepKeys<EnTranslations>;
    }
}
