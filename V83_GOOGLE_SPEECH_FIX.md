# DeutschFlow V83 — Google Speech fix

V83 fixes the V82 Chirp 3 HD synthesis request. Google Chirp 3 HD voices do not accept the `speakingRate` audio parameter, so V83 omits it when a Chirp 3 HD voice is selected.

The configured `GOOGLE_TTS_SPEAKING_RATE` is still returned to iOS as a local playback rate. The natural Google audio is generated at its native speed, then iOS can play it at 0.86x for A1 learners.

After deployment:

```bash
curl -s https://mydeutschflow.de/__version
curl -s https://mydeutschflow.de/api/practice/speech-status.php | python3 -m json.tool
curl -s "https://mydeutschflow.de/api/practice/reading.php?lessonId=1" | python3 -m json.tool
```

Expected version: `V83_MYSQL_GOOGLE_SPEECH_FIX_2026_08_08`.
