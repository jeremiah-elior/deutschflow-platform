# DeutschFlow V85

V85 is a focused production fix on top of V84.

- iOS `Your Turn` recordings are WAV/PCM. For WAV/FLAC, Speech-to-Text now lets Google detect encoding from the file header instead of forcing an encoding value.
- Google API error details are preserved in the backend JSON error response for diagnostics.
- Version: `V85_MYSQL_IOS_AUDIO_SPEECH_FIX_2026_08_10`.

No database migration is required. Keep the same V84 environment variables and Google credentials.
