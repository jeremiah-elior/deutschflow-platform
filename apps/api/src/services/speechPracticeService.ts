import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { GoogleAuth } from 'google-auth-library';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export type ReadingWordTiming = {
  word: string;
  startMs: number;
  endMs: number;
  confidence?: number;
};

export type ReadingPracticeAsset = {
  lessonId: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  practiceSentences: string[];
  audioUrl: string;
  voice: string;
  speakingRate: number;
  words: ReadingWordTiming[];
};

const readingContent: Record<string, Omit<ReadingPracticeAsset, 'audioUrl' | 'voice' | 'speakingRate' | 'words'>> = {
  '1': {
    lessonId: '1',
    title: 'Unterwegs nach Berlin',
    subtitle: 'A1 · People & Travel · Guided reading',
    paragraphs: [
      'Anna fährt heute mit dem Zug nach Berlin. Sie geht am Morgen zum Bahnhof und kauft am Automaten eine Fahrkarte.',
      'Auf Gleis sieben wartet Anna auf ihren Zug. Der Zug fährt pünktlich um neun Uhr ab.',
      'Im Zug kommt der Kontrolleur. Anna zeigt ihre Fahrkarte und setzt sich danach ans Fenster.'
    ],
    practiceSentences: [
      'Anna fährt heute mit dem Zug nach Berlin.',
      'Sie geht am Morgen zum Bahnhof.',
      'Anna kauft am Automaten eine Fahrkarte.',
      'Der Zug fährt pünktlich um neun Uhr ab.',
      'Anna zeigt ihre Fahrkarte.'
    ]
  }
};

let cachedAuth: GoogleAuth | null = null;

type GoogleOperation = 'tts' | 'stt';
type GoogleSpeechEncoding = 'LINEAR16' | 'MP3' | 'FLAC';

type WavInfo = {
  audioFormat: number;
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  dataBytes: number;
};

function googleAuth() {
  if (cachedAuth) return cachedAuth;

  const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  const rawCredentials = env.GOOGLE_SERVICE_ACCOUNT_JSON.trim();
  const base64Credentials = env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64.trim();

  if (rawCredentials || base64Credentials) {
    try {
      const jsonText = rawCredentials || Buffer.from(base64Credentials, 'base64').toString('utf8');
      const credentials = JSON.parse(jsonText);
      cachedAuth = new GoogleAuth({ credentials, scopes });
      return cachedAuth;
    } catch (error) {
      console.error('Google Speech credential parse error:', error);
      throw new HttpError(503, 'speech_service_not_configured');
    }
  }

  // ADC is still supported for platforms that provide workload credentials or a mounted
  // GOOGLE_APPLICATION_CREDENTIALS file. Hostinger production currently uses Base64 JSON.
  cachedAuth = new GoogleAuth({ scopes });
  return cachedAuth;
}

async function accessToken() {
  if (!env.GOOGLE_SPEECH_ENABLED) {
    throw new HttpError(503, 'speech_service_disabled');
  }

  try {
    const client = await googleAuth().getClient();
    const token = await client.getAccessToken();
    const value = typeof token === 'string' ? token : token?.token;
    if (!value) throw new Error('empty access token');
    return value;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error('Google Speech auth error:', error);
    throw new HttpError(503, 'speech_service_not_configured');
  }
}

function providerDetails(status: number, json: any) {
  const providerMessage = typeof json?.error?.message === 'string' ? json.error.message : undefined;
  const providerCode = typeof json?.error?.status === 'string' ? json.error.status : undefined;
  return {
    provider: 'google',
    providerStatus: status,
    ...(providerCode ? { providerCode } : {}),
    ...(providerMessage ? { providerMessage } : {})
  };
}

function mapGoogleFailure(operation: GoogleOperation, status: number, json: any): HttpError {
  const details = providerDetails(status, json);

  if (status === 400) {
    return operation === 'stt'
      ? new HttpError(422, 'speech_audio_rejected', details)
      : new HttpError(502, 'speech_tts_request_rejected', details);
  }
  if (status === 401 || status === 403) {
    return new HttpError(503, 'speech_provider_auth_failed', details);
  }
  if (status === 429) {
    return new HttpError(429, 'speech_provider_rate_limited', details);
  }
  if (status >= 500) {
    return new HttpError(503, 'speech_provider_unavailable', details);
  }
  return new HttpError(502, 'speech_provider_error', details);
}

