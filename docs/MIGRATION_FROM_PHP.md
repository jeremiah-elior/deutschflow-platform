# Migration From PHP Backend

We are not patching PHP further.

Recommended migration:

1. Deploy new Node API and React admin under new domains.
2. Keep PHP backend running for old mobile builds.
3. Add new Android/iOS API base URL for v1 manifests.
4. Move LiD content first.
5. Move A1/A2/B1 chapter audio into the new course system.
6. After all active app versions use the new API, retire PHP endpoints.

The new content model avoids changing APIs whenever you add:

- a new language
- a new A1/A2/B1 chapter
- a new audio file
- a new LiD image/video/audio
- a new sample paper
