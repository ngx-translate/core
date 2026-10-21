import { fileURLToPath } from "node:url";
import angular from "@analogjs/vite-plugin-angular";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [angular({ tsconfig: "tsconfig.spec.json" })],
    resolve: {
        alias: {
            "@ngx-translate/core": fileURLToPath(
                new URL("../dist/ngx-translate/fesm2022/ngx-translate-core.mjs", import.meta.url),
            ),
            "@ngx-translate/http-loader": fileURLToPath(
                new URL(
                    "../dist/http-loader/fesm2022/ngx-translate-http-loader.mjs",
                    import.meta.url,
                ),
            ),
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        include: ["projects/**/*.spec.ts"],
        setupFiles: ["compat/vitest.setup.ts"],
        coverage: {
            include: ["projects/ngx-translate/src/lib/**/*.ts"],
            reporter: ["text", "html", "lcov"],
        },
    },
});
