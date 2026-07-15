import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';

export function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError('');
    api.get('/v1/admin/vocabulary', { params: { search: search || undefined, limit: 1000 } })
      .then((res) => setVocabulary(res.data.vocabulary ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load vocabulary'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const chapters = useMemo(() => new Set(vocabulary.map((item) => item.chapter?.id).filter(Boolean)).size, [vocabulary]);
  const teluguCount = useMemo(() => vocabulary.filter((item) => item.meaning?.te).length, [vocabulary]);

  return (
    <section className="page widePage">
      <div className="pageHeader"><div><h1>Vocabulary Dashboard</h1><p>German vocabulary from the old database, mapped to chapters and levels.</p></div></div>
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="statsGrid">
        <StatCard title="Vocabulary" value={vocabulary.length} caption="Filtered records" />
        <StatCard title="Chapters" value={chapters} caption="Linked lessons" />
        <StatCard title="Telugu Meanings" value={teluguCount} caption="Available translations" />
        <StatCard title="Source" value="Legacy" caption="MySQL import" />
      </div>
      <div className="panel toolbarPanel">
        <input placeholder="Search German or English..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="primaryButton" onClick={load}>Search</button>
      </div>
      <div className="panel tablePanel">
        {loading ? <p>Loading vocabulary...</p> : null}
        <table className="dataTable">
          <thead><tr><th>German</th><th>English</th><th>Telugu</th><th>Chapter</th><th>Level</th></tr></thead>
          <tbody>
            {vocabulary.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.german}</strong><small>Legacy ID: {item.legacyId ?? '—'}</small></td>
                <td>{item.english ?? '—'}</td>
                <td>{item.meaning?.te ?? '—'}</td>
                <td>{item.chapter?.title ?? '—'}<small>{item.chapter?.slug}</small></td>
                <td>{item.chapter?.level ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !vocabulary.length ? <p className="muted">No vocabulary found.</p> : null}
      </div>
    </section>
  );
}
