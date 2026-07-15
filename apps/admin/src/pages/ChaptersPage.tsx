import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { jsonText, safeJsonParse } from '../utils/adminHelpers';

export function ChaptersPage() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ courses: [], chapters: [], categories: [], series: [] });
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: '', levelId: '', categoryId: '', seriesId: '', slug: '', number: 1, title: '{"en":""}', description: '{}', durationSeconds: 0, isPremium: false, isFeatured: false, isActive: true });

  const levels = useMemo(() => options.courses.flatMap((course: any) => (course.levels ?? []).map((level: any) => ({ ...level, courseSlug: course.slug }))), [options.courses]);
  const levelFilters = useMemo(() => Array.from(new Set(chapters.map((item) => item.level).filter(Boolean))).sort(), [chapters]);
  const totals = useMemo(() => chapters.reduce((acc, chapter) => {
    acc.vocabulary += chapter.counts?.vocabulary ?? 0;
    acc.notes += chapter.counts?.notes ?? 0;
    acc.videos += chapter.counts?.videos ?? 0;
    acc.quiz += chapter.counts?.quiz ?? 0;
    return acc;
  }, { vocabulary: 0, notes: 0, videos: 0, quiz: 0 }), [chapters]);

  async function load() {
    setLoading(true); setError('');
    try {
      const [chapterRes, optionRes] = await Promise.all([
        api.get('/v1/admin/chapters', { params: { search: search || undefined, level: level || undefined } }),
        api.get('/v1/admin/content-options')
      ]);
      setChapters(chapterRes.data.chapters ?? []);
      setOptions(optionRes.data ?? { courses: [], chapters: [], categories: [], series: [] });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load chapters'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function edit(chapter: any) {
    setForm({
      id: chapter.id,
      levelId: options.chapters.find((c: any) => c.id === chapter.id)?.levelId ?? '',
      categoryId: chapter.category?.id ?? '',
      seriesId: chapter.series?.id ?? '',
      slug: chapter.slug,
      number: chapter.number,
      title: jsonText(chapter.titleJson),
      description: jsonText(chapter.descriptionJson),
      durationSeconds: chapter.durationSeconds ?? 0,
      isPremium: Boolean(chapter.isPremium),
      isFeatured: Boolean(chapter.isFeatured),
      isActive: Boolean(chapter.isActive)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(''); setMessage('');
    try {
      const body: any = { levelId: form.levelId, slug: form.slug, number: form.number, title: safeJsonParse(form.title), description: safeJsonParse(form.description), durationSeconds: form.durationSeconds, isPremium: form.isPremium, isFeatured: form.isFeatured, isActive: form.isActive };
      body.categoryId = form.categoryId || null;
      body.seriesId = form.seriesId || null;
      if (form.id) await api.patch(`/v1/admin/chapters/${form.id}`, body); else await api.post('/v1/admin/chapters', body);
      setMessage(form.id ? 'Chapter updated.' : 'Chapter created.');
      setForm({ id: '', levelId: form.levelId, categoryId: '', seriesId: '', slug: '', number: 1, title: '{"en":""}', description: '{}', durationSeconds: 0, isPremium: false, isFeatured: false, isActive: true });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
  }

  async function remove(id: string) {
    if (!confirm('Delete this chapter and its linked content?')) return;
    setError('');
    try { await api.delete(`/v1/admin/chapters/${id}`); setMessage('Chapter deleted.'); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
  }

  return (
    <section className="page widePage">
      <div className="pageHeader"><div><h1>Chapters Dashboard</h1><p>View, create, edit, and delete lessons without touching UUIDs.</p></div></div>
      {message ? <div className="successBox">{message}</div> : null}
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="statsGrid">
        <StatCard title="Chapters" value={chapters.length} caption="Filtered lessons" />
        <StatCard title="Vocabulary" value={totals.vocabulary} caption="Words in these chapters" />
        <StatCard title="Notes" value={totals.notes} caption="Study note blocks" />
        <StatCard title="Videos" value={totals.videos} caption="Video records" />
      </div>
      <form className="panel formStack editPanel" onSubmit={save}>
        <div className="sectionTitle"><h2>{form.id ? 'Edit chapter' : 'Create chapter'}</h2><span>Use dropdowns for level, category, and series.</span></div>
        <div className="smartUploadGrid">
          <label>Level<select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })}><option value="">Select level</option>{levels.map((l: any) => <option key={l.id} value={l.id}>{l.courseSlug} · {l.slug}</option>)}</select></label>
          <label>Category<select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">None</option>{options.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Series<select value={form.seriesId} onChange={(e) => setForm({ ...form, seriesId: e.target.value })}><option value="">None</option>{options.series.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
          <label>Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
          <label>Number<input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} /></label>
          <label>Duration seconds<input type="number" value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: Number(e.target.value) })} /></label>
        </div>
        <label>Title JSON<textarea value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>Description JSON<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <div className="buttonRow"><label className="inlineCheck"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label><label className="inlineCheck"><input type="checkbox" checked={form.isPremium} onChange={(e) => setForm({ ...form, isPremium: e.target.checked })} /> Premium</label><label className="inlineCheck"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label></div>
        <div className="buttonRow"><button className="primaryButton">{form.id ? 'Update chapter' : 'Create chapter'}</button>{form.id ? <button type="button" onClick={() => setForm({ id: '', levelId: '', categoryId: '', seriesId: '', slug: '', number: 1, title: '{"en":""}', description: '{}', durationSeconds: 0, isPremium: false, isFeatured: false, isActive: true })}>Cancel edit</button> : null}</div>
      </form>
      <div className="panel toolbarPanel">
        <input placeholder="Search chapter title/category/series..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={level} onChange={(e) => setLevel(e.target.value)}><option value="">All levels</option>{levelFilters.map((item) => <option key={item as string} value={item as string}>{item as string}</option>)}</select>
        <button className="primaryButton" onClick={load}>Apply</button>
      </div>
      <div className="panel tablePanel">
        {loading ? <p>Loading chapters...</p> : null}
        <table className="dataTable">
          <thead><tr><th>#</th><th>Chapter</th><th>Level</th><th>Category</th><th>Series</th><th>Content</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{chapters.map((chapter) => <tr key={chapter.id}><td>{chapter.number}</td><td><strong>{chapter.title}</strong><small>{chapter.slug}<br />Legacy ID: {chapter.legacyId ?? '—'}</small></td><td>{chapter.level ?? '—'}</td><td>{chapter.category?.name ?? '—'}</td><td>{chapter.series?.title ?? '—'}</td><td><span className="pillLine">Vocab {chapter.counts?.vocabulary ?? 0}</span><span className="pillLine">Notes {chapter.counts?.notes ?? 0}</span><span className="pillLine">Videos {chapter.counts?.videos ?? 0}</span><span className="pillLine">Quiz {chapter.counts?.quiz ?? 0}</span></td><td><span className={chapter.isActive ? 'statusBadge good' : 'statusBadge warn'}>{chapter.isActive ? 'Active' : 'Inactive'}</span>{chapter.isPremium ? <span className="statusBadge premium">Premium</span> : null}</td><td><div className="rowActions"><button onClick={() => edit(chapter)}>Edit</button><button className="dangerButton" onClick={() => remove(chapter.id)}>Delete</button></div></td></tr>)}</tbody>
        </table>
        {!loading && !chapters.length ? <p className="muted">No chapters found.</p> : null}
      </div>
    </section>
  );
}
