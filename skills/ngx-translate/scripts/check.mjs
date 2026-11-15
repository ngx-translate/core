#!/usr/bin/env node
import { realpath, stat } from "node:fs/promises";
import { parseArgs } from "node:util";
import { auditTranslations, listTranslationFiles } from "./catalogues.mjs";

const usage = `Usage:
  node check.mjs list --root <translation-directory> [--directory <relative-directory>]
  node check.mjs audit --root <translation-directory> --source <source.json> --target <target.json> [--target <another.json> ...]

Reads JSON catalogues without modifying files. Requires Node.js 22+.
Paths are relative to --root; paths and symlinks outside it are rejected.
Audit supports nested/dotted keys, arrays and default {{parameter}} interpolation.
Extra keys are absent from the source catalogue, not necessarily unused.
Limits: 20 targets, 1 MiB/file, 10,000 entries, 100 nesting levels,
1,000 files per directory listing, 2 MiB of JSON output.

JSON goes to stdout. Errors go to stderr as {"error":"..."}.
Exit codes: 0 = no differences (or successful list/help), 1 = differences,
2 = invalid arguments or an incomplete audit. No partial report on error.`;

try {
    const { values, positionals } = parseArgs({
        allowPositionals: true,
        options: {
            root: { type: "string" },
            directory: { type: "string" },
            source: { type: "string" },
            target: { type: "string", multiple: true },
            help: { type: "boolean", short: "h" },
        },
    });
    if (values.help) {
        console.log(usage);
    } else {
        const [command] = positionals;
        if (positionals.length !== 1 || !["list", "audit"].includes(command) || !values.root) {
            throw new Error("Choose list or audit and supply --root. See --help for usage.");
        }
        if (command === "list" && (values.source !== undefined || values.target !== undefined)) {
            throw new Error("--source and --target are only supported by audit.");
        }
        if (command === "audit" && values.directory !== undefined) {
            throw new Error("--directory is only supported by list.");
        }
        if (
            command === "audit" &&
            (!values.source ||
                !values.target?.length ||
                values.target.length > 20 ||
                values.target.some((path) => !path))
        ) {
            throw new Error("Audit requires --source and 1–20 nonempty --target paths.");
        }
        if (values.directory === "") throw new Error("--directory must not be empty.");

        const root = await realpath(values.root);
        if (!(await stat(root)).isDirectory())
            throw new Error("Translation root must be a directory.");
        const result =
            command === "list"
                ? await listTranslationFiles(root, values.directory ?? ".")
                : await auditTranslations(root, values.source, values.target);
        const text = JSON.stringify(result);
        if (Buffer.byteLength(text) > 2 * 1024 * 1024) {
            throw new Error("Result exceeds 2 MiB; compare fewer or smaller catalogues.");
        }
        console.log(text);
        if (
            command === "audit" &&
            result.results.some(
                (report) =>
                    report.missingKeys.length ||
                    report.extraKeys.length ||
                    report.placeholderMismatches.length ||
                    report.typeMismatches.length,
            )
        ) {
            process.exitCode = 1;
        }
    }
} catch (error) {
    console.error(
        JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
    );
    process.exitCode = 2;
}
