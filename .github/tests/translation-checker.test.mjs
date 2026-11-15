import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

async function fixture(t) {
    const root = await mkdtemp(join(tmpdir(), "ngx-translate checker "));
    t.after(() => rm(root, { recursive: true, force: true }));
    const installed = join(root, "installed skill");
    // A copied skill must work outside the repository without node_modules or generated files.
    await cp(fileURLToPath(new URL("../../skills/ngx-translate", import.meta.url)), installed, {
        recursive: true,
    });
    const cli = join(installed, "scripts", "check.mjs");
    const run = (...args) =>
        spawnSync(process.execPath, [cli, ...args], {
            cwd: root,
            encoding: "utf8",
            timeout: 5000,
            maxBuffer: 3 * 1024 * 1024,
        });
    return { root, cli, run };
}

test("installed skill lists and audits files with JSON output and meaningful exit codes", async (t) => {
    const { root, run } = await fixture(t);
    const source = '{"hello":"Hello {{name}}","missing":"Here"}';
    const target = '{"hello":"Bonjour {{person}}"}';
    await writeFile(join(root, "en.json"), source);
    await writeFile(join(root, "fr.json"), target);
    const listed = run("list", "--root", root);
    assert.equal(listed.status, 0, listed.stderr);
    assert.equal(listed.stderr, "");
    assert.deepEqual(JSON.parse(listed.stdout), { files: ["en.json", "fr.json"] });

    const audit = run("audit", "--root", root, "--source", "en.json", "--target", "fr.json");
    assert.equal(audit.status, 1, audit.stderr);
    assert.equal(audit.stderr, "");
    assert.deepEqual(JSON.parse(audit.stdout), {
        sourceFile: "en.json",
        results: [
            {
                file: "fr.json",
                missingKeys: ["missing"],
                extraKeys: [],
                placeholderMismatches: [{ key: "hello", missing: ["name"], extra: ["person"] }],
                typeMismatches: [],
            },
        ],
    });
    const clean = run("audit", "--root", root, "--source", "en.json", "--target", "en.json");
    assert.equal(clean.status, 0, clean.stderr);
    assert.deepEqual(JSON.parse(clean.stdout).results[0], {
        file: "en.json",
        missingKeys: [],
        extraKeys: [],
        placeholderMismatches: [],
        typeMismatches: [],
    });
    assert.equal(await readFile(join(root, "en.json"), "utf8"), source);
    assert.equal(await readFile(join(root, "fr.json"), "utf8"), target);

    for (const value of [
        { hello: "Hello {{name}}", missing: "Here", extra: "Extra" },
        { hello: "Hello {{name}}", missing: 1 },
    ]) {
        await writeFile(join(root, "difference.json"), JSON.stringify(value));
        assert.equal(
            run("audit", "--root", root, "--source", "en.json", "--target", "difference.json")
                .status,
            1,
        );
    }
});

test("reports file errors on stderr without returning a partial audit", async (t) => {
    const { root, run } = await fixture(t);
    await writeFile(join(root, "en.json"), '{"hello":"Hello"}');
    await writeFile(join(root, "bad.json"), "broken json");
    for (const file of ["../secret.json", "missing.json", "bad.json"]) {
        const result = run(
            "audit",
            "--root",
            root,
            "--source",
            "en.json",
            "--target",
            "en.json",
            "--target",
            file,
        );
        assert.equal(result.status, 2, result.stderr);
        assert.equal(result.stdout, "");
        assert.equal(typeof JSON.parse(result.stderr).error, "string");
    }
});

test("rejects oversized reports", async (t) => {
    const { root, run } = await fixture(t);
    await writeFile(
        join(root, "large.json"),
        JSON.stringify(
            Object.fromEntries(
                Array.from({ length: 2000 }, (_, i) => [`key${i}${"x".repeat(400)}`, "value"]),
            ),
        ),
    );
    for (const file of ["a.json", "b.json", "c.json"]) await writeFile(join(root, file), "{}");
    const result = run(
        "audit",
        "--root",
        root,
        "--source",
        "large.json",
        "--target",
        "a.json",
        "--target",
        "b.json",
        "--target",
        "c.json",
    );
    assert.equal(result.status, 2, result.stderr);
    assert.equal(result.stdout, "");
    assert.match(JSON.parse(result.stderr).error, /Result exceeds 2 MiB/);
});

test("CLI help and argument validation work without external dependencies", async (t) => {
    const { root, cli, run } = await fixture(t);
    const help = run("--help");
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /Usage:/);
    assert.equal(help.stderr, "");
    for (const args of [
        [],
        ["--unknown"],
        ["unknown", "--root", root],
        ["list"],
        ["list", "--root", cli],
        ["list", "--root", root, "--directory", ""],
        ["list", "--root", root, "unexpected"],
        ["list", "--root", root, "--source", "en.json"],
        ["audit", "--root", root, "--source", "en.json"],
        ["audit", "--root", root, "--target", "fr.json"],
        ["audit", "--root", root, "--source", "en.json", "--target", ""],
        ["audit", "--root", root, "--source", "en.json", "--target", "fr.json", "--directory", "."],
        [
            "audit",
            "--root",
            root,
            "--source",
            "en.json",
            ...Array(21).fill(["--target", "fr.json"]).flat(),
        ],
    ]) {
        const result = run(...args);
        assert.equal(result.status, 2, result.stderr);
        assert.equal(result.stdout, "");
        assert.ok(JSON.parse(result.stderr).error.length > 0);
    }
});
