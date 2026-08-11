#!/usr/bin/env node

const args = Object.fromEntries(process.argv.slice(2).map((raw) => {
  const value = raw.replace(/^--/, '');
  const i = value.indexOf('=');
  return i >= 0 ? [value.slice(0, i), value.slice(i + 1)] : [value, true];
}));

const base = String(args.base || process.env.DEUTSCHFLOW_BASE_URL || 'https://mydeutschflow.de').replace(/\/$/, '');
const course = String(args.course || 'german');
const level = String(args.level || 'A1');
const languages = String(args.languages || 'te,ta,kn').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);

let failures = 0;
for (const lang of languages) {
  const url = `${base}/v1/courses/${encodeURIComponent(course)}/levels/${encodeURIComponent(level)}/manifest?lang=${encodeURIComponent(lang)}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'DeutschFlow-Manifest-Publisher/1.0' },
      cache: 'no-store'
    });
    const text = await response.text();
    if (!response.ok) {
      failures += 1;
      console.error(`[${lang}] FAIL HTTP ${response.status}: ${text.slice(0, 800)}`);
      continue;
    }
    const manifest = JSON.parse(text);
    const hasLegacyAudioUrl = text.includes('"audio_url"');
    if (hasLegacyAudioUrl) {
      failures += 1;
      console.error(`[${lang}] FAIL manifest still contains legacy audio_url`);
      continue;
    }
    console.log(`[${lang}] OK schema=${manifest.schemaVersion} version=${manifest.version}`);
  } catch (error) {
    failures += 1;
    console.error(`[${lang}] ERROR ${error?.message ?? error}`);
  }
}

if (failures) process.exit(1);
console.log('All requested course manifests published.');
