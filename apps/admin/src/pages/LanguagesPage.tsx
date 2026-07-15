import { FormEvent, useEffect, useState } from 'react';
import { api, apiBaseUrl } from '../api/client';

export function LanguagesPage() {
  const [languages, setLanguages] = useState<any[]>([]);
  const [form, setForm] = useState({ code: 'te', name: 'Telugu', nativeName: 'తెలుగు', sortOrder: 1, isActive: true });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setError('');
    try {
      const { data } = await api.get('/v1/admin/languages');
      setLanguages(data.languages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load languages');
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.post('/v1/admin/languages', form);
      setMessage('Language saved.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save language');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <div className="pageHeader"><div><h1>Languages</h1><p>Manage app languages without changing APIs.</p></div></div>
      <div className="hintBox">API base: <strong>{apiBaseUrl}</strong>. Save buttons need the Node API running.</div>
      {message ? <div className="successBox">{message}</div> : null}
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="twoCol">
        <form className="panel formStack" onSubmit={submit}>
          <h2>Add / update language</h2>
          <label>Code<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Native name<input value={form.nativeName} onChange={(e) => setForm({ ...form, nativeName: e.target.value })} /></label>
          <label>Sort order<input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label>
          <label className="inlineCheck"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active in app</label>
          <button className="primaryButton" disabled={saving}>{saving ? 'Saving...' : 'Save language'}</button>
        </form>
        <div className="panel">
          <h2>Active languages</h2>
          <table><tbody>{languages.map((lang) => <tr key={lang.code}><td><strong>{lang.name}</strong><br/><small>{lang.native_name}</small></td><td>{lang.code}</td><td>{lang.is_active ? 'Active' : 'Hidden'}</td></tr>)}</tbody></table>
        </div>
      </div>
    </section>
  );
}
