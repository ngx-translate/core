/**
 * End-to-end template type-check harness for the typed-key feature.
 *
 * Plain `tsc` (the `type-tests/` program) can assert the *type contract* a
 * template surface exposes, but only the Angular template compiler (ngtsc)
 * actually checks the string literal inside `{{ 'key' | translate }}`,
 * `[translate]="'key'"`, and `{{ t('key') }}`. This runner drives ngtsc once
 * per isolated program and asserts:
 *
 *   - good: in-union keys compile clean (exit 0),
 *   - bad-*: an out-of-union key is REJECTED (non-zero exit, citing the key).
 *
 * Run via `pnpm run test-templates`.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const ngc = join(here, "..", "..", "..", "node_modules", ".bin", "ngc");
const OUT_OF_UNION_KEY = "does.not.exist";

function compile(config) {
    try {
        execFileSync(ngc, ["-p", join(here, config)], { stdio: "pipe", encoding: "utf8" });
        return { ok: true, out: "" };
    } catch (error) {
        return { ok: false, out: `${error.stdout ?? ""}${error.stderr ?? ""}` };
    }
}

let failures = 0;

const good = compile("tsconfig.good.json");
if (good.ok) {
    console.log("PASS  in-union keys compile across pipe, [translate], *translateBlock");
} else {
    failures++;
    console.log(`FAIL  in-union keys should compile but ngtsc errored:\n${good.out}`);
}

const negatives = [
    ["tsconfig.bad-pipe.json", "| translate pipe"],
    ["tsconfig.bad-directive.json", "[translate] directive"],
    ["tsconfig.bad-block.json", "*translateBlock t()"],
];

for (const [config, label] of negatives) {
    const result = compile(config);
    if (!result.ok && result.out.includes(OUT_OF_UNION_KEY)) {
        console.log(`PASS  ${label} rejects an out-of-union key`);
    } else if (!result.ok) {
        failures++;
        console.log(`FAIL  ${label} errored, but not on the expected key:\n${result.out}`);
    } else {
        failures++;
        console.log(
            `FAIL  ${label} accepted an out-of-union key — template enforcement is missing`,
        );
    }
}

if (failures > 0) {
    console.error(`\n${failures} template type-check assertion(s) failed.`);
    process.exit(1);
}
console.log("\nAll template type-check assertions passed.");
