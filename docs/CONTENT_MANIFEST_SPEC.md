# DeutschFlow Content Manifest Spec

This is the stable contract for Android and iOS. Content changes should happen in admin and manifests, not through new app builds.

## Bootstrap

```http
GET /v1/app/bootstrap?platform=android&appVersion=1.0.0&lang=te
```

Returns active modules, active languages, and course list.

## Course level manifest

```http
GET /v1/courses/german/levels/A1/manifest?lang=te
```

Returns metadata and file URLs for only the requested language.

Important behavior:

- App should cache manifest by `version`.
- App should download audio only when user opens a chapter.
- Do not download all languages.

## LiD manifest

```http
GET /v1/lid/manifest?lang=te
```

Returns:

- compressed cards JSON URL
- intro video URL
- tips audio URL by language
- image base URL and mapping
- sample paper URLs
- exam info URL

## Cache rules for Android/iOS

1. Store manifest locally.
2. Compare `version` and `sha256`.
3. Download changed files only.
4. Use `catalog_id` for LiD progress, never array index.
5. Use `chapterId` or chapter `slug` for course progress.
