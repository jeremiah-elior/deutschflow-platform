# DeutschFlow Backend V87 — Fast Mobile API

V86 hydrated every lesson relation for every mobile endpoint. That meant list/overview calls loaded notes, transcripts, vocabulary, videos and quiz data even when they were not returned.

V87 scopes hydration by endpoint:
- lessons / overview: translations + audio/cover assets + video summary only
- videos: videos only
- vocabulary: vocabulary + vocabulary translations only
- notes: notes only
- transcript: transcripts only
- quiz: quiz only

Admin/full-detail callers keep the old full hydration by default.

Validation in build workspace:
- All TypeScript source files passed syntax/transpile validation with TypeScript 5.8.3.
- Targeted tsc analysis of the changed services produced only missing dependency/type-package errors because node_modules are not bundled in this workspace; no changed-service type errors were reported.
