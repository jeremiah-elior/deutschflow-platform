import { z } from 'zod';
export declare const LanguageCodeSchema: z.ZodString;
export declare const LocalizedTextSchema: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>>;
export declare const AssetTypeSchema: z.ZodEnum<["audio", "video", "image", "json", "pdf", "cover", "transcript", "sample_paper", "exam_info", "ui_asset"]>;
export declare const ChapterAssetSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    chapterId: z.ZodString;
    languageCode: z.ZodString;
    assetType: z.ZodEnum<["audio", "video", "image", "json", "pdf", "cover", "transcript", "sample_paper", "exam_info", "ui_asset"]>;
    storagePath: z.ZodString;
    publicUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    durationSeconds: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sizeBytes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sha256: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    version: z.ZodDefault<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    chapterId: string;
    languageCode: string;
    assetType: "audio" | "video" | "image" | "json" | "pdf" | "cover" | "transcript" | "sample_paper" | "exam_info" | "ui_asset";
    storagePath: string;
    version: string;
    isActive: boolean;
    id?: string | undefined;
    publicUrl?: string | null | undefined;
    durationSeconds?: number | null | undefined;
    sizeBytes?: number | null | undefined;
    sha256?: string | null | undefined;
}, {
    chapterId: string;
    languageCode: string;
    assetType: "audio" | "video" | "image" | "json" | "pdf" | "cover" | "transcript" | "sample_paper" | "exam_info" | "ui_asset";
    storagePath: string;
    id?: string | undefined;
    publicUrl?: string | null | undefined;
    durationSeconds?: number | null | undefined;
    sizeBytes?: number | null | undefined;
    sha256?: string | null | undefined;
    version?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const LiDChoiceSchema: z.ZodObject<{
    key: z.ZodString;
    de: z.ZodString;
    en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    key: z.ZodString;
    de: z.ZodString;
    en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    key: z.ZodString;
    de: z.ZodString;
    en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const LiDCardImportSchema: z.ZodObject<{
    id: z.ZodNumber;
    catalog_id: z.ZodString;
    part: z.ZodEnum<["general", "state"]>;
    state: z.ZodNullable<z.ZodString>;
    number: z.ZodNumber;
    page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
    choices: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    answer: z.ZodString;
    correct_choice: z.ZodObject<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>;
    requires_image: z.ZodDefault<z.ZodBoolean>;
    image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodNumber;
    catalog_id: z.ZodString;
    part: z.ZodEnum<["general", "state"]>;
    state: z.ZodNullable<z.ZodString>;
    number: z.ZodNumber;
    page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
    choices: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    answer: z.ZodString;
    correct_choice: z.ZodObject<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>;
    requires_image: z.ZodDefault<z.ZodBoolean>;
    image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodNumber;
    catalog_id: z.ZodString;
    part: z.ZodEnum<["general", "state"]>;
    state: z.ZodNullable<z.ZodString>;
    number: z.ZodNumber;
    page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
    choices: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    answer: z.ZodString;
    correct_choice: z.ZodObject<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        key: z.ZodString;
        de: z.ZodString;
        en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.ZodTypeAny, "passthrough">>;
    requires_image: z.ZodDefault<z.ZodBoolean>;
    image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const LiDStudyFileSchema: z.ZodObject<{
    metadata: z.ZodDefault<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    cards: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    metadata: z.ZodDefault<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    cards: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    metadata: z.ZodDefault<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        title: z.ZodOptional<z.ZodString>;
        total_cards: z.ZodOptional<z.ZodNumber>;
        question_count: z.ZodOptional<z.ZodNumber>;
        general_cards: z.ZodOptional<z.ZodNumber>;
        general_question_count: z.ZodOptional<z.ZodNumber>;
        state_cards: z.ZodOptional<z.ZodNumber>;
        state_question_count: z.ZodOptional<z.ZodNumber>;
        languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        catalog_stand: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>>;
    cards: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodNumber;
        catalog_id: z.ZodString;
        part: z.ZodEnum<["general", "state"]>;
        state: z.ZodNullable<z.ZodString>;
        number: z.ZodNumber;
        page: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        question: z.ZodRecord<z.ZodString, z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        answer: z.ZodString;
        correct_choice: z.ZodObject<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            key: z.ZodString;
            de: z.ZodString;
            en: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            te: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            ta: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            kn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.ZodTypeAny, "passthrough">>;
        requires_image: z.ZodDefault<z.ZodBoolean>;
        image_note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        learn: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        study_material: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
}, z.ZodTypeAny, "passthrough">>;
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
