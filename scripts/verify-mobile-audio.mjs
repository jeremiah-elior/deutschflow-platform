#!/usr/bin/env node

const base = (process.env.DEUTSCHFLOW_BASE_URL || 'https://mydeutschflow.de').replace(/\/$/, '');
const languages = (process.argv.slice(2).length ? process.argv.slice(2) : ['te', 'ta', 'kn'])
  .map((value) => String(value).trim().toLowerCase())
  .filter(Boolean);

async function timedJson(url) {
  const started = performance.now();
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'DeutschFlow-Mobile-Audit/3.0' },
    cache: 'no-store'
  });
  const elapsedMs = Math.round(performance.now() - started);
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }
  return { response, body, elapsedMs, raw: text };
}

async function probeAudio(url) {
  const started = performance.now();
  const response = await fetch(url, {
    headers: {
      Range: 'bytes=0-4095',
      Accept: 'audio/mp4,audio/mpeg,audio/*,*/*;q=0.8',
      'User-Agent': 'DeutschFlow-Mobile-Audit/3.0'
    },
    redirect: 'follow',
    cache: 'no-store'
  });
  const elapsedMs = Math.round(performance.now() - started);
  if (response.status === 206) await response.arrayBuffer();
  else await response.body?.cancel();
  return {
    finalUrl: response.url,
    status: response.status,
    elapsedMs,
    contentType: response.headers.get('content-type') || '',
    acceptRanges: response.headers.get('accept-ranges') || '',
    contentRange: response.headers.get('content-range') || '',
    cacheControl: response.headers.get('cache-control') || ''
  };
}

function isAudioContentType(value) {
  return /^audio\//i.test(String(value || '').trim());
}

function mediaPath(url) {
  try { return new URL(url).pathname; } catch { return String(url || '').split('?')[0]; }
}

function manifestAudioFor(manifest, lesson) {
  const chapter = (manifest?.chapters || []).find((item) => item.id === lesson.uuid || item.slug === lesson.slug);
  if (!chapter) return null;
  return (chapter.assets || []).find((asset) => asset.key === 'audio') || null;
}

let failures = 0;

for (const lang of languages) {
  const endpoint = `${base}/v1/mobile/lessons?lang=${encodeURIComponent(lang)}&level=A1`;
  const manifestUrl = `${base}/uploads/content/manifests/courses/german/A1/${encodeURIComponent(lang)}/manifest.json`;
  try {
    const [{ response, body, elapsedMs }, manifestResult] = await Promise.all([
      timedJson(endpoint),
      timedJson(manifestUrl)
    ]);
    console.log(`\n[${lang}] API ${response.status} ${elapsedMs}ms ${endpoint}`);
    console.log(`[${lang}] Server-Timing=${response.headers.get('server-timing') ?? '-'} X-DeutschFlow-API-Ms=${response.headers.get('x-deutschflow-api-ms') ?? '-'}`);
    if (!response.ok) {
      failures += 1;
      console.log(JSON.stringify(body, null, 2));
      continue;
    }

    if (!manifestResult.response.ok) {
      failures += 1;
      console.log(`[${lang}] FAIL manifest HTTP ${manifestResult.response.status} ${manifestUrl}`);
      continue;
    }
    if (manifestResult.raw.includes('"audio_url"')) {
      failures += 1;
      console.log(`[${lang}] FAIL manifest still exposes legacy translations.audio_url`);
    } else {
      console.log(`[${lang}] manifest schemaVersion=${manifestResult.body?.schemaVersion ?? 'n/a'} has no legacy audio_url`);
    }

    const lessons = Array.isArray(body?.lessons) ? body.lessons : [];
    console.log(`[${lang}] lessons=${lessons.length} schemaVersion=${body?.schemaVersion ?? 'n/a'}`);

    for (const lesson of lessons) {
      const audio = lesson?.audio;
      const manifestAudio = manifestAudioFor(manifestResult.body, lesson);
      if (!audio?.url) {
        if (manifestAudio?.url) {
          failures += 1;
          console.log(`  lesson ${lesson?.id}: FAIL manifest has audio but mobile API has none`);
        } else {
          console.log(`  lesson ${lesson?.id}: NO ${lang} AUDIO (valid only if unpublished/not yet recorded)`);
        }
        continue;
      }

      if (String(audio.language || '').toLowerCase() !== lang) {
        failures += 1;
        console.log(`  lesson ${lesson?.id}: FAIL language=${audio.language ?? '-'} expected=${lang}`);
        continue;
      }

      if (!manifestAudio?.url) {
        failures += 1;
        console.log(`  lesson ${lesson?.id}: FAIL mobile API has audio but manifest has no audio asset`);
        continue;
      }

      if (mediaPath(audio.url) !== mediaPath(manifestAudio.url)) {
        failures += 1;
        console.log(`  lesson ${lesson?.id}: FAIL API/manifest audio mismatch`);
        console.log(`    API     ${audio.url}`);
        console.log(`    MANIFEST ${manifestAudio.url}`);
        continue;
      }

      try {
        const probe = await probeAudio(audio.url);
        const statusOkay = probe.status === 206 || probe.status === 200;
        const rangeOkay = probe.status === 206 || probe.acceptRanges.toLowerCase().includes('bytes');
        const typeOkay = isAudioContentType(probe.contentType);
        const okay = statusOkay && rangeOkay && typeOkay;
        if (!okay) failures += 1;

        console.log(
          `  lesson ${lesson.id}: ${okay ? 'OK' : 'FAIL'} status=${probe.status} ` +
          `range=${probe.acceptRanges || '-'} contentRange=${probe.contentRange || '-'} ` +
          `type=${probe.contentType || '-'} time=${probe.elapsedMs}ms version=${audio.version ?? '-'}\n` +
          `    ${probe.finalUrl || audio.url}`
        );
        if (!rangeOkay) console.log('    FAIL: byte-range delivery is required for fast seek/resume.');
        if (!typeOkay) console.log('    FAIL: response is not an audio Content-Type.');
      } catch (error) {
        failures += 1;
        console.log(`  lesson ${lesson?.id}: ERROR ${error?.message ?? error}`);
      }
    }
  } catch (error) {
    failures += 1;
    console.log(`\n[${lang}] API ERROR ${error?.message ?? error}`);
  }
}

if (failures > 0) {
  console.error(`\nDeutschFlow mobile audio audit failed: ${failures} problem(s).`);
  process.exit(1);
}
console.log('\nDeutschFlow mobile audio audit passed.');
