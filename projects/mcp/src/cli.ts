#!/usr/bin/env node
import { readFile, realpath, stat } from "node:fs/promises";
import { parseArgs } from "node:util";
import { McpServer, type CallToolResult } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { auditTranslations, listTranslationFiles } from "./catalogues.js";

const usage = "Usage: ngx-translate-mcp --root <translation-directory>";

async function toolResult(run: () => Promise<Record<string, unknown>>): Promise<CallToolResult> {
    try {
        const result = await run();
        const text = JSON.stringify(result);
        if (Buffer.byteLength(text) > 2 * 1024 * 1024) {
            throw new Error("Audit result exceeds 2 MiB; compare fewer or smaller catalogues.");
        }
        return {
            content: [{ type: "text", text }],
            structuredContent: result,
        };
    } catch (error) {
        return {
            isError: true,
            content: [
                { type: "text", text: error instanceof Error ? error.message : String(error) },
            ],
        };
    }
}

try {
    const { values } = parseArgs({
        options: { root: { type: "string" }, help: { type: "boolean", short: "h" } },
    });
    if (values.help) {
        console.log(usage);
    } else {
        if (!values.root) throw new Error(usage);
        const root = await realpath(values.root);
        if (!(await stat(root)).isDirectory())
            throw new Error("Translation root must be a directory.");
        const { version } = JSON.parse(
            await readFile(new URL("../package.json", import.meta.url), "utf8"),
        );
        serveStdio(() => {
            const server = new McpServer({ name: "@ngx-translate/mcp", version });
            const annotations = {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            };
            server.registerTool(
                "list_translation_files",
                {
                    description:
                        "List JSON files directly inside a directory relative to the configured translation root. Does not recurse or follow symlinks.",
                    inputSchema: z.object({ directory: z.string().min(1).default(".") }),
                    annotations,
                },
                ({ directory }) => toolResult(() => listTranslationFiles(root, directory)),
            );
            server.registerTool(
                "audit_translations",
                {
                    description:
                        "Compare target JSON catalogues against a source catalogue for missing/extra keys, value types and default ngx-translate {{placeholder}} parameters. Paths are relative to the configured translation root. Extra keys are not necessarily unused. Does not model runtime fallbacks, merged resources or custom parsers/compilers.",
                    inputSchema: z.object({
                        sourceFile: z.string().min(1),
                        targetFiles: z.array(z.string().min(1)).min(1).max(20),
                    }),
                    annotations,
                },
                ({ sourceFile, targetFiles }) =>
                    toolResult(() => auditTranslations(root, sourceFile, targetFiles)),
            );
            return server;
        });
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
