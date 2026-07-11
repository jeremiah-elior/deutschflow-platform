import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';

export function DashboardPage() {
  const [bootstrap, setBootstrap] = useState<any>(null);

  useEffect(() => {
    api.get('/v1/app/bootstrap?lang=te').then((res) => setBootstrap(res.data)).catch(console.error);
  }, []);

  return (
    <section className="page">
      <div className="pageHeader">
        <div>
          <h1>Dashboard</h1>
          <p>One content backend for Android and iOS.</p>
        </div>
      </div>
      <div className="statsGrid">
        <StatCard title="Languages" value={bootstrap?.languages?.length ?? '—'} caption="Active in app" />
        <StatCard title="Courses" value={bootstrap?.courses?.length ?? '—'} caption="Published courses" />
        <StatCard title="LiD Manifest" value={bootstrap?.modules?.lid?.manifestAvailable ? 'Ready' : 'Missing'} caption="Publish from LiD Test" />
        <StatCard title="API" value="v1" caption="Stable app contract" />
      </div>
      <div className="panel">
        <h2>Future-ready content flow</h2>
        <div className="flowGrid">
          <div>React Admin</div><div>Node API</div><div>Supabase DB</div><div>Storage/CDN</div><div>Android / iOS Cache</div>
        </div>
      </div>
    </section>
  );
}
