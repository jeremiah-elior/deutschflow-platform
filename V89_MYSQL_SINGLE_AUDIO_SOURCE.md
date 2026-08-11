# DeutschFlow Backend V89 — MySQL single audio source

Version: `V89_MYSQL_SINGLE_AUDIO_SOURCE_2026_08_11`

## Locked audio architecture

Audio metadata is read only from MySQL `chapter_assets`.

- `chapter_translations` remains text-only for title/notes compatibility.
- `chapter_translations.audio_url` is NOT used by mobile playback.
- `chapter_translations.audio_url` is NOT emitted in course manifests.
- Audio is language-strict: `chapter_id + language_code + asset_type='audio' + is_active=1`.
- No Telugu/Kannada/Tamil fallback to another language.
- `storage_path` is the canonical media location.
- SHA-256 becomes the audio version so resume progress survives URL/path changes when the file content is unchanged.

## Admin replacement flow

The old V88 UI could upload a new physical file and publish before saving the new `chapter_assets` row.

V89 changes the action to:

`Upload -> Save chapter_assets -> Publish manifest`

The `Save & publish` button performs both in that order.

Uploads now return `sha256`, `sizeBytes`, and `version` and these are saved in MySQL.

Only one active `chapter_assets` row is kept for the same chapter/type/language. Older duplicate rows are deactivated.

## Manifest rules

Course manifest is schemaVersion 2.

- `translations[].audio_url` is removed.
- `assets[key=audio]` is the only manifest audio source.
- Before a manifest is published, every selected-language active audio row is checked against the physical file under `UPLOADS_DIR`.
- If a DB audio row points to a missing file, publish fails instead of generating another broken manifest.

## Repair existing stale rows from real Hostinger files

Dry run:

```bash
npm run repair:audio-assets -- --course=german --level=A1 --languages=te,kn,ta
```

Apply:

```bash
npm run repair:audio-assets -- --apply --course=german --level=A1 --languages=te,kn,ta
```

The repair scans canonical folders such as:

`courses/german/A1/<chapter-slug>/audio/<language>/`

It selects the newest physical audio file, computes SHA-256, updates `chapter_assets`, and deactivates stale duplicate rows. It does not rewrite `chapter_translations.audio_url` because that field is retired from playback.

## Publish manifests

After repairing DB rows:

```bash
npm run publish:course-manifests -- --course=german --level=A1 --languages=te,kn,ta
```

## End-to-end verification

```bash
npm run verify:mobile-audio
```

V89 verification checks:

- mobile lesson API returns the selected language audio;
- published manifest contains no legacy `audio_url`;
- manifest audio path equals mobile API audio path;
- physical media returns 200/206;
- byte ranges work for seek/resume;
- response Content-Type is audio.

## iOS

No new iOS player patch is required for this backend repair. V65 already stores resume position by:

`lessonId + language + audioVersion`

and restores/seek-resumes when the user returns.
