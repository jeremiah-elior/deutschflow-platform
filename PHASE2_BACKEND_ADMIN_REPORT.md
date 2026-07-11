# Phase 2 Backend/Admin Report

Generated for DeutschFlow Phase 2: React Admin + Node/Supabase backend.

## Included

- React + Vite admin app
- Node.js + Express API app
- Shared TypeScript/Zod package
- Supabase SQL migration
- LiD import/publish pipeline
- Course/level/chapter/audio metadata pipeline
- Manifest-based app APIs
- Seed LiD study JSON

## API principle

Mobile apps should consume stable manifest endpoints instead of hardcoding file names or depending on frequent API changes.

## Validation performed in sandbox

- Zip package generated successfully.
- Seed LiD JSON is included at `seed/lid/bamf_2025_study_material_en_te.json`.
- Supabase/Node code is provided as source only.

## Not run in sandbox

`npm install` and TypeScript build were not run because this sandbox does not have internet access for package installation.

## First local commands

```bash
cd deutschflow-platform
npm install
npm run typecheck
npm run build
```
