# Create a brand-new Apps Script project

1. Copy `apps_script/_template` to a new folder, for example `apps_script/newsletter_handler`.
2. Keep the source files under that folder's `src/` directory.
3. Commit the new folder to GitHub. Do not create `.clasp.json` yourself.
4. Open **Actions > Apps Script > Run workflow**.
5. Set Project to the new folder, such as `apps_script/newsletter_handler`.
6. Choose `create-project`.
7. Enter the project title you want Google Apps Script to use.
8. Run the workflow.

The workflow creates a new Apps Script project, saves its Script ID into `.clasp.json` on the same GitHub branch, and pushes the source files to Google.

No older deployment or published version is required.

For a project that already exists in Google Apps Script, use the `.clasp.json.example` file in `_template`, rename it to `.clasp.json`, and replace the placeholder with the existing Script ID.
