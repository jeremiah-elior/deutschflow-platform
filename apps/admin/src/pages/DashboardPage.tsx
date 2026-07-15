import { useEffect, useState } from 'react';
import { api, apiBaseUrl, getApiHealth } from '../api/client';
import { StatCard } from '../components/StatCard';

export function DashboardPage() {
  const [bootstrap, setBootstrap] = useState<any>(null);
  const [apiError, setApiError] = useState('');
  const [apiOk, setApiOk] = useState(false);

  useEffect(() => {
    getApiHealth()
      .then(() => setApiOk(true))
      .catch((err) => setApiError(err instanceof Error ? err.message : 'API health check failed'));

    api.get('/v1/app/bootstrap?lang=te')
      .then((res) => setBootstrap(res.data))
      .catch((err) => setApiError(err instanceof Error ? err.message : 'Bootstrap failed'));
  }, []);

  return (
    <section className="page">
      <div className="pageHeader">
        <div>
          <h1>Dashboard</h1>
          <p>One content backend for Android and iOS.</p>
        </div>
      </div>
      <div className="hintBox">API base: <strong>{apiBaseUrl}</strong> · Health: <strong>{apiOk ? 'Connected' : 'Not connected yet'}</strong></div>
      {apiError ? <div className="errorBox">{apiError}</div> : null}
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
