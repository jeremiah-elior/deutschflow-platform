export function labelFromJson(value: any, fallback = 'Untitled') {
  if (!value || typeof value !== 'object') return fallback;
  return value.en || value.de || value.te || value.ta || value.kn || Object.values(value).find(Boolean) || fallback;
}

export function safeJsonParse(value: string, fallback: any = {}) {
  try { return value.trim() ? JSON.parse(value) : fallback; } catch { throw new Error('Invalid JSON. Please fix the JSON field before saving.'); }
}

export function jsonText(value: any) {
  return JSON.stringify(value ?? {}, null, 2);
}

export function boolText(value: boolean) { return value ? 'Yes' : 'No'; }

export function chapterLabel(chapter: any) {
  if (!chapter) return 'Select chapter';
  return chapter.label || `${chapter.level ?? ''} · ${String(chapter.number ?? '').padStart(2, '0')} · ${chapter.title ?? chapter.slug ?? ''}`;
}

export function optionLabel(option: any) {
  if (!option) return '';
  return option.label || option.title || option.name || option.slug || option.code || option.id;
}
