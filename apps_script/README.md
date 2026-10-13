# Google Apps Script from Swamp

This folder is for Apps Script projects that are managed from GitHub.

## What the GitHub Action can do

From **Actions > Apps Script > Run workflow** you can choose a project folder and:

- `test` - check JSON/JavaScript syntax, push it to Google, and optionally run a test function.
- `push` - push the current project files to Google Apps Script.
- `deploy-new` - push the files, create a new Apps Script version, and create a new deployment. This works even when the project has never been deployed before.
- `deploy-update` - push the files, create a new version, and update an existing deployment ID.
- `logs` - fetch recent Apps Script / Cloud Logging output when logging has been configured for that project.

Every run keeps its console output in GitHub Actions and also uploads an `apps-script-output` log artifact for 14 days.

## One-time authentication setup

Do **not** commit Google credentials to this public repository.

1. Enable the Apps Script API for the Google account you will use with clasp.
2. Install clasp locally: `npm install --global @google/clasp@latest`
3. Sign in once: `clasp login`
4. Find the generated `.clasprc.json` file in your home folder.
5. In this GitHub repository, open **Settings > Secrets and variables > Actions**.
6. Create a repository secret named `CLASP_AUTH_JSON` and paste the complete contents of `.clasprc.json` into it.

The workflow recreates that authentication file only inside the temporary GitHub runner.

## Add a project

Copy `_template` to a new folder under `apps_script/`, for example:

`apps_script/newsletter_handler/`

Rename `.clasp.json.example` to `.clasp.json` and replace `PASTE_SCRIPT_ID_HERE` with the Apps Script project's Script ID.

The normal layout is:

```text
apps_script/
  newsletter_handler/
    .clasp.json
    src/
      appsscript.json
      Code.js
```

A project only needs to exist in Apps Script and have a Script ID. It does **not** need to have an older published version or deployment.

## Runtime tests

A normal `test` always performs local syntax checks and then `clasp push`, which lets Google validate the project without requiring a published version.

If you enter a `test_function`, the workflow also tries to execute that function remotely. The template manifest enables the Apps Script Execution API. If the project has never had an API-executable deployment, the workflow attempts to create the first one automatically and retries the function.

Remote function execution and `logs` need the project's Google Cloud / OAuth setup required by current clasp. Basic `push`, `deploy-new`, and `deploy-update` do not depend on a previous deployment.

## Deployment IDs

Use `deploy-new` for the first deployment or when you deliberately want another deployment ID.

Use `deploy-update` when callers should keep using the same deployment URL/ID. Paste the existing deployment ID into the workflow's `deployment_id` field.