async function googlePost(operation: GoogleOperation, url: string, payload: unknown) {
  const token = await accessToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': 'DeutschFlow-Backend'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    console.error(`Google ${operation.toUpperCase()} API error:`, response.status, json);
    throw mapGoogleFailure(operation, response.status, json);
  }
  return json;
}

function secondsToMs(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const parsed = Number(value.replace(/s$/, ''));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 1000)) : 0;
}

function readingCachePaths(lessonId: string) {
  const relativeDir = `practice/reading/${lessonId}`;
  const absoluteDir = resolve(process.cwd(), env.UPLOADS_DIR, relativeDir);
  return {
    absoluteDir,
    audioPath: resolve(absoluteDir, 'reading_de.mp3'),
    metaPath: resolve(absoluteDir, 'reading_de.json'),
    audioUrl: `${env.PUBLIC_APP_BASE_URL}/uploads/content/${relativeDir}/reading_de.mp3`
  };
}

function googleTtsAudioConfig() {
  // Chirp 3 HD rejects speakingRate/pitch synthesis parameters. Generate once at native
  // speed and let AVPlayer control learner playback speed locally.
  const isChirp3HD = /-Chirp3-HD-/i.test(env.GOOGLE_TTS_VOICE);
  return {
    audioEncoding: 'MP3',
    ...(!isChirp3HD ? { speakingRate: env.GOOGLE_TTS_SPEAKING_RATE } : {})
  };
}

async function synthesizeReading(text: string): Promise<Buffer> {
  const response = await googlePost('tts', 'https://texttospeech.googleapis.com/v1/text:synthesize', {
    input: { text },
    voice: {
      languageCode: 'de-DE',
      name: env.GOOGLE_TTS_VOICE
    },
    audioConfig: googleTtsAudioConfig()
  });

  if (!response.audioContent || typeof response.audioContent !== 'string') {
    throw new HttpError(502, 'google_tts_empty_audio');
  }
  return Buffer.from(response.audioContent, 'base64');
}

function isWavUpload(mimeType = '', filename = '') {
  const mime = mimeType.trim().toLowerCase();
  const name = filename.trim().toLowerCase();
  return mime === 'audio/wav' || mime === 'audio/x-wav' || mime === 'audio/wave' || name.endsWith('.wav');
}

function isFlacUpload(mimeType = '', filename = '') {
  const mime = mimeType.trim().toLowerCase();
  const name = filename.trim().toLowerCase();
  return mime === 'audio/flac' || name.endsWith('.flac');
}

function inspectWav(audio: Buffer): WavInfo {
  if (audio.length < 44 || audio.toString('ascii', 0, 4) !== 'RIFF' || audio.toString('ascii', 8, 12) !== 'WAVE') {
    throw new HttpError(422, 'speech_audio_invalid_wav');
  }

  let offset = 12;
  let format: Omit<WavInfo, 'dataBytes'> | null = null;
  let dataBytes = 0;

  while (offset + 8 <= audio.length) {
    const chunkId = audio.toString('ascii', offset, offset + 4);
    const chunkSize = audio.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkSize;
    if (chunkEnd > audio.length) break;

    if (chunkId === 'fmt ' && chunkSize >= 16) {
      format = {
        audioFormat: audio.readUInt16LE(chunkStart),
        channels: audio.readUInt16LE(chunkStart + 2),
        sampleRate: audio.readUInt32LE(chunkStart + 4),
        bitsPerSample: audio.readUInt16LE(chunkStart + 14)
      };
    } else if (chunkId === 'data') {
      dataBytes = chunkSize;
    }

    // RIFF chunks are padded to an even byte boundary.
    offset = chunkEnd + (chunkSize % 2);
  }

  if (!format || dataBytes <= 0) {
    throw new HttpError(422, 'speech_audio_invalid_wav');
  }

  const info: WavInfo = { ...format, dataBytes };
  const supported =
    info.audioFormat === 1 &&
    info.channels === 1 &&
    info.bitsPerSample === 16 &&
    info.sampleRate >= 8_000 &&
    info.sampleRate <= 48_000;

  if (!supported) {
    throw new HttpError(422, 'speech_audio_unsupported_wav', {
      audioFormat: info.audioFormat,
      channels: info.channels,
      sampleRate: info.sampleRate,
      bitsPerSample: info.bitsPerSample
    });
  }

  // At 16 kHz / mono / 16-bit this is roughly 50 ms. Anything smaller is almost
  // certainly an empty/unfinished recording rather than a spoken sentence.
  if (info.dataBytes < 1_600) {
    throw new HttpError(422, 'speech_audio_too_short');
  }

  return info;
}

