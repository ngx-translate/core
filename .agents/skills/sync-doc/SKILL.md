---
name: sync-doc
description: Sync documentation in CodeAndWeb/ngx-translate.org with the current ngx-translate/core branch. Use when asked to document branch changes or create the corresponding website documentation PR.
---

# Sync documentation

Turn the current core branch's user-facing changes into a documentation PR in
`CodeAndWeb/ngx-translate.org`. Keep the core checkout unchanged.

## 1. Establish the change

Read the core repository's `AGENTS.md`, Git status, branch, and remotes. Resolve the
comparison base from the user's explicit ref, otherwise the current branch's PR
base, otherwise the repository's remote default branch. Fetch the relevant base
when possible; disclose a stale comparison if fetching fails. Ask for a base if
none can be resolved.

Review the entire branch diff from its merge-base with that base, plus staged,
unstaged, and relevant untracked source changes. Read the affected implementation,
public exports, callers, and tests. Record which changes are uncommitted so the PR
does not imply they are available on GitHub.

Map each user-facing change to documentation: API signatures, defaults, loading
and error behavior, configuration, examples, compatibility, or migration steps.
Use the source and tests as evidence; commit messages alone do not establish
behavior. Internal-only changes need no documentation. Stop with a short reason
when the branch has no documentation impact.

## 2. Locate the documentation checkout

Use a user-provided checkout path first, then check `../ngx-translate.org` relative
to the core repository root. If needed, inspect known workspace projects or Git
worktrees. Confirm the candidate is accessible, has `src/content/docs/`, and has a
remote for `CodeAndWeb/ngx-translate.org` or a verified fork of it.

If no accessible local checkout exists, ask for its absolute path or access and
pause documentation edits. Do not silently substitute remote-only editing or clone
into an arbitrary location. Continue any independent core analysis while waiting.

Read the documentation repository's applicable agent instructions, Git status,
package scripts, and version configuration. Resolve its default branch separately
from the core base. Reuse a documentation branch only when it belongs to this same
change; otherwise create `codex/docs-<topic>` from the documentation default branch.
Use a separate worktree when needed to preserve unrelated work. Never reset,
stash, or include someone else's changes to make room for this workflow.

## 3. Write the affected documentation

Read these project-local skills from the selected documentation checkout before
drafting; both are required parts of this workflow:

- `.agents/skills/i-have-adhd/SKILL.md`
- `.agents/skills/humanizer/SKILL.md`

Manage both skills through the Skills CLI in the documentation repository root.
Restore missing skills from `skills-lock.json` with `npx skills experimental_install`.
If a skill has no lock entry, install it with the corresponding command:

```sh
npx skills add ayghri/i-have-adhd --skill i-have-adhd --agent codex --yes
npx skills add blader/humanizer --skill humanizer --agent codex --yes
```

Keep the generated `skills-lock.json` entries with any installed skill changes.
Use `npx skills update --project` when an update is requested; preserve installed
versions during ordinary documentation syncs. If installation is blocked, report
what access is needed instead of substituting an untracked manual copy.

Search `src/content/docs/` for affected APIs and read neighboring pages. Select the
documentation version from the site's configuration and the library change;
preserve archived versions unless the change applies to them. Update existing
pages and linked examples where possible. Adjust navigation only when adding a
page requires it. If the correct version already documents every change, report
that result and avoid an empty PR.

Draft with `i-have-adhd`: put the useful answer or first action first, keep paragraphs
short, and number procedures. Apply its presentation rules without dropping API
details, prerequisites, or failure behavior. Published pages should stand alone;
session progress updates and chat prompts belong in the conversation.

Apply `humanizer` in file mode to the prose, and in embedded mode to the PR text.
Preserve code, API names, commands, paths, links, frontmatter, and technical claims
during the style pass. Verify examples against the branch implementation and keep
unreleased features clearly identified without inventing a release version.

## 4. Validate and open the PR

Run the documentation repository's required checks and build using its declared
tooling. Validate changed recipe examples with its recipe checks when applicable.
Check links, anchors, frontmatter, and `git diff --check`. Review the final diff
against the change map so every affected behavior is covered and unrelated edits
are excluded. Report checks that could not run; fix failures introduced by the
documentation changes before publishing.

Commit only this workflow's documentation files using the repository's commit
conventions, and push the documentation branch to a writable remote or fork. Use
the connected GitHub tools when available, or `gh`. Look for a matching open PR
before creating one, including after an ambiguous creation response.

Create or update the PR against `CodeAndWeb/ngx-translate.org` with its verified
base branch. Invoking this workflow to sync documentation includes committing,
pushing, and opening that PR; honor any explicit draft-only or local-only limit.
The PR should explain the behavior documented, identify the source core branch,
commit or PR, and report validation and any uncommitted source dependency. Use a
draft PR when the documentation depends on unmerged core changes or validation is
blocked. Link an existing core PR in the docs PR and add the docs link to the core
PR description when writable, preserving its existing text. Do not create an
unrelated core PR or merge either PR.

If authentication or permissions prevent publishing, retain the local changes and
prepared PR text and report the exact blocker. After successful creation, attach
the PR to the current chat when the app provides `attach_artifact`.

Return the documentation PR link, the behavior covered, and validation results.
