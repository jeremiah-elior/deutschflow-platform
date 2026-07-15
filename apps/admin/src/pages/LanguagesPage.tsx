import { FormEvent, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { api, apiBaseUrl } from '../api/client';
import { AsyncButton, BusyOverlay, ConfirmBar, Drawer, EmptyState, PageNotice } from '../components/AdminUi';

const emptyForm = { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', sortOrder: 1, isActive: true };

export function LanguagesPage() {
  const [languages, setLanguages] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [drawer, setDrawer] = useState(false);
  const [pendingHide, setPendingHide] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyLabel, setBusyLabel] = useState('');
  const busy = Boolean(busyLabel);

  async function load() { setLoading(true); setError(''); try { const { data } = await api.get('/v1/admin/languages'); setLanguages(data.languages ?? []); } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load languages'); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  function add() { setForm(emptyForm); setDrawer(true); }
  function edit(lang: any) { setForm({ code: lang.code, name: lang.name, nativeName: lang.native_name ?? '', sortOrder: lang.sort_order ?? 0, isActive: Boolean(lang.is_active) }); setDrawer(true); }
  async function run(label: string, action: () => Promise<void>) { setBusyLabel(label); setError(''); setMessage(''); try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); } finally { setBusyLabel(''); } }
  async function submit(event: FormEvent) { event.preventDefault(); await run('Saving language…', async () => { await api.post('/v1/admin/languages', form); setMessage('Language saved.'); setDrawer(false); await load(); }); }
  async function hide() { if (!pendingHide) return; await run('Hiding language…', async () => { await api.delete(`/v1/admin/languages/${pendingHide.code}`); setMessage('Language hidden from app.'); setPendingHide(null); await load(); }); }

  return <section className="page widePage"><BusyOverlay show={busy} label={busyLabel} /><div className="pageHeader"><div><h1>Languages</h1><p>Manage app languages with edit drawers and visible saving states.</p></div><div className="pageHeaderActions"><button className="secondaryButton" onClick={load}><RefreshCw size={16} /> Refresh</button><button className="primaryButton" onClick={add}><Plus size={16} /> Add language</button></div></div><div className="hintBox">API base: <strong>{apiBaseUrl}</strong>.</div><PageNotice type="success">{message}</PageNotice><PageNotice type="error">{error}</PageNotice>{pendingHide ? <ConfirmBar title={`Hide ${pendingHide.name}?`} body="It will remain in the database but will not be active in the app." busy={busy} confirmLabel="Hide" onCancel={() => setPendingHide(null)} onConfirm={hide} /> : null}<div className="panel tablePanel"><div className="listHeader"><h2>Languages</h2><span className="muted">{languages.length} records</span></div>{loading ? <p>Loading languages…</p> : null}{!loading && !languages.length ? <EmptyState title="No languages found" /> : <table className="dataTable compactDataTable"><thead><tr><th>Name</th><th>Native</th><th>Code</th><th>Sort</th><th>Status</th><th>Actions</th></tr></thead><tbody>{languages.map((lang) => <tr key={lang.code}><td><strong>{lang.name}</strong></td><td>{lang.native_name ?? '—'}</td><td>{lang.code}</td><td>{lang.sort_order ?? '—'}</td><td><span className={lang.is_active ? 'statusBadge good' : 'statusBadge warn'}>{lang.is_active ? 'Active' : 'Hidden'}</span></td><td><div className="rowActions"><button onClick={() => edit(lang)}>Edit</button><button className="dangerButton" onClick={() => setPendingHide(lang)}>Hide</button></div></td></tr>)}</tbody></table>}</div><Drawer open={drawer} title="Add / update language" subtitle="Changes are saved immediately after clicking Save." onClose={() => setDrawer(false)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(false)}>Cancel</button><AsyncButton form="languageForm" className="primaryButton" busy={busy} busyLabel="Saving…">Save language</AsyncButton></>}><form id="languageForm" className="formStack" onSubmit={submit}><label>Code<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label><label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Native name<input value={form.nativeName} onChange={(e) => setForm({ ...form, nativeName: e.target.value })} /></label><label>Sort order<input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label><label className="inlineCheck"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active in app</label></form></Drawer></section>;
}
