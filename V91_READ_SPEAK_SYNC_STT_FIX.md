# DeutschFlow Backend V91 — Read & Speak sync + iOS STT fix

Version: `V91_READ_SPEAK_SYNC_STT_FIX_2026_08_12`

## Fixes

- Validated iOS PCM WAV uploads are sent to Google Speech with explicit `LINEAR16`, the WAV header sample rate, and channel count. This fixes the production `INVALID_ARGUMENT: bad encoding` regression.
- Read-aloud STT word timings are aligned back to the exact source/display word sequence using LCS; occasional provider omissions are interpolated between surrounding timestamps.
- Reading timing metadata is now `timingVersion: 2`, forcing stale V89/V90 `reading_de.json` timing caches to regenerate.
- Reading API returns `playbackRate`; Chirp 3 HD uses `GOOGLE_TTS_SPEAKING_RATE` as the recommended local AVPlayer rate, while non-Chirp audio uses local `1.0`.
- Retains the V90 chapter-asset validation and right-side admin drawer fixes.

No database migration is required. Rebuild and redeploy the backend. The first `/api/practice/reading.php?lessonId=1` request after deploy will regenerate the reading timing metadata if the old cache is present.
