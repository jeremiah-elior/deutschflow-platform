import { z } from 'zod';
export declare const LanguageCodeSchema: any;
export declare const LocalizedTextSchema: any;
export declare const AssetTypeSchema: any;
export declare const ChapterAssetSchema: any;
export declare const LiDChoiceSchema: any;
export declare const LiDCardImportSchema: any;
export declare const LiDStudyFileSchema: any;
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
