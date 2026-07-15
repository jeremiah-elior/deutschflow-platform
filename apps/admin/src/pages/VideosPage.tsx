import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';

export function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/v1/admin/videos')
      .then((res) => setVideos(res.data.videos ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load videos'));
  }, []);

  return (
    <section className="page widePage">
      <div className="pageHeader"><div><h1>Videos Dashboard</h1><p>Lesson video records and preview status.</p></div></div>
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="statsGrid">
        <StatCard title="Videos" value={videos.length} caption="Imported records" />
        <StatCard title="Enabled" value={videos.filter((item) => item.is_enabled).length} caption="Visible to app" />
        <StatCard title="Preview" value={videos.filter((item) => item.show_as_preview).length} caption="Free preview" />
        <StatCard title="Premium" value={videos.filter((item) => item.is_premium).length} caption="Premium videos" />
      </div>
      <div className="panel tablePanel">
        <table className="dataTable">
          <thead><tr><th>Video</th><th>Chapter</th><th>URL</th><th>Status</th></tr></thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id}>
                <td><strong>{video.title}</strong><small>{video.duration_seconds ?? 0}s · Legacy ID: {video.legacy_id ?? '—'}</small></td>
                <td>{video.chapter?.title ?? '—'}<small>{video.chapter?.level ?? ''}</small></td>
                <td><a className="tableLink" href={video.video_url} target="_blank" rel="noreferrer">Open video</a></td>
                <td><span className={video.is_enabled ? 'statusBadge good' : 'statusBadge warn'}>{video.is_enabled ? 'Enabled' : 'Off'}</span>{video.is_premium ? <span className="statusBadge premium">Premium</span> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!videos.length ? <p className="muted">No videos found.</p> : null}
      </div>
    </section>
  );
}
