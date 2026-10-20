import { defineConfig } from "vitest/config";

export default defineConfig({
    // Keep bundled setup hooks and mock state isolated between spec files.
    test: { isolate: true },
});
