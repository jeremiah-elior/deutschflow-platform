# DeutschFlow Backend V86

V86 is the production correction for Read & Speak speech recognition and provider error handling.

## Changes

- Keeps Google WAV encoding auto-detection for iOS PCM WAV uploads.
- Validates RIFF/WAVE structure, mono channel, 16-bit PCM, and sample-rate range before calling Google.
- Rejects empty/unfinished WAV recordings with an explicit application error.
- Preserves useful Google provider status/details in JSON instead of flattening every provider failure into a generic 502.
- Maps provider failures to stable application errors:
  - `speech_audio_rejected`
  - `speech_provider_auth_failed`
  - `speech_provider_rate_limited`
  - `speech_provider_unavailable`
- Updates runtime/version markers to V86.

No database migration is required.
No Google credential changes are required when V85 credentials are already working.
