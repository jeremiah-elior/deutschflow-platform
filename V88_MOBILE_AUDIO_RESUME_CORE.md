# DeutschFlow Backend V88 — mobile audio/resume core

Version: `V88_MOBILE_AUDIO_RESUME_CORE_2026_08_11`

## Authoritative mobile bootstrap

`GET /v1/mobile/lessons?lang=te&level=A1`

The endpoint uses one MySQL query for the Home/player-first-paint metadata. It does not hydrate notes, transcript, vocabulary, or quiz relations.

Each lesson includes one exact selected-language audio asset:

```json
{
  "id": 1,
  "nativeLanguage": "te",
  "audio": {
    "url": "https://mydeutschflow.de/uploads/content/.../audio/te/file.m4a?v=<version>",
    "version": "<asset-version>",
    "durationMs": 1200000,
    "sizeBytes": 1234567,
    "language": "te"
  }
}
```

There is no cross-language audio fallback. `te`, `ta`, and `kn` are independent assets and therefore have independent resume positions.

## Canonical media rule

For `chapter_assets`, `storage_path` is authoritative and is converted into the production `mydeutschflow.de` URL. `public_url` is only a fallback. This prevents stale migrated public URLs from overriding the actual storage path.

The API adds `?v=<asset version>` for deterministic cache invalidation. If an audio asset exists only in the legacy same-language `chapter_translations.audio_url`, its translation `updated_at` participates in the version so replacement also invalidates caches/resume state.

## Fast API behavior

- One mobile bootstrap DB round trip.
- `Cache-Control: public, max-age=30, stale-while-revalidate=300`.
- `Server-Timing` and `X-DeutschFlow-API-Ms` expose backend application time for production measurement.
- Rich lesson sections stay lazy and are not required for playback.

## Media delivery

Audio is served directly from static `/uploads/content`, never proxied through a JSON endpoint. Production static responses are configured for long-lived immutable caching and byte ranges. Fast seek/resume depends on valid `audio/*` MIME and byte-range delivery.

## Database optimization

Run once after deployment:

```bash
npm run db:optimize-mobile
```

It safely creates the V88 mobile indexes only when missing.

## Production audit — mandatory before iOS acceptance

After deployment:

```bash
npm run verify:mobile-audio
```

This checks `te`, `ta`, and `kn`, prints API timing, validates selected-language identity, and performs a byte-range request for every returned A1 audio URL. It fails on broken HTTP status, missing byte-range behavior, or non-audio Content-Type.
