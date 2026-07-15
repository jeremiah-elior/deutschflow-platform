import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { AsyncButton, BusyOverlay, ConfirmBar, Drawer, EmptyState, PageNotice } from '../components/AdminUi';
import { chapterLabel } from '../utils/adminHelpers';

const emptyForm = { id: '', chapterId: '', languageCode: 'te', content: '' };

export function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({ chapters: [], languages: [] });
  const [language, setLanguage] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [busyLabel, setBusyLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const busy = Boolean(busyLabel);
  async function load() { setLoading(true); setError(''); try { const [noteRes, optionRes] = await Promise.all([api.get('/v1/admin/notes', { params: { language: language || undefined } }), api.get('/v1/admin/content-options')]); setNotes(noteRes.data.notes ?? []); setOptions(optionRes.data ?? { chapters: [], languages: [] }); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load notes'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  const languages = useMemo(() => Array.from(new Set(notes.map((item) => item.languageCode).filter(Boolean))).sort(), [notes]);
  async function run(label: string, action: () => Promise<void>) { setBusyLabel(label); setError(''); setMessage(''); try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); } finally { setBusyLabel(''); } }
  function add() { setForm(emptyForm); setDrawer(true); }
  function edit(note: any) { setForm({ id: note.id, chapterId: note.chapter?.id ?? '', languageCode: note.languageCode, content: note.content }); setDrawer(true); }
  async function save(event: FormEvent) { event.preventDefault(); await run(form.id ? 'Updating note…' : 'Saving note…', async () => { const body = { chapterId: form.chapterId, languageCode: form.languageCode, content: form.content }; if (form.id) await api.patch(`/v1/admin/notes/${form.id}`, body); else await api.post('/v1/admin/notes', body); setMessage(form.id ? 'Note updated.' : 'Note saved.'); setDrawer(false); await load(); }); }
  async function remove() { if (!pendingDelete) return; await run('Deleting note…', async () => { await api.delete(`/v1/admin/notes/${pendingDelete.id}`); setMessage('Note deleted.'); setPendingDelete(null); await load(); }); }
  return <section className="page widePage"><BusyOverlay show={busy} label={busyLabel} /><div className="pageHeader"><div><h1>Notes</h1><p>Study notes by chapter and language. Edit opens in a drawer.</p></div><div className="pageHeaderActions"><button className="secondaryButton" onClick={load}><RefreshCw size={16} /> Refresh</button><button className="primaryButton" onClick={add}><Plus size={16} /> Add note</button></div></div><PageNotice type="success">{message}</PageNotice><PageNotice type="error">{error}</PageNotice>{pendingDelete ? <ConfirmBar title="Delete this note?" body="This note will no longer appear in the app." busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={remove} /> : null}<div className="statsGrid"><StatCard title="Notes" value={notes.length} caption="Filtered records" /><StatCard title="Languages" value={languages.length} caption="Note languages" /><StatCard title="Mode" value="CRUD" caption="Create/edit/delete" /><StatCard title="Source" value="Legacy" caption="Old DB import" /></div><div className="panel toolbarPanel"><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="">All languages</option>{languages.map((item) => <option key={item as string} value={item as string}>{item as string}</option>)}</select><button className="primaryButton" onClick={load}>Apply</button></div><div className="panel"><div className="listHeader"><h2>Notes</h2><span className="muted">{loading ? 'Loading…' : `${notes.length} rows`}</span></div>{loading ? <p>Loading notes…</p> : null}{!loading && !notes.length ? <EmptyState title="No notes found" /> : <div className="cardGrid">{notes.map((note) => <article className="listCard noteCard" key={note.id}><div className="actionHeader"><div><strong>{note.chapter?.title ?? 'Unlinked chapter'}</strong><small>{note.chapter?.level ?? ''} · {note.languageCode} · Legacy ID: {note.legacyId ?? '—'}</small></div><div className="rowActions"><button onClick={() => edit(note)}>View / Edit</button><button className="dangerButton" onClick={() => setPendingDelete(note)}>Delete</button></div></div><p>{note.content}</p></article>)}</div>}</div><Drawer open={drawer} title={form.id ? 'Edit note' : 'Add note'} subtitle="Choose chapter and language. Saving state is shown below." onClose={() => setDrawer(false)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(false)}>Cancel</button><AsyncButton form="noteForm" className="primaryButton" busy={busy} busyLabel="Saving…">{form.id ? 'Update note' : 'Save note'}</AsyncButton></>}><form id="noteForm" className="formStack" onSubmit={save}><label>Chapter<select value={form.chapterId} onChange={(e) => setForm({ ...form, chapterId: e.target.value })}><option value="">Select chapter</option>{options.chapters.map((chapter: any) => <option key={chapter.id} value={chapter.id}>{chapterLabel(chapter)}</option>)}</select></label><label>Language<select value={form.languageCode} onChange={(e) => setForm({ ...form, languageCode: e.target.value })}>{options.languages.map((lang: any) => <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>)}</select></label><label>Note content<textarea className="largeTextarea" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label></form></Drawer></section>;
}
