import { constants } from "node:fs";
import { open, readdir, realpath } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_ENTRIES = 10_000;

async function resolveWithinRoot(root, path) {
    const isOutside = (candidate) => {
        const location = relative(root, candidate);
        return location === ".." || location.startsWith(`..${sep}`) || isAbsolute(location);
    };
    if (isAbsolute(path) || isOutside(resolve(root, path))) {
        throw new Error("Paths must be relative to the configured translation root.");
    }
    const resolved = await realpath(resolve(root, path));
    if (isOutside(resolved)) {
        throw new Error("Symbolic links must stay inside the configured translation root.");
    }
    return resolved;
}

export async function listTranslationFiles(root, directory) {
    const entries = await readdir(await resolveWithinRoot(root, directory), {
        withFileTypes: true,
    });
    const files = entries
        .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".json")
        .map((entry) => relative(root, resolve(root, directory, entry.name)))
        .sort();
    if (files.length > 1000) {
        throw new Error("Too many JSON files; choose a smaller translation directory (max 1000).");
    }
    return { files };
}

export async function readCatalogue(root, path) {
    if (extname(path).toLowerCase() !== ".json") {
        throw new Error("Translation catalogues must be JSON files.");
    }
    // Nonblocking open lets us reject named pipes without waiting for a writer.
    const file = await open(
        await resolveWithinRoot(root, path),
        constants.O_RDONLY | constants.O_NONBLOCK,
    );
    let contents;
    try {
        const info = await file.stat();
        if (!info.isFile() || info.size > MAX_FILE_BYTES) {
            throw new Error("Translation catalogues must be regular files no larger than 1 MiB.");
        }
        // Bound the read even if a file grows after stat().
        const buffer = Buffer.alloc(MAX_FILE_BYTES + 1);
        let size = 0;
        while (size < buffer.length) {
            const { bytesRead } = await file.read(buffer, size, buffer.length - size, null);
            if (!bytesRead) break;
            size += bytesRead;
        }
        if (size > MAX_FILE_BYTES) {
            throw new Error("Translation catalogues must be no larger than 1 MiB.");
        }
        contents = buffer.toString("utf8", 0, size).replace(/^\uFEFF/, "");
    } finally {
        await file.close();
    }

    let catalogue;
    try {
        catalogue = JSON.parse(contents);
    } catch {
        throw new Error(`Invalid JSON catalogue: ${path}`);
    }
    if (catalogue === null || typeof catalogue !== "object" || Array.isArray(catalogue)) {
        throw new Error(`Catalogue must contain a JSON object: ${path}`);
    }

    const translations = new Map();
    let count = 0;
    const visit = (value, segments) => {
        if (++count > MAX_ENTRIES || segments.length > 100) {
            throw new Error("Catalogue exceeds 10,000 entries or 100 nesting levels.");
        }
        if (value !== null && typeof value === "object" && Object.keys(value).length) {
            for (const [key, child] of Object.entries(value)) {
                visit(child, [...segments, key]);
            }
            return;
        }
        const key = segments.join(".");
        if (translations.has(key)) {
            throw new Error(`Ambiguous flat and nested translation key: ${key}`);
        }
        translations.set(key, value);
    };
    for (const [key, value] of Object.entries(catalogue)) {
        visit(value, [key]);
    }
    return translations;
}

function placeholders(value) {
    // Match TranslateDefaultParser; custom parser/compiler syntax is outside this audit.
    return new Set(Array.from(value.matchAll(/{{\s?([^{}\s]*)\s?}}/g), (match) => match[1]));
}

function valueType(value) {
    return value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
}

export async function auditTranslations(root, sourceFile, targetFiles) {
    const source = await readCatalogue(root, sourceFile);
    const sourceKeys = [...source.keys()].sort();
    const results = [];
    for (const file of [...new Set(targetFiles)]) {
        const target = await readCatalogue(root, file);
        const placeholderMismatches = [];
        const typeMismatches = [];
        for (const key of sourceKeys) {
            if (!target.has(key)) continue;
            const expected = source.get(key);
            const actual = target.get(key);
            if (valueType(expected) !== valueType(actual)) {
                typeMismatches.push({
                    key,
                    expected: valueType(expected),
                    actual: valueType(actual),
                });
            } else if (typeof expected === "string" && typeof actual === "string") {
                const sourceParams = placeholders(expected);
                const targetParams = placeholders(actual);
                const missing = [...sourceParams]
                    .filter((param) => !targetParams.has(param))
                    .sort();
                const extra = [...targetParams].filter((param) => !sourceParams.has(param)).sort();
                if (missing.length || extra.length) {
                    placeholderMismatches.push({ key, missing, extra });
                }
            }
        }
        results.push({
            file,
            missingKeys: sourceKeys.filter((key) => !target.has(key)),
            extraKeys: [...target.keys()].filter((key) => !source.has(key)).sort(),
            placeholderMismatches,
            typeMismatches,
        });
    }
    return { sourceFile, results };
}
