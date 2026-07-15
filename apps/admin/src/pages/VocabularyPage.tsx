import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { AsyncButton, BusyOverlay, ConfirmBar, Drawer, EmptyState, PageNotice } from '../components/AdminUi';
import { chapterLabel, jsonText, safeJsonParse } from '../utils/adminHelpers';

const emptyForm = { id: '', chapterId: '', german: '', english: '', meaning: '{"te":""}', sortOrder: 0 };

export function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ chapters: [] });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [busyLabel, setBusyLabel] = useState('');
  const [form, setForm] = useState(emptyForm);
  const busy = Boolean(busyLabel);

  async function load() { setLoading(true); setError(''); try { const [vocabRes, optionRes] = await Promise.all([api.get('/v1/admin/vocabulary', { params: { search: search || undefined, limit: 1000 } }), api.get('/v1/admin/content-options')]); setVocabulary(vocabRes.data.vocabulary ?? []); setOptions(optionRes.data ?? { chapters: [] }); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load vocabulary'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  const chapters = useMemo(() => new Set(vocabulary.map((item) => item.chapter?.id).filter(Boolean)).size, [vocabulary]);
  const teluguCount = useMemo(() => vocabulary.filter((item) => item.meaning?.te).length, [vocabulary]);
  async function run(label: string, action: () => Promise<void>) { setBusyLabel(label); setError(''); setMessage(''); try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); } finally { setBusyLabel(''); } }
  function add() { setForm(emptyForm); setDrawer(true); }
  function edit(item: any) { setForm({ id: item.id, chapterId: item.chapter?.id ?? '', german: item.german ?? '', english: item.english ?? '', meaning: jsonText(item.meaning), sortOrder: item.sortOrder ?? 0 }); setDrawer(true); }
  async function save(event: FormEvent) { event.preventDefault(); await run(form.id ? 'Updating word…' : 'Adding word…', async () => { const body = { chapterId: form.chapterId, german: form.german, english: form.english || null, meaning: safeJsonParse(form.meaning), sortOrder: form.sortOrder }; if (form.id) await api.patch(`/v1/admin/vocabulary/${form.id}`, body); else await api.post('/v1/admin/vocabulary', body); setMessage(form.id ? 'Vocabulary updated.' : 'Vocabulary added.'); setDrawer(false); await load(); }); }
  async function remove() { if (!pendingDelete) return; await run('Deleting word…', async () => { await api.delete(`/v1/admin/vocabulary/${pendingDelete.id}`); setMessage('Vocabulary deleted.'); setPendingDelete(null); await load(); }); }

  return <section className="page widePage"><BusyOverlay show={busy} label={busyLabel} /><div className="pageHeader"><div><h1>Vocabulary</h1><p>Search, view, add, edit, and delete words without leaving the list.</p></div><div className="pageHeaderActions"><button className="secondaryButton" onClick={load}><RefreshCw size={16} /> Refresh</button><button className="primaryButton" onClick={add}><Plus size={16} /> Add word</button></div></div><PageNotice type="success">{message}</PageNotice><PageNotice type="error">{error}</PageNotice>{pendingDelete ? <ConfirmBar title={`Delete ${pendingDelete.german}?`} body="This removes the vocabulary item from the app content." busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={remove} /> : null}<div className="statsGrid"><StatCard title="Vocabulary" value={vocabulary.length} caption="Filtered records" /><StatCard title="Chapters" value={chapters} caption="Linked lessons" /><StatCard title="Telugu Meanings" value={teluguCount} caption="Available" /><StatCard title="Mode" value="CRUD" caption="Create/edit/delete" /></div><div className="panel toolbarPanel"><input placeholder="Search German or English..." value={search} onChange={(e) => setSearch(e.target.value)} /><button className="primaryButton" onClick={load}><Search size={16} /> Search</button></div><div className="panel tablePanel"><div className="listHeader"><h2>Words</h2><span className="muted">{loading ? 'Loading…' : `${vocabulary.length} rows`}</span></div>{loading ? <p>Loading vocabulary…</p> : null}{!loading && !vocabulary.length ? <EmptyState title="No vocabulary found" body="Try another search or add a word." /> : <table className="dataTable"><thead><tr><th>German</th><th>English</th><th>Telugu</th><th>Chapter</th><th>Level</th><th>Actions</th></tr></thead><tbody>{vocabulary.map((item) => <tr key={item.id}><td><strong>{item.german}</strong><small>Legacy ID: {item.legacyId ?? '—'}</small></td><td>{item.english ?? '—'}</td><td>{item.meaning?.te ?? '—'}</td><td>{item.chapter?.title ?? '—'}<small>{item.chapter?.slug}</small></td><td>{item.chapter?.level ?? '—'}</td><td><div className="rowActions"><button onClick={() => edit(item)}>View / Edit</button><button className="dangerButton" onClick={() => setPendingDelete(item)}>Delete</button></div></td></tr>)}</tbody></table>}</div><Drawer open={drawer} title={form.id ? 'Edit word' : 'Add word'} subtitle="Pick the chapter from a dropdown; no hidden IDs." onClose={() => setDrawer(false)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(false)}>Cancel</button><AsyncButton form="wordForm" className="primaryButton" busy={busy} busyLabel="Saving…">{form.id ? 'Update word' : 'Add word'}</AsyncButton></>}><form id="wordForm" className="formStack" onSubmit={save}><label>Chapter<select value={form.chapterId} onChange={(e) => setForm({ ...form, chapterId: e.target.value })}><option value="">Select chapter</option>{options.chapters.map((chapter: any) => <option key={chapter.id} value={chapter.id}>{chapterLabel(chapter)}</option>)}</select></label><div className="formGrid2"><label>German<input value={form.german} onChange={(e) => setForm({ ...form, german: e.target.value })} /></label><label>English<input value={form.english} onChange={(e) => setForm({ ...form, english: e.target.value })} /></label></div><label>Meanings JSON<textarea value={form.meaning} onChange={(e) => setForm({ ...form, meaning: e.target.value })} /></label><label>Sort order<input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label></form></Drawer></section>;
}
