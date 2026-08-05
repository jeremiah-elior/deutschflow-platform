# V80 media local-only fix
- No runtime redirects to silver-llama.
- /uploads/content uses UPLOADS_DIR.
- /uploads uses the parent uploads directory, so covers/videos can be placed beside content.
- Missing files return 404.
- API/admin responses rewrite retired/Supabase URLs to mydeutschflow.de.
