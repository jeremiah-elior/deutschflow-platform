# V84 Speech-to-Text encoding fix

V84 fixes `POST /api/practice/speech-recognize.php` returning Google `400 Invalid recognition config: bad encoding` when uploaded audio is MP3 or WAV.

Changes:
- Detect upload encoding from Multer MIME type / original filename.
- Send `MP3` for `.mp3` / `audio/mpeg`.
- Send `LINEAR16` for `.wav` / WAV MIME types (matches the native iOS 16 kHz mono PCM recorder).
- Preserve the existing TTS flow, Google credentials, caching, limits, and all MySQL/admin behavior.
- Version endpoint: `V84_MYSQL_STT_ENCODING_FIX_2026_08_10`.

No environment-variable changes are required from the working V83 configuration.
