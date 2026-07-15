# DeutschFlow v69 Side Inspector Workflow

This version updates the Courses admin page to a production-style table + right-side inspector flow.

## Key UX changes

- Chapter files are managed from a list/table first.
- `Add New`, `View`, and `Replace` open/update the right-side inspector panel.
- The table stays visible while the admin works on the selected file.
- No hidden chapter IDs are required.
- File save, upload, publish, and delete actions show loading/saving states.
- Includes search, filters, selected row highlighting, and pagination.

## Runtime marker

After deployment, Hostinger runtime logs should show:

```text
DeutschFlow V69_SIDE_INSPECTOR_WORKFLOW_ACTIVE_2026_07_15
```

## Deployment

Use the same settings as v68/v66:

```text
Framework: Express
Root directory: ./
Entry file: server.js
Node version: 22.x preferred
NPM_CONFIG_PRODUCTION=false
```
