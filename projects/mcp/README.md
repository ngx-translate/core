# @ngx-translate/mcp

A local, read-only [MCP server](https://modelcontextprotocol.io/) for ngx-translate JSON catalogues.
Agents can list translation files and compare languages for missing keys, extra keys, mismatched
value types, and interpolation parameters. Requires Node.js 22 or later. Angular is not required.

## Connect an agent

After the first npm release, add this entry to your MCP client's configuration:

```json
{
    "mcpServers": {
        "ngx-translate": {
            "command": "npx",
            "args": ["-y", "@ngx-translate/mcp", "--root", "/absolute/path/to/your/app/public/i18n"]
        }
    }
}
```

Use the client's equivalent server configuration if it does not use `mcpServers`. The `--root`
argument is required: choose the directory containing the catalogues you want to share. Tool paths
are relative to this root; paths and symlinks that escape it are rejected. The server communicates
over stdio and does not open a network listener or modify files. Its results are visible to the
connected agent.

### Run an unreleased checkout

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @ngx-translate/mcp run build
node projects/mcp/dist/cli.js --root /absolute/path/to/your/app/public/i18n
```

For an MCP client, set `command` to `node` and `args` to
`["/absolute/path/to/core/projects/mcp/dist/cli.js", "--root", "/absolute/path/to/app/public/i18n"]`.

## Tools

| Tool                     | Arguments                                | Result                                                                                                       |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `list_translation_files` | `directory` (default `"."`)              | Sorted paths of JSON files directly in that directory; no recursion or symlinks                              |
| `audit_translations`     | `sourceFile`, `targetFiles` (1–20 paths) | Missing and extra keys, placeholder differences, and scalar/empty-container type differences for each target |

For example, ask the agent: “Compare `fr.json` and `de.json` against `en.json`; explain missing
translations and mismatched parameters.” It can call:

```json
{
    "sourceFile": "en.json",
    "targetFiles": ["fr.json", "de.json"]
}
```

Given `{"hello":"Hello {{name}}"}` and `{"hello":"Bonjour {{person}}"}`, the target report contains:

```json
{
    "file": "fr.json",
    "missingKeys": [],
    "extraKeys": [],
    "placeholderMismatches": [{ "key": "hello", "missing": ["name"], "extra": ["person"] }],
    "typeMismatches": []
}
```

Results are returned as both structured content and JSON text. Invalid input or unreadable files
produce an MCP tool error; an audit succeeds only when every requested catalogue can be read.

## Audit boundaries

- Supports JSON objects, nested or dotted keys, array indices, and the default ngx-translate
  `{{parameter}}` syntax. Repeated parameters and their order do not affect the comparison.
- Rejects ambiguous flat/nested keys that flatten to the same path, instead of choosing a value.
- Compares files as supplied. It does not emulate fallback languages, HTTP resource merging,
  custom parsers, or ICU/messageformat compilers. A reported missing key may be intentional.
- Extra keys mean “absent from the source catalogue”, not “unused in application code”. The server
  does not scan templates or recommend deleting dynamically referenced keys.
- Limits each file to 1 MiB, each catalogue to 10,000 entries and 100 nesting levels, and directory
  listings to 1,000 JSON files. Audit results over 2 MiB return an error. Compare fewer files or split
  catalogues that exceed these limits.

## Development

```bash
pnpm --filter @ngx-translate/mcp run lint
pnpm --filter @ngx-translate/mcp test
pnpm --filter @ngx-translate/mcp exec npm pack
```

Tests cover catalogue comparisons, file access boundaries, and a real MCP client communicating
with the executable over stdio. This package is versioned independently; the repository's `v*`
release workflow currently publishes only core and http-loader.