function recognitionEncoding(mimeType = '', filename = ''): GoogleSpeechEncoding | undefined {
  const mime = mimeType.trim().toLowerCase();
  const name = filename.trim().toLowerCase();

  // WAV/FLAC contain their own format headers. Google Speech can derive the encoding from
  // those headers; specifying a mismatched encoding causes INVALID_ARGUMENT.
  if (isWavUpload(mimeType, filename) || isFlacUpload(mimeType, filename)) return undefined;
  if (mime === 'audio/mpeg' || mime === 'audio/mp3' || name.endsWith('.mp3')) return 'MP3';
  return undefined;
}

async function transcribeWithWordTimings(audio: Buffer, expectedWords: string[] = [], encoding?: GoogleSpeechEncoding) {
  const speechContexts = expectedWords.length ? [{ phrases: expectedWords.slice(0, 200), boost: 12 }] : undefined;
  const response = await googlePost('stt', 'https://speech.googleapis.com/v1/speech:recognize', {
    config: {
      ...(encoding ? { encoding } : {}),
      languageCode: 'de-DE',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      enableWordConfidence: true,
      speechContexts
    },
    audio: { content: audio.toString('base64') }
  });

  const alternatives = (response.results ?? [])
    .flatMap((result: any) => Array.isArray(result?.alternatives) ? result.alternatives.slice(0, 1) : []);

  const transcript = alternatives
    .map((alternative: any) => String(alternative?.transcript ?? ''))
    .join(' ')
    .trim();

  const words: ReadingWordTiming[] = alternatives.flatMap((alternative: any) =>
    (alternative?.words ?? []).map((item: any) => ({
      word: String(item.word ?? ''),
      startMs: secondsToMs(item.startTime),
      endMs: secondsToMs(item.endTime),
      confidence: typeof item.confidence === 'number' ? item.confidence : undefined
    }))
  );

  return { transcript, words, confidence: alternatives[0]?.confidence ?? null };
}

export async function getReadingPracticeAsset(lessonId: string): Promise<ReadingPracticeAsset> {
  const content = readingContent[lessonId];
  if (!content) throw new HttpError(404, 'reading_practice_not_found');

  const paths = readingCachePaths(lessonId);
  if (existsSync(paths.audioPath) && existsSync(paths.metaPath)) {
    try {
      const cached = JSON.parse(await readFile(paths.metaPath, 'utf8'));
      const sameVoice = cached.voice === env.GOOGLE_TTS_VOICE;
      const sameRate = Math.abs(Number(cached.speakingRate ?? 0) - env.GOOGLE_TTS_SPEAKING_RATE) < 0.0001;
      if (sameVoice && sameRate) {
        return { ...content, ...cached, audioUrl: paths.audioUrl };
      }
    } catch (error) {
      console.warn('Reading practice cache metadata could not be read; regenerating.', error);
    }
  }

  await mkdir(paths.absoluteDir, { recursive: true });
  const fullText = content.paragraphs.join('\n\n');
  const audio = await synthesizeReading(fullText);
  await writeFile(paths.audioPath, audio);

  let words: ReadingWordTiming[] = [];
  try {
    const expectedWords = fullText.match(/[\p{L}\p{N}ÄÖÜäöüß]+/gu) ?? [];
    const timed = await transcribeWithWordTimings(audio, expectedWords, 'MP3');
    words = timed.words;
  } catch (error) {
    // The narration is still useful if timing generation temporarily fails.
    console.warn('Reading word timing generation failed:', error);
  }

  const meta = {
    voice: env.GOOGLE_TTS_VOICE,
    speakingRate: env.GOOGLE_TTS_SPEAKING_RATE,
    words
  };
  await writeFile(paths.metaPath, JSON.stringify(meta, null, 2), 'utf8');

  return { ...content, ...meta, audioUrl: paths.audioUrl };
}

export async function recognizeReadingAudio(audio: Buffer, expectedText: string, mimeType = '', filename = '') {
  if (!audio.length) throw new HttpError(400, 'audio_required');
  if (audio.length > env.SPEECH_UPLOAD_MAX_BYTES) throw new HttpError(413, 'audio_too_large');

  if (isWavUpload(mimeType, filename)) {
    inspectWav(audio);
  }

  const phrases = expectedText.match(/[\p{L}\p{N}ÄÖÜäöüß]+/gu) ?? [];
  const encoding = recognitionEncoding(mimeType, filename);
  const result = await transcribeWithWordTimings(audio, phrases, encoding);

  return {
    transcript: result.transcript,
    confidence: result.confidence,
    words: result.words
  };
}
