import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { chapterLabel, jsonText, safeJsonParse } from '../utils/adminHelpers';

export function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ chapters: [] });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: '', chapterId: '', german: '', english: '', meaning: '{"te":""}', sortOrder: 0 });

  async function load() {
    setLoading(true); setError('');
    try {
      const [vocabRes, optionRes] = await Promise.all([api.get('/v1/admin/vocabulary', { params: { search: search || undefined, limit: 1000 } }), api.get('/v1/admin/content-options')]);
      setVocabulary(vocabRes.data.vocabulary ?? []);
      setOptions(optionRes.data ?? { chapters: [] });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load vocabulary'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const chapters = useMemo(() => new Set(vocabulary.map((item) => item.chapter?.id).filter(Boolean)).size, [vocabulary]);
  const teluguCount = useMemo(() => vocabulary.filter((item) => item.meaning?.te).length, [vocabulary]);

  function edit(item: any) {
    setForm({ id: item.id, chapterId: item.chapter?.id ?? '', german: item.german ?? '', english: item.english ?? '', meaning: jsonText(item.meaning), sortOrder: item.sortOrder ?? 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      const body = { chapterId: form.chapterId, german: form.german, english: form.english || null, meaning: safeJsonParse(form.meaning), sortOrder: form.sortOrder };
      if (form.id) await api.patch(`/v1/admin/vocabulary/${form.id}`, body); else await api.post('/v1/admin/vocabulary', body);
      setMessage(form.id ? 'Vocabulary updated.' : 'Vocabulary added.');
      setForm({ id: '', chapterId: form.chapterId, german: '', english: '', meaning: '{"te":""}', sortOrder: 0 });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
  }

  async function remove(id: string) {
    if (!confirm('Delete this vocabulary item?')) return;
    setError('');
    try { await api.delete(`/v1/admin/vocabulary/${id}`); setMessage('Vocabulary deleted.'); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
  }

  return <section className="page widePage">
    <div className="pageHeader"><div><h1>Vocabulary Dashboard</h1><p>View, add, edit, and delete German vocabulary by chapter.</p></div></div>
    {message ? <div className="successBox">{message}</div> : null}{error ? <div className="errorBox">{error}</div> : null}
    <div className="statsGrid"><StatCard title="Vocabulary" value={vocabulary.length} caption="Filtered records" /><StatCard title="Chapters" value={chapters} caption="Linked lessons" /><StatCard title="Telugu Meanings" value={teluguCount} caption="Available translations" /><StatCard title="Mode" value="CRUD" caption="Create/edit/delete" /></div>
    <form className="panel formStack" onSubmit={save}>
      <div className="sectionTitle"><h2>{form.id ? 'Edit word' : 'Add word'}</h2><span>Pick chapter from dropdown, no ID copying.</span></div>
      <div className="smartUploadGrid"><label>Chapter<select value={form.chapterId} onChange={(e) => setForm({ ...form, chapterId: e.target.value })}><option value="">Select chapter</option>{options.chapters.map((chapter: any) => <option key={chapter.id} value={chapter.id}>{chapterLabel(chapter)}</option>)}</select></label><label>German<input value={form.german} onChange={(e) => setForm({ ...form, german: e.target.value })} /></label><label>English<input value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} /></label><label>Sort order<input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label></div>
      <label>Meanings JSON<textarea value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} /></label>
      <div className="buttonRow"><button className="primaryButton">{form.id ? 'Update word' : 'Add word'}</button>{form.id ? <button type="button" onClick={() => setForm({ id: '', chapterId: '', german: '', english: '', meaning: '{"te":""}', sortOrder: 0 })}>Cancel edit</button> : null}</div>
    </form>
    <div className="panel toolbarPanel"><input placeholder="Search German or English..." value={search} onChange={(e) => setSearch(e.target.value)} /><button className="primaryButton" onClick={load}>Search</button></div>
    <div className="panel tablePanel">{loading ? <p>Loading vocabulary...</p> : null}<table className="dataTable"><thead><tr><th>German</th><th>English</th><th>Telugu</th><th>Chapter</th><th>Level</th><th>Actions</th></tr></thead><tbody>{vocabulary.map((item) => <tr key={item.id}><td><strong>{item.german}</strong><small>Legacy ID: {item.legacyId ?? '—'}</small></td><td>{item.english ?? '—'}</td><td>{item.meaning?.te ?? '—'}</td><td>{item.chapter?.title ?? '—'}<small>{item.chapter?.slug}</small></td><td>{item.chapter?.level ?? '—'}</td><td><div className="rowActions"><button onClick={() => edit(item)}>Edit</button><button className="dangerButton" onClick={() => remove(item.id)}>Delete</button></div></td></tr>)}</tbody></table>{!loading && !vocabulary.length ? <p className="muted">No vocabulary found.</p> : null}</div>
  </section>;
}
