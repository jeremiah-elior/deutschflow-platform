import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';

export function QuizPage() {
  const [quiz, setQuiz] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/v1/admin/quiz')
      .then((res) => setQuiz(res.data.quiz ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load quiz'));
  }, []);

  return (
    <section className="page widePage">
      <div className="pageHeader"><div><h1>Quiz Dashboard</h1><p>Practice questions imported from the old DB.</p></div></div>
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="statsGrid">
        <StatCard title="Questions" value={quiz.length} caption="Imported quiz records" />
        <StatCard title="Active" value={quiz.filter((item) => item.is_active).length} caption="Visible questions" />
        <StatCard title="Sources" value={new Set(quiz.map((item) => item.source_table)).size} caption="Legacy tables" />
        <StatCard title="Correct Keys" value={new Set(quiz.map((item) => item.correct_option)).size} caption="Answer variants" />
      </div>
      <div className="panel tablePanel">
        <table className="dataTable">
          <thead><tr><th>Question</th><th>Options</th><th>Answer</th><th>Chapter</th><th>Status</th></tr></thead>
          <tbody>
            {quiz.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.question}</strong><small>{item.source_table} · Legacy ID: {item.legacy_id ?? '—'}</small></td>
                <td><small>A: {item.options_json?.a ?? '—'}<br />B: {item.options_json?.b ?? '—'}<br />C: {item.options_json?.c ?? '—'}<br />D: {item.options_json?.d ?? '—'}</small></td>
                <td><span className="answerKey">{String(item.correct_option ?? '').toUpperCase()}</span></td>
                <td>{item.chapter?.title ?? '—'}<small>{item.chapter?.level ?? ''}</small></td>
                <td><span className={item.is_active ? 'statusBadge good' : 'statusBadge warn'}>{item.is_active ? 'Active' : 'Off'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!quiz.length ? <p className="muted">No quiz questions found.</p> : null}
      </div>
    </section>
  );
}
