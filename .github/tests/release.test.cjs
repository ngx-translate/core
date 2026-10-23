const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { createRequire } = require("node:module");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");

// Reuse the YAML parser already installed with ESLint.
const yaml = createRequire(require.resolve("eslint"))("js-yaml");
const workflow = yaml.load(readFileSync(join(__dirname, "../workflows/release.yml"), "utf8"));
const release = workflow.jobs["github-release"];

test("GitHub Releases run after npm publishing with scoped write access", () => {
    assert.equal(release.needs, "publish");
    assert.equal(workflow.permissions.contents, "read");
    assert.deepEqual(release.permissions, { contents: "write" });
    assert.equal(release.steps[0].env.GH_TOKEN, "${{ github.token }}");
    assert.equal(release.steps[0].env.GH_REPO, "${{ github.repository }}");
});

for (const { name, tag, exists = false, failure = false } of [
    { name: "stable release", tag: "v18.1.0" },
    { name: "release candidate", tag: "v18.1.0-rc.3" },
    { name: "other prerelease", tag: "v18.1.0-beta.1" },
    { name: "existing release", tag: "v18.1.0-rc.3", exists: true },
    { name: "GitHub failure", tag: "v18.1.0", failure: true },
]) {
    test(name, () => {
        const directory = mkdtempSync(join(tmpdir(), "github-release-test-"));
        const calls = join(directory, "calls");
        try {
            const result = spawnSync(
                "bash",
                [
                    "-e",
                    "-o",
                    "pipefail",
                    "-c",
                    `gh() {
                        printf '%s\\n' "$*" >> "$CALLS"
                        if [ "$2" = view ]; then return "$VIEW_STATUS"; fi
                        return "$CREATE_STATUS"
                    }
                    ${release.steps[0].run}`,
                ],
                {
                    encoding: "utf8",
                    env: {
                        ...process.env,
                        GITHUB_REF_NAME: tag,
                        CALLS: calls,
                        VIEW_STATUS: exists ? "0" : "1",
                        CREATE_STATUS: failure ? "1" : "0",
                    },
                },
            );
            assert.equal(result.status, failure ? 1 : 0, result.stderr);
            const expected = [`release view ${tag}`];
            if (!exists) {
                expected.push(
                    `release create ${tag} --verify-tag --title ${tag} --generate-notes` +
                        (tag.includes("-") ? " --prerelease --latest=false" : ""),
                );
            }
            assert.deepEqual(readFileSync(calls, "utf8").trim().split("\n"), expected);
        } finally {
            rmSync(directory, { recursive: true, force: true });
        }
    });
}
