import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';

export function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [language, setLanguage] = useState('');
  const [error, setError] = useState('');

  function load() {
    setError('');
    api.get('/v1/admin/notes', { params: { language: language || undefined } })
      .then((res) => setNotes(res.data.notes ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notes'));
  }

  useEffect(() => { load(); }, []);
  const languages = useMemo(() => Array.from(new Set(notes.map((item) => item.languageCode).filter(Boolean))).sort(), [notes]);

  return (
    <section className="page widePage">
      <div className="pageHeader"><div><h1>Notes Dashboard</h1><p>Study note blocks imported from the old lesson_notes table.</p></div></div>
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="statsGrid">
        <StatCard title="Notes" value={notes.length} caption="Filtered records" />
        <StatCard title="Languages" value={languages.length} caption="Note languages" />
        <StatCard title="Source" value="Legacy" caption="Old DB import" />
        <StatCard title="Editable" value="Next" caption="Preview now" />
      </div>
      <div className="panel toolbarPanel">
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">All languages</option>
          {languages.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="primaryButton" onClick={load}>Apply</button>
      </div>
      <div className="cardGrid">
        {notes.map((note) => (
          <div className="panel noteCard" key={note.id}>
            <div className="sectionTitle"><h2>{note.chapter?.title ?? 'Untitled chapter'}</h2><span>{note.languageCode}</span></div>
            <p>{note.content}</p>
            <small>{note.chapter?.level ?? ''} · {note.chapter?.slug ?? ''}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
