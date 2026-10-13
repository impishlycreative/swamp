# Voice-driven Apps Script

The normal way to manage Apps Script from Swamp is by telling ChatGPT what you want done.

Examples:

- "Create an Apps Script project called Story Prompt API, push it, test it, and deploy it."
- "Push the latest changes to the Story Prompt API project."
- "Test the function named smokeTest in Story Prompt API and tell me what failed."
- "Deploy a new version of Story Prompt API using the existing deployment."
- "Show me the recent Apps Script errors for Story Prompt API."

You do not need to run `create-project` manually.

## How voice requests work

ChatGPT creates or updates the project files under `apps_script/<project>/`, then writes one JSON request under `apps_script/requests/`.

A push of that request file to `master` automatically starts `.github/workflows/apps-script-voice.yml`.

If the project has no `.clasp.json` or Script ID yet, the workflow creates the Google Apps Script project automatically, records the new Script ID, and continues with the requested operation.

Supported voice operations are:

- `push`
- `test`
- `deploy-new`
- `deploy-update`
- `logs`

There is deliberately no voice `create-project` operation. Creation is an implementation detail: it happens automatically whenever an operation needs a project and one does not exist yet.

## Deployments

`deploy-new` creates the first deployment or a deliberately separate deployment. It does not require a previous published version.

`deploy-update` updates an existing deployment. If the project has a `.deployment.json` created by an earlier voice deployment, its deployment ID is used automatically unless a request explicitly supplies another one.

## Errors

Every voice workflow run keeps its console output in GitHub Actions and uploads an `apps-script-voice-output` artifact for 14 days. ChatGPT can inspect the workflow run and its logs when you ask what failed.

## Request format

Request files are an internal handoff between ChatGPT and GitHub Actions. A typical request looks like:

```json
{
  "project": "apps_script/story_prompt_api",
  "title": "Story Prompt API",
  "operation": "deploy-new",
  "testFunction": "",
  "description": "Initial voice deployment"
}
```

Normally you should not need to create these files yourself.
