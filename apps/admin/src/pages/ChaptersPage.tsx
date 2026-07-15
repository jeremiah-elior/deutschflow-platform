import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';

export function ChaptersPage() {
  const [chapters, setChapters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError('');
    api.get('/v1/admin/chapters', { params: { search: search || undefined, level: level || undefined } })
      .then((res) => setChapters(res.data.chapters ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load chapters'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const levels = useMemo(() => Array.from(new Set(chapters.map((item) => item.level).filter(Boolean))).sort(), [chapters]);
  const totals = useMemo(() => chapters.reduce((acc, chapter) => {
    acc.vocabulary += chapter.counts?.vocabulary ?? 0;
    acc.notes += chapter.counts?.notes ?? 0;
    acc.videos += chapter.counts?.videos ?? 0;
    acc.quiz += chapter.counts?.quiz ?? 0;
    return acc;
  }, { vocabulary: 0, notes: 0, videos: 0, quiz: 0 }), [chapters]);

  return (
    <section className="page widePage">
      <div className="pageHeader"><div><h1>Chapters Dashboard</h1><p>Preview imported lessons with level, category, series, media, vocabulary, notes, and quiz counts.</p></div></div>
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="statsGrid">
        <StatCard title="Chapters" value={chapters.length} caption="Filtered lessons" />
        <StatCard title="Vocabulary" value={totals.vocabulary} caption="Words in these chapters" />
        <StatCard title="Notes" value={totals.notes} caption="Study note blocks" />
        <StatCard title="Videos" value={totals.videos} caption="Video records" />
      </div>
      <div className="panel toolbarPanel">
        <input placeholder="Search chapter title/category/series..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">All levels</option>
          {levels.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="primaryButton" onClick={load}>Apply</button>
      </div>
      <div className="panel tablePanel">
        {loading ? <p>Loading chapters...</p> : null}
        <table className="dataTable">
          <thead><tr><th>#</th><th>Chapter</th><th>Level</th><th>Category</th><th>Series</th><th>Content</th><th>Status</th></tr></thead>
          <tbody>
            {chapters.map((chapter) => (
              <tr key={chapter.id}>
                <td>{chapter.number}</td>
                <td><strong>{chapter.title}</strong><small>{chapter.slug}<br />Legacy ID: {chapter.legacyId ?? '—'}</small></td>
                <td>{chapter.level ?? '—'}</td>
                <td>{chapter.category?.name ?? '—'}</td>
                <td>{chapter.series?.title ?? '—'}</td>
                <td><span className="pillLine">Vocab {chapter.counts?.vocabulary ?? 0}</span><span className="pillLine">Notes {chapter.counts?.notes ?? 0}</span><span className="pillLine">Videos {chapter.counts?.videos ?? 0}</span><span className="pillLine">Quiz {chapter.counts?.quiz ?? 0}</span></td>
                <td><span className={chapter.isActive ? 'statusBadge good' : 'statusBadge warn'}>{chapter.isActive ? 'Active' : 'Inactive'}</span>{chapter.isPremium ? <span className="statusBadge premium">Premium</span> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !chapters.length ? <p className="muted">No chapters found.</p> : null}
      </div>
    </section>
  );
}
