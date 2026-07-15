import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';

export function TaxonomyPage() {
  const [data, setData] = useState<any>({ categories: [], series: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/v1/admin/content-taxonomy')
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load taxonomy'));
  }, []);

  return (
    <section className="page widePage">
      <div className="pageHeader"><div><h1>Categories & Series</h1><p>Legacy course categories and content series used by chapters.</p></div></div>
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="statsGrid">
        <StatCard title="Categories" value={data.categories?.length ?? 0} caption="Lesson groupings" />
        <StatCard title="Series" value={data.series?.length ?? 0} caption="Featured pathways" />
        <StatCard title="Source" value="Legacy" caption="Old DB import" />
        <StatCard title="Course" value="German" caption="Mapped course" />
      </div>
      <div className="twoCol">
        <div className="panel tablePanel">
          <h2>Categories</h2>
          <table className="dataTable"><thead><tr><th>Name</th><th>Icon</th><th>Status</th></tr></thead><tbody>
            {(data.categories ?? []).map((item: any) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.description ?? ''}</small></td><td>{item.icon ?? '—'}</td><td><span className={item.is_active ? 'statusBadge good' : 'statusBadge warn'}>{item.is_active ? 'Active' : 'Off'}</span></td></tr>)}
          </tbody></table>
        </div>
        <div className="panel tablePanel">
          <h2>Series</h2>
          <table className="dataTable"><thead><tr><th>Title</th><th>Subtitle</th><th>Status</th></tr></thead><tbody>
            {(data.series ?? []).map((item: any) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.description ?? ''}</small></td><td>{item.subtitle ?? '—'}</td><td><span className={item.is_active ? 'statusBadge good' : 'statusBadge warn'}>{item.is_active ? 'Active' : 'Off'}</span>{item.is_featured ? <span className="statusBadge premium">Featured</span> : null}</td></tr>)}
          </tbody></table>
        </div>
      </div>
    </section>
  );
}
