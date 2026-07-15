import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiBaseUrl, getApiHealth } from '../api/client';
import { StatCard } from '../components/StatCard';

function ReadyBadge({ ready, label }: { ready: boolean; label: string }) {
  return <span className={ready ? 'statusBadge good' : 'statusBadge warn'}>{label}: {ready ? 'Ready' : 'Needs work'}</span>;
}

export function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
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

    api.get('/v1/admin/overview')
      .then((res) => setOverview(res.data))
      .catch((err) => setApiError(err instanceof Error ? err.message : 'Overview failed'));
  }, []);

  const counts = overview?.counts ?? {};
  const health = overview?.health ?? {};

  return (
    <section className="page widePage">
      <div className="pageHeader heroHeader">
        <div>
          <p className="eyebrow">Production Admin</p>
          <h1>DeutschFlow Command Center</h1>
          <p>Manage courses, old MySQL content, LiD Test data, media, manifests, and app delivery from one dashboard.</p>
        </div>
        <div className="healthPill">API: <strong>{apiOk ? 'Connected' : 'Checking'}</strong></div>
      </div>

      <div className="hintBox">API base: <strong>{apiBaseUrl}</strong> · Public bootstrap: <strong>{bootstrap ? 'Loaded' : 'Loading'}</strong></div>
      {apiError ? <div className="errorBox">{apiError}</div> : null}

      <div className="statsGrid megaStats">
        <StatCard title="Languages" value={counts.languages ?? bootstrap?.languages?.length ?? '—'} caption="App language records" />
        <StatCard title="Levels" value={counts.levels ?? '—'} caption="A1 to C2 structure" />
        <StatCard title="Chapters" value={counts.chapters ?? '—'} caption="Legacy lessons imported" />
        <StatCard title="Vocabulary" value={counts.vocabulary ?? '—'} caption="German words/phrases" />
        <StatCard title="Notes" value={counts.notes ?? '—'} caption="Language study notes" />
        <StatCard title="Videos" value={counts.videos ?? '—'} caption="Lesson videos" />
        <StatCard title="Quiz" value={counts.quiz ?? '—'} caption="Practice questions" />
        <StatCard title="LiD Cards" value={counts.lidCards ?? '—'} caption="BAMF catalog cards" />
      </div>

      <div className="twoCol contentTop">
        <div className="panel">
          <div className="sectionTitle"><h2>Content readiness</h2><span>Backend import status</span></div>
          <div className="badgeStack">
            <ReadyBadge ready={Boolean(health.courseContentReady)} label="Course content" />
            <ReadyBadge ready={Boolean(health.vocabularyReady)} label="Vocabulary" />
            <ReadyBadge ready={Boolean(health.mediaReady)} label="Media" />
            <ReadyBadge ready={Boolean(health.lidReady)} label="LiD catalog" />
            <ReadyBadge ready={Boolean(health.publishedContentReady)} label="Published manifests" />
          </div>
          <div className="quickGrid">
            <Link to="/chapters">Review chapters</Link>
            <Link to="/vocabulary">Review vocabulary</Link>
            <Link to="/videos">Review videos</Link>
            <Link to="/quiz">Review quiz</Link>
          </div>
        </div>

        <div className="panel">
          <div className="sectionTitle"><h2>Imported legacy content</h2><span>From old MySQL DB</span></div>
          <div className="miniStats">
            <div><strong>{counts.categories ?? '—'}</strong><span>Categories</span></div>
            <div><strong>{counts.series ?? '—'}</strong><span>Series</span></div>
            <div><strong>{counts.transcripts ?? '—'}</strong><span>Transcripts</span></div>
            <div><strong>{counts.chapterAssets ?? '—'}</strong><span>Assets</span></div>
          </div>
          <p className="muted">The imported data is now stored in Supabase tables and can be previewed in the new dashboards.</p>
        </div>
      </div>

      <div className="twoCol">
        <div className="panel">
          <div className="sectionTitle"><h2>Recent chapters</h2><span>Latest imported/updated</span></div>
          <div className="stackList">
            {(overview?.recentChapters ?? []).map((chapter: any) => (
              <div className="compactRow" key={chapter.id}>
                <div><strong>{chapter.title}</strong><small>{chapter.course?.toUpperCase()} · {chapter.level} · #{chapter.number}</small></div>
                <span className={chapter.isActive ? 'statusBadge good' : 'statusBadge warn'}>{chapter.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
            {!overview?.recentChapters?.length ? <p className="muted">No chapters found yet.</p> : null}
          </div>
        </div>
        <div className="panel">
          <div className="sectionTitle"><h2>Latest releases</h2><span>Published manifests</span></div>
          <div className="stackList">
            {(overview?.latestReleases ?? []).map((release: any) => (
              <div className="compactRow" key={release.id}>
                <div><strong>{release.module}</strong><small>{release.language_code ?? 'all'} · {release.version}</small></div>
                <span className={release.is_active ? 'statusBadge good' : 'statusBadge warn'}>{release.is_active ? 'Active' : 'Off'}</span>
              </div>
            ))}
            {!overview?.latestReleases?.length ? <p className="muted">No releases yet. Publish a level/LiD manifest when ready.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
