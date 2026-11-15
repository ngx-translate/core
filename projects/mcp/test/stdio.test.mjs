import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

// Use the same protocol test against the installed tarball during package verification.
const cli = process.env.MCP_TEST_CLI ?? fileURLToPath(new URL("../dist/cli.js", import.meta.url));

test(
    "stdio client discovers tools, audits files, handles failures and stays usable",
    { timeout: 15_000 },
    async (t) => {
        const root = await mkdtemp(join(tmpdir(), "ngx-translate-mcp-stdio-"));
        t.after(() => rm(root, { recursive: true, force: true }));
        await writeFile(join(root, "en.json"), '{"hello":"Hello {{name}}","missing":"Here"}');
        await writeFile(join(root, "fr.json"), '{"hello":"Bonjour {{person}}"}');
        const transport = new StdioClientTransport({
            command: process.execPath,
            args: [cli, "--root", root],
            stderr: "pipe",
        });
        const client = new Client({ name: "ngx-translate-mcp-test", version: "1.0.0" });
        t.after(() => client.close());
        await client.connect(transport);
        const { tools } = await client.listTools();
        assert.deepEqual(tools.map((tool) => tool.name).sort(), [
            "audit_translations",
            "list_translation_files",
        ]);
        assert.ok(
            tools.every((tool) => tool.annotations.readOnlyHint && !tool.annotations.openWorldHint),
        );
        assert.equal(client.getServerVersion().name, "@ngx-translate/mcp");
        const audit = await client.callTool({
            name: "audit_translations",
            arguments: { sourceFile: "en.json", targetFiles: ["fr.json"] },
        });
        assert.equal(audit.isError, undefined);
        assert.deepEqual(audit.structuredContent.results[0], {
            file: "fr.json",
            missingKeys: ["missing"],
            extraKeys: [],
            placeholderMismatches: [{ key: "hello", missing: ["name"], extra: ["person"] }],
            typeMismatches: [],
        });
        assert.deepEqual(JSON.parse(audit.content[0].text), audit.structuredContent);
        for (const args of [
            { sourceFile: "../secret.json", targetFiles: ["fr.json"] },
            { sourceFile: "missing.json", targetFiles: ["fr.json"] },
            { sourceFile: "en.json", targetFiles: [] },
            { sourceFile: "en.json", targetFiles: Array(21).fill("fr.json") },
        ]) {
            const result = await client.callTool({ name: "audit_translations", arguments: args });
            assert.equal(result.isError, true);
        }
        await writeFile(join(root, "bad.json"), "broken json");
        const invalid = await client.callTool({
            name: "audit_translations",
            arguments: { sourceFile: "bad.json", targetFiles: ["fr.json"] },
        });
        assert.equal(invalid.isError, true);
        const files = await client.callTool({ name: "list_translation_files", arguments: {} });
        assert.deepEqual(files.structuredContent, { files: ["bad.json", "en.json", "fr.json"] });
        await writeFile(
            join(root, "large.json"),
            JSON.stringify(
                Object.fromEntries(
                    Array.from({ length: 2000 }, (_, i) => [`key${i}${"x".repeat(400)}`, "value"]),
                ),
            ),
        );
        for (const file of ["a.json", "b.json", "c.json"]) {
            await writeFile(join(root, file), "{}");
        }
        const oversized = await client.callTool({
            name: "audit_translations",
            arguments: { sourceFile: "large.json", targetFiles: ["a.json", "b.json", "c.json"] },
        });
        assert.equal(oversized.isError, true);
        assert.match(oversized.content[0].text, /result exceeds 2 MiB/);
    },
);

test("CLI help and configuration errors do not open a server", () => {
    const help = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8", timeout: 5000 });
    assert.equal(help.status, 0);
    assert.match(help.stdout, /Usage: ngx-translate-mcp --root/);
    for (const args of [[], ["--unknown"], ["--root", cli]]) {
        const result = spawnSync(process.execPath, [cli, ...args], {
            encoding: "utf8",
            timeout: 5000,
        });
        assert.equal(result.status, 1);
        assert.equal(result.stdout, "");
        assert.ok(result.stderr.length > 0);
    }
});
