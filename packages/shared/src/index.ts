import { z } from 'zod';

export const LanguageCodeSchema = z.string().min(2).max(10).regex(/^[a-z]{2,3}(-[A-Z]{2})?$/);

export const LocalizedTextSchema = z.record(z.string(), z.string().nullable()).default({});

export const AssetTypeSchema = z.enum([
  'audio',
  'video',
  'image',
  'json',
  'pdf',
  'cover',
  'transcript',
  'sample_paper',
  'exam_info',
  'ui_asset'
]);

export const ChapterAssetSchema = z.object({
  id: z.string().uuid().optional(),
  chapterId: z.string().uuid(),
  languageCode: z.string(),
  assetType: AssetTypeSchema,
  storagePath: z.string(),
  publicUrl: z.string().url().nullable().optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(),
  sha256: z.string().nullable().optional(),
  version: z.string().default('1'),
  isActive: z.boolean().default(true)
});

export const LiDChoiceSchema = z.object({
  key: z.string(),
  de: z.string(),
  en: z.string().nullable().optional(),
  te: z.string().nullable().optional(),
  ta: z.string().nullable().optional(),
  kn: z.string().nullable().optional()
}).passthrough();

export const LiDCardImportSchema = z.object({
  id: z.number().int(),
  catalog_id: z.string(),
  part: z.enum(['general', 'state']),
  state: z.string().nullable(),
  number: z.number().int(),
  page: z.number().int().nullable().optional(),
  question: z.record(z.string(), z.string().nullable()),
  choices: z.array(LiDChoiceSchema).min(2),
  answer: z.string(),
  correct_choice: LiDChoiceSchema,
  requires_image: z.boolean().default(false),
  image_note: z.string().nullable().optional(),
  learn: z.record(z.string(), z.unknown()).default({}),
  study_material: z.record(z.string(), z.unknown()).optional()
}).passthrough();

export const LiDStudyFileSchema = z.object({
  metadata: z.object({
    title: z.string().optional(),
    total_cards: z.number().int().optional(),
    question_count: z.number().int().optional(),
    general_cards: z.number().int().optional(),
    general_question_count: z.number().int().optional(),
    state_cards: z.number().int().optional(),
    state_question_count: z.number().int().optional(),
    languages: z.array(z.string()).optional(),
    catalog_stand: z.string().optional()
  }).passthrough().default({}),
  cards: z.array(LiDCardImportSchema)
}).passthrough();

export type LanguageCode = z.infer<typeof LanguageCodeSchema>;
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
export type AssetType = z.infer<typeof AssetTypeSchema>;
export type ChapterAsset = z.infer<typeof ChapterAssetSchema>;
export type LiDChoice = z.infer<typeof LiDChoiceSchema>;
export type LiDCardImport = z.infer<typeof LiDCardImportSchema>;
export type LiDStudyFile = z.infer<typeof LiDStudyFileSchema>;

export interface FileDescriptor {
  key: string;
  url: string;
  storagePath?: string;
  sha256?: string | null;
  sizeBytes?: number | null;
  contentType?: string | null;
  version?: string | null;
}

export interface CourseLevelManifest {
  module: 'course_level';
  schemaVersion: number;
  courseSlug: string;
  levelSlug: string;
  languageCode: string;
  version: string;
  chapters: Array<{
    id: string;
    slug: string;
    number: number;
    title: Record<string, string | null>;
    description?: Record<string, string | null> | null;
    durationSeconds?: number | null;
    isPremium?: boolean;
    isFeatured?: boolean;
    category?: Record<string, unknown> | null;
    series?: Record<string, unknown> | null;
    translations?: Array<Record<string, unknown>>;
    notes?: Array<Record<string, unknown>>;
    transcripts?: Array<Record<string, unknown>>;
    vocabulary?: Array<Record<string, unknown>>;
    videos?: Array<Record<string, unknown>>;
    quiz?: Array<Record<string, unknown>>;
    legacy?: Record<string, unknown>;
    assets: FileDescriptor[];
  }>;
}

export interface LiDManifest {
  module: 'lid_test';
  schemaVersion: number;
  version: string;
  languages: string[];
  catalog: {
    id: string;
    totalCards: number;
    generalCards: number;
    stateCards: number;
  };
  cards: FileDescriptor;
  media: Record<string, FileDescriptor>;
  images: {
    baseUrl: string;
    items: Record<string, string>;
  };
  samples: Record<string, FileDescriptor>;
  examInfo?: FileDescriptor | null;
}
