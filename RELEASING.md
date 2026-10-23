# Releasing

`@ngx-translate/core` and `@ngx-translate/http-loader` are published to npm by the
[Release workflow](.github/workflows/release.yml) whenever a `v*` tag is pushed. You don't need
an npm account or token: npm trusts this workflow directly (npm trusted publishing via OIDC), and
every release is signed with a provenance statement that links it to the commit it was built from.
After both packages publish successfully, the workflow creates a GitHub Release for the same tag
with automatically generated release notes. Release candidates are marked as prereleases and
do not replace the latest stable GitHub Release.

Anyone with the **maintain** or **admin** role on this repository can release.

## Release a version

Both packages always get the same version.

1. **Make sure `develop` contains everything** that should go into the release, and the
   Node.js CI workflow is green.

2. **Bump the version** in both packages:
    - `projects/ngx-translate/package.json` → `"version": "X.Y.Z"`
    - `projects/http-loader/package.json` → `"version": "X.Y.Z"` and the peer dependency
      `"@ngx-translate/core": ">=X.Y.Z"`

    Commit on `develop` as `chore: bump version to X.Y.Z` and push. The pre-commit hook builds both
    libraries and runs the tests.

3. **Push the tag** for that commit:

    ```bash
    git tag vX.Y.Z <commit>
    git push origin vX.Y.Z
    ```

4. **Watch the run** under Actions → Release. It checks that the tag matches both package
   versions, runs lint, build and tests, publishes both packages, then creates the GitHub Release
   in a separate `github-release` job.

5. **Review the release notes** under Releases → the new version. Edit the generated notes to
   add highlights, breaking changes and migration instructions when needed. Existing releases
   are preserved if the `github-release` job is rerun.

## Versions and npm dist-tags

Follow [semver](https://semver.org/): new features → minor, fixes only → patch.

| Tag                       | npm dist-tag | Install with                     |
| ------------------------- | ------------ | -------------------------------- |
| `v18.1.0`                 | `latest`     | `npm i @ngx-translate/core`      |
| `v18.1.0-rc.0` (any `-…`) | `next`       | `npm i @ngx-translate/core@next` |

For a release candidate, use `X.Y.Z-rc.N` in step 2 and tag `vX.Y.Z-rc.N`. Users on `latest`
are not affected.

## Safety rails

- Only maintainers and admins can create `v*` tags. Release tags cannot be moved or deleted.
- A tag that doesn't match both `package.json` versions stops the run before anything is
  published.
- npm never accepts the same version twice. If a run fails halfway (e.g. core published, the
  loader not), fix the problem and release the next version (e.g. the next `-rc.N`). The
  same tag can't be reused.
- If both npm packages published and only `github-release` failed, use **Re-run failed jobs**
  or rerun that job alone. Do not rerun the successful `publish` job or bump the version to
  repair a missing GitHub Release.

## Existing tags without a GitHub Release

Tags pushed before this automation was added need their GitHub Release created once. Confirm
that the original Release workflow published both npm packages, then go to Releases → Draft a
new release, select the existing tag, generate and review the notes, and publish it. Mark tags
containing a prerelease suffix such as `-rc.3` as **pre-release**; keep the latest stable release
selected as **Latest**. This creates only the GitHub entry, without republishing npm packages or
moving the tag.

Rerunning an old workflow uses its original workflow definition, so it does not pick up this
new job.

## Troubleshooting

| Error in the Release run                      | Cause                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects/… is X, tag is vY`                  | Version bump missing or tag on the wrong commit. Bump and tag again with a new version.                                                                                   |
| `E422 … "repository.url" … expected to match` | A package's `package.json` lacks `"repository": { "url": "https://github.com/ngx-translate/core" }`.                                                                      |
| `E403` / `E404` / `ENEEDAUTH` on publish      | npm no longer trusts the run. The trusted publisher on npmjs.com is bound to the workflow file name `release.yml` and the environment `npm-publish`. Don't rename either. |
