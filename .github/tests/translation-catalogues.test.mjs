import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
    auditTranslations,
    listTranslationFiles,
    readCatalogue,
} from "../../skills/ngx-translate/scripts/catalogues.mjs";

async function fixture(t) {
    const temporary = await mkdtemp(join(tmpdir(), "ngx-translate-skill-"));
    // Canonical paths also exercise confinement on macOS, where /var is a symlink.
    const root = join(await realpath(temporary), "locales");
    await mkdir(root);
    t.after(() => rm(temporary, { recursive: true, force: true }));
    return root;
}

test("compares nested/flat keys, array entries, placeholders and scalar types", async (t) => {
    const root = await fixture(t);
    await writeFile(
        join(root, "en.json"),
        JSON.stringify({
            greeting: "Hello {{ name }} {{name}}",
            menu: { title: "Menu", missing: "Missing" },
            items: ["One {{count}}", "Two"],
            enabled: true,
            empty: "",
            nullable: null,
        }),
    );
    await writeFile(
        join(root, "fr.json"),
        JSON.stringify({
            greeting: "Bonjour {{person}}",
            "menu.title": "Menu",
            items: ["Un {{ count }}", "Deux"],
            enabled: "oui",
            empty: "",
            nullable: "valeur",
            extra: "Plus",
        }),
    );
    assert.deepEqual(await auditTranslations(root, "en.json", ["fr.json", "fr.json"]), {
        sourceFile: "en.json",
        results: [
            {
                file: "fr.json",
                missingKeys: ["menu.missing"],
                extraKeys: ["extra"],
                placeholderMismatches: [{ key: "greeting", missing: ["name"], extra: ["person"] }],
                typeMismatches: [
                    { key: "enabled", expected: "boolean", actual: "string" },
                    { key: "nullable", expected: "null", actual: "string" },
                ],
            },
        ],
    });
});

test("accepts BOM, empty catalogues, empty values and inherited-looking keys", async (t) => {
    const root = await fixture(t);
    await writeFile(
        join(root, "en.json"),
        '\uFEFF{"__proto__":"safe","constructor":"safe","empty":{},"array":[]}',
    );
    assert.deepEqual(
        [...(await readCatalogue(root, "en.json"))],
        [
            ["__proto__", "safe"],
            ["constructor", "safe"],
            ["empty", {}],
            ["array", []],
        ],
    );
    await writeFile(join(root, "empty.json"), "{}");
    assert.deepEqual(await auditTranslations(root, "empty.json", ["empty.json"]), {
        sourceFile: "empty.json",
        results: [
            {
                file: "empty.json",
                missingKeys: [],
                extraKeys: [],
                placeholderMismatches: [],
                typeMismatches: [],
            },
        ],
    });
});

test("uses the default parser's whitespace rules and ignores placeholder order/repetition", async (t) => {
    const root = await fixture(t);
    await writeFile(
        join(root, "en.json"),
        JSON.stringify({ text: "{{a}} {{ b }} {{a}} {{  ignored  }}" }),
    );
    await writeFile(join(root, "de.json"), JSON.stringify({ text: "{{b}} {{a}}" }));
    const { results } = await auditTranslations(root, "en.json", ["de.json"]);
    assert.deepEqual(results[0].placeholderMismatches, []);
});

test("lists direct JSON files, excluding subdirectories and symlinks", async (t) => {
    const root = await fixture(t);
    await mkdir(join(root, "feature"));
    await writeFile(join(root, "en.json"), "{}");
    await writeFile(join(root, "fr.JSON"), "{}");
    await writeFile(join(root, "notes.txt"), "ignore");
    await writeFile(join(root, "feature", "en.json"), "{}");
    await symlink(join(root, "en.json"), join(root, "link.json"));
    assert.deepEqual(await listTranslationFiles(root, "."), { files: ["en.json", "fr.JSON"] });
    assert.deepEqual(await listTranslationFiles(root, "feature"), {
        files: [join("feature", "en.json")],
    });
});

test("rejects traversal, absolute paths, sibling-prefix escapes and external symlinks", async (t) => {
    const root = await fixture(t);
    const outside = `${root}-outside`;
    await mkdir(outside);
    await writeFile(join(outside, "secret.json"), '{"secret":"do not return"}');
    await symlink(outside, join(root, "linked"), "dir");
    for (const path of ["../locales-outside/secret.json", join(outside, "secret.json")]) {
        await assert.rejects(
            readCatalogue(root, path),
            /relative to the configured translation root/,
        );
    }
    await assert.rejects(
        readCatalogue(root, "linked/secret.json"),
        /Symbolic links must stay inside/,
    );
    await assert.rejects(listTranslationFiles(root, "linked"), /Symbolic links must stay inside/);
    await assert.rejects(
        listTranslationFiles(root, ".."),
        /relative to the configured translation root/,
    );
});

test("rejects malformed JSON, non-object roots and ambiguous flat/nested keys", async (t) => {
    const root = await fixture(t);
    for (const [contents, error] of [
        ['{"password":"never echo this",', /Invalid JSON catalogue: en.json/],
        ["[]", /JSON object/],
        ["null", /JSON object/],
        ['"text"', /JSON object/],
        ['{"a.b":"flat","a":{"b":"nested"}}', /Ambiguous flat and nested translation key: a.b/],
    ]) {
        await writeFile(join(root, "en.json"), contents);
        await assert.rejects(readCatalogue(root, "en.json"), error);
    }
    await assert.rejects(readCatalogue(root, "notes.txt"), /must be JSON files/);
    await assert.rejects(readCatalogue(root, "missing.json"), /ENOENT/);
    await mkdir(join(root, "directory.json"));
    await assert.rejects(readCatalogue(root, "directory.json"), /regular files/);
});

test("limits file size, entry count and nesting depth", async (t) => {
    const root = await fixture(t);
    for (const [contents, error] of [
        [JSON.stringify({ huge: "x".repeat(1024 * 1024) }), /1 MiB/],
        [
            JSON.stringify(Object.fromEntries(Array.from({ length: 10_001 }, (_, i) => [i, "x"]))),
            /10,000 entries/,
        ],
        ['{"a":'.repeat(101) + '"value"' + "}".repeat(101), /100 nesting levels/],
    ]) {
        await writeFile(join(root, "en.json"), contents);
        await assert.rejects(readCatalogue(root, "en.json"), error);
    }
});

test(
    "rejects named pipes without waiting for a writer",
    { skip: process.platform === "win32" },
    async (t) => {
        const root = await fixture(t);
        const pipe = join(root, "pipe.json");
        assert.equal(spawnSync("mkfifo", [pipe]).status, 0);
        await assert.rejects(readCatalogue(root, "pipe.json"), /regular files/);
    },
);
