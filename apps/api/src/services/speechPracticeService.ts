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
    } catch {
      throw new HttpError(500, 'Google service account credentials are not valid JSON/base64 JSON');
    }
  }

  // Supports Application Default Credentials when deployed in an environment
  // where GOOGLE_APPLICATION_CREDENTIALS or workload credentials are available.
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
    console.error('Google Speech auth error:', error);
    throw new HttpError(503, 'speech_service_not_configured');
  }
}

async function googlePost(url: string, payload: unknown) {
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
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!response.ok) {
    console.error('Google Speech API error:', response.status, json);
    const googleMessage = typeof json?.error?.message === 'string' ? json.error.message : undefined;
    throw new HttpError(502, `google_speech_${response.status}`, googleMessage ? { googleMessage } : undefined);
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
  // Google Chirp 3 HD currently rejects speakingRate/pitch audio parameters.
  // Keep the generated narration at its natural voice speed and let the
  // native app apply the A1 playback rate locally with AVPlayer.
  const isChirp3HD = /-Chirp3-HD-/i.test(env.GOOGLE_TTS_VOICE);
  return {
    audioEncoding: 'MP3',
    ...(!isChirp3HD ? { speakingRate: env.GOOGLE_TTS_SPEAKING_RATE } : {})
  };
}

async function synthesizeReading(text: string): Promise<Buffer> {
  const response = await googlePost('https://texttospeech.googleapis.com/v1/text:synthesize', {
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

type GoogleSpeechEncoding = 'LINEAR16' | 'MP3' | 'FLAC';

function recognitionEncoding(mimeType = '', filename = ''): GoogleSpeechEncoding | undefined {
  const mime = mimeType.trim().toLowerCase();
  const name = filename.trim().toLowerCase();

  // V85: WAV and FLAC carry their encoding/sample-rate metadata in the file header.
  // Google explicitly supports header auto-detection for these containers. The iOS app
  // records a 16 kHz mono PCM WAV, so omitting `encoding` avoids a config/header mismatch.
  if (mime === 'audio/wav' || mime === 'audio/x-wav' || mime === 'audio/wave' || name.endsWith('.wav')) return undefined;
  if (mime === 'audio/flac' || name.endsWith('.flac')) return undefined;
  if (mime === 'audio/mpeg' || mime === 'audio/mp3' || name.endsWith('.mp3')) return 'MP3';
  return undefined;
}

async function transcribeWithWordTimings(audio: Buffer, expectedWords: string[] = [], encoding?: GoogleSpeechEncoding) {
  const speechContexts = expectedWords.length ? [{ phrases: expectedWords.slice(0, 200), boost: 12 }] : undefined;
  const response = await googlePost('https://speech.googleapis.com/v1/speech:recognize', {
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

  const transcript = alternatives.map((alternative: any) => String(alternative?.transcript ?? '')).join(' ').trim();
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
    // Natural audio remains useful even if timing generation temporarily fails.
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

  const phrases = expectedText.match(/[\p{L}\p{N}ÄÖÜäöüß]+/gu) ?? [];
  const encoding = recognitionEncoding(mimeType, filename);
  const result = await transcribeWithWordTimings(audio, phrases, encoding);
  return {
    transcript: result.transcript,
    confidence: result.confidence,
    words: result.words
  };
}
