# DeutschFlow V82 — Natural Read & Speak backend

This backend adds the server-side speech layer used by native iOS V59.

## What it adds

- `GET /api/practice/speech-status.php`
  - safe configuration/status check (never returns secrets)
- `GET /api/practice/reading.php?lessonId=1`
  - generates the People & Travel guided-reading audio once with Google Chirp 3 HD
  - stores the MP3 narration under the existing persistent `UPLOADS_DIR`
  - runs Google STT once on the generated narration to obtain word timestamps for highlighting
  - reuses the cached audio/timings on later requests
- `POST /api/practice/speech-recognize.php`
  - accepts one short WAV microphone recording and `expectedText`
  - returns German transcription + word data
  - user recordings are processed from memory and are not written to the uploads folder
  - simple per-IP in-memory rate limit: 40 requests/hour

## Google Cloud setup

Enable these two APIs in one Google Cloud project:

1. Cloud Text-to-Speech API
2. Cloud Speech-to-Text API

Create a service account with permission to call both APIs and download its JSON key.

For Hostinger, the easiest environment format is base64:

```bash
base64 < service-account.json | tr -d '\n'
```

Copy the resulting one-line value into:

```env
GOOGLE_SPEECH_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=<ONE-LINE-BASE64-JSON>
GOOGLE_TTS_VOICE=de-DE-Chirp3-HD-Leda
GOOGLE_TTS_SPEAKING_RATE=0.86
SPEECH_UPLOAD_MAX_BYTES=2500000
```

Keep the existing production variables, especially:

```env
PUBLIC_APP_BASE_URL=https://mydeutschflow.de
UPLOADS_DIR=/home/u832879198/domains/mydeutschflow.de/public_html/uploads/content
```

Do not put the Google service-account JSON/key in the iOS or Android apps.

## After deploy

Check version:

```bash
curl -s https://mydeutschflow.de/__version
```

Expected version:

```text
V82_MYSQL_GOOGLE_SPEECH_2026_08_08
```

Check speech configuration:

```bash
curl -s https://mydeutschflow.de/api/practice/speech-status.php | python3 -m json.tool
```

Then pre-generate/cache chapter 1 audio once:

```bash
curl -s "https://mydeutschflow.de/api/practice/reading.php?lessonId=1" | python3 -m json.tool
```

The response should include an `audioUrl` similar to:

```text
https://mydeutschflow.de/uploads/content/practice/reading/1/reading_de.mp3
```

Test it:

```bash
curl -I "https://mydeutschflow.de/uploads/content/practice/reading/1/reading_de.mp3"
```

Expected: HTTP 200 and an audio/mpeg content type.

## Important

Google billing/free-tier rules can change. V82 caches chapter narration so Text-to-Speech is not called every time a learner taps play. Speech-to-Text is called only when the learner explicitly submits a short Read Myself recording.
