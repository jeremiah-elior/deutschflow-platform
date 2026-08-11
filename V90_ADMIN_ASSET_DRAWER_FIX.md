# DeutschFlow V90 — Chapter asset save + right-side drawer

Version: `V90_ADMIN_ASSET_DRAWER_FIX_2026_08_12`

## Save/Publish
The physical upload succeeds first. The following chapter_assets save is Zod-validated before MySQL is updated. V90 accepts boolean-compatible true/false, 0/1 and string 0/1 for asset isActive, while the admin always sends a real boolean. The API now includes the first failing validation field directly in the message.

## Chapter Files UI
The permanent side inspector is removed. Add New, View and Replace open a right-side slide-over drawer. The table stays full width behind it. Save and Save & publish are in the drawer footer.

No database migration is required. Rebuild API and admin; do not reuse stale dist output. `/__version` should report `V90_ADMIN_ASSET_DRAWER_FIX_2026_08_12`.
