import { FormEvent, useEffect, useState } from 'react';
import { api, signUpload } from '../api/client';
import { FileUploadBox } from '../components/FileUploadBox';

export function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [courseForm, setCourseForm] = useState({ slug: 'german', title: '{"en":"German Course"}', description: '{"en":"A1 to B1 lessons"}' });
  const [levelForm, setLevelForm] = useState({ courseId: '', slug: 'A1', title: '{"en":"A1"}' });
  const [chapterForm, setChapterForm] = useState({ levelId: '', slug: 'chapter-01', number: 1, title: '{"en":"Chapter 01"}' });
  const [assetForm, setAssetForm] = useState({ chapterId: '', languageCode: 'te', assetType: 'audio', storagePath: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const run = async (action: () => Promise<void>) => {
    setError('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); }
  };

  async function load() {
    const { data } = await api.get('/v1/admin/courses');
    setCourses(data.courses ?? []);
  }

  useEffect(() => { load(); }, []);

  async function createCourse(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api.post('/v1/admin/courses', { slug: courseForm.slug, title: JSON.parse(courseForm.title), description: JSON.parse(courseForm.description) });
      await load();
    });
  }

  async function createLevel(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api.post('/v1/admin/levels', { courseId: levelForm.courseId, slug: levelForm.slug, title: JSON.parse(levelForm.title) });
      await load();
    });
  }

  async function createChapter(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api.post('/v1/admin/chapters', { levelId: chapterForm.levelId, slug: chapterForm.slug, number: chapterForm.number, title: JSON.parse(chapterForm.title) });
      await load();
    });
  }

  async function saveAsset() {
    await run(async () => {
      await api.post('/v1/admin/chapter-assets', assetForm);
      setMessage('Chapter asset saved. Publish the level manifest after changes.');
    });
  }

  async function publish(courseSlug: string, levelSlug: string) {
    await run(async () => {
      const { data } = await api.post(`/v1/admin/courses/${courseSlug}/levels/${levelSlug}/publish`, { languageCode: 'te' });
      setMessage(`Published manifest: ${data.url}`);
    });
  }

  return (
    <section className="page">
      <div className="pageHeader"><div><h1>Courses</h1><p>Manage A1/A2/B1 chapters and language audio.</p></div></div>
      {message ? <div className="successBox">{message}</div> : null}
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="grid3">
        <form className="panel formStack" onSubmit={createCourse}>
          <h2>Course</h2>
          <label>Slug<input value={courseForm.slug} onChange={(e) => setCourseForm({...courseForm, slug:e.target.value})}/></label>
          <label>Title JSON<textarea value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title:e.target.value})}/></label>
          <label>Description JSON<textarea value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description:e.target.value})}/></label>
          <button className="primaryButton">Create course</button>
        </form>
        <form className="panel formStack" onSubmit={createLevel}>
          <h2>Level</h2>
          <label>Course<select value={levelForm.courseId} onChange={(e) => setLevelForm({...levelForm, courseId:e.target.value})}><option value="">Select</option>{courses.map((c)=><option key={c.id} value={c.id}>{c.slug}</option>)}</select></label>
          <label>Slug<input value={levelForm.slug} onChange={(e) => setLevelForm({...levelForm, slug:e.target.value})}/></label>
          <label>Title JSON<textarea value={levelForm.title} onChange={(e) => setLevelForm({...levelForm, title:e.target.value})}/></label>
          <button className="primaryButton">Create level</button>
        </form>
        <form className="panel formStack" onSubmit={createChapter}>
          <h2>Chapter</h2>
          <label>Level<select value={chapterForm.levelId} onChange={(e) => setChapterForm({...chapterForm, levelId:e.target.value})}><option value="">Select</option>{courses.flatMap((c)=>c.levels ?? []).map((l:any)=><option key={l.id} value={l.id}>{l.slug}</option>)}</select></label>
          <label>Slug<input value={chapterForm.slug} onChange={(e) => setChapterForm({...chapterForm, slug:e.target.value})}/></label>
          <label>Number<input type="number" value={chapterForm.number} onChange={(e) => setChapterForm({...chapterForm, number:Number(e.target.value)})}/></label>
          <label>Title JSON<textarea value={chapterForm.title} onChange={(e) => setChapterForm({...chapterForm, title:e.target.value})}/></label>
          <button className="primaryButton">Create chapter</button>
        </form>
      </div>
      <div className="twoCol">
        <div className="panel formStack">
          <h2>Upload chapter asset</h2>
          <label>Chapter ID<input value={assetForm.chapterId} onChange={(e)=>setAssetForm({...assetForm, chapterId:e.target.value})}/></label>
          <label>Language<select value={assetForm.languageCode} onChange={(e)=>setAssetForm({...assetForm, languageCode:e.target.value})}><option value="te">Telugu</option><option value="ta">Tamil</option><option value="kn">Kannada</option><option value="hi">Hindi</option></select></label>
          <label>Asset type<select value={assetForm.assetType} onChange={(e)=>setAssetForm({...assetForm, assetType:e.target.value})}><option value="audio">Audio</option><option value="transcript">Transcript</option><option value="cover">Cover</option><option value="pdf">PDF</option></select></label>
          <FileUploadBox label="Upload audio/file" onFile={async (file) => {
            const upload = await signUpload(file, `courses/german/assets`);
            setAssetForm({...assetForm, storagePath: upload.storagePath});
          }} />
          <label>Storage path<input value={assetForm.storagePath} onChange={(e)=>setAssetForm({...assetForm, storagePath:e.target.value})}/></label>
          <button className="primaryButton" onClick={saveAsset}>Save asset</button>
        </div>
        <div className="panel">
          <h2>Existing courses</h2>
          {courses.map((course) => <div className="listCard" key={course.id}><strong>{course.slug}</strong>{(course.levels ?? []).map((level:any)=><div key={level.id} className="subRow"><span>{level.slug}</span><button onClick={()=>publish(course.slug, level.slug)}>Publish TE manifest</button></div>)}</div>)}
        </div>
      </div>
    </section>
  );
}
