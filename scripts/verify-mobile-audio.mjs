#!/usr/bin/env node

const base = (process.env.DEUTSCHFLOW_BASE_URL || 'https://mydeutschflow.de').replace(/\/$/, '');
const languages = (process.argv.slice(2).length ? process.argv.slice(2) : ['te', 'ta', 'kn'])
  .map((value) => String(value).trim().toLowerCase())
  .filter(Boolean);

async function timedJson(url) {
  const started = performance.now();
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'DeutschFlow-Mobile-Audit/2.0' },
    cache: 'no-store'
  });
  const elapsedMs = Math.round(performance.now() - started);
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }
  return { response, body, elapsedMs };
}

async function probeAudio(url) {
  const started = performance.now();
  const response = await fetch(url, {
    headers: {
      Range: 'bytes=0-4095',
      Accept: 'audio/mp4,audio/mpeg,audio/*,*/*;q=0.8',
      'User-Agent': 'DeutschFlow-Mobile-Audit/2.0'
    },
    redirect: 'follow',
    cache: 'no-store'
  });
  const elapsedMs = Math.round(performance.now() - started);
  // Read only the small range response. A server that ignores Range may return the
  // whole file; cancel the body after headers in that case so the audit stays fast.
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

let failures = 0;

for (const lang of languages) {
  const endpoint = `${base}/v1/mobile/lessons?lang=${encodeURIComponent(lang)}&level=A1`;
  try {
    const { response, body, elapsedMs } = await timedJson(endpoint);
    console.log(`\n[${lang}] API ${response.status} ${elapsedMs}ms ${endpoint}`);
    console.log(`[${lang}] Server-Timing=${response.headers.get('server-timing') ?? '-'} X-DeutschFlow-API-Ms=${response.headers.get('x-deutschflow-api-ms') ?? '-'}`);
    if (!response.ok) {
      failures += 1;
      console.log(JSON.stringify(body, null, 2));
      continue;
    }

    const lessons = Array.isArray(body?.lessons) ? body.lessons : [];
    console.log(`[${lang}] lessons=${lessons.length} schemaVersion=${body?.schemaVersion ?? 'n/a'}`);

    for (const lesson of lessons) {
      const audio = lesson?.audio;
      if (!audio?.url) {
        console.log(`  lesson ${lesson?.id}: NO ${lang} AUDIO (valid only if unpublished/not yet recorded)`);
        continue;
      }

      if (String(audio.language || '').toLowerCase() !== lang) {
        failures += 1;
        console.log(`  lesson ${lesson?.id}: FAIL language=${audio.language ?? '-'} expected=${lang}`);
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
