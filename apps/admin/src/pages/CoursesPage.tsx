import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, signUpload } from '../api/client';
import { FileUploadBox } from '../components/FileUploadBox';
import { chapterLabel, jsonText, labelFromJson, safeJsonParse } from '../utils/adminHelpers';

type Options = { languages: any[]; courses: any[]; chapters: any[]; categories: any[]; series: any[] };

const emptyOptions: Options = { languages: [], courses: [], chapters: [], categories: [], series: [] };

export function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [assets, setAssets] = useState<any[]>([]);
  const [courseForm, setCourseForm] = useState({ id: '', slug: 'german', title: '{"en":"German Course"}', description: '{"en":"A1 to B1 lessons"}', isActive: true });
  const [levelForm, setLevelForm] = useState({ id: '', courseId: '', slug: 'A1', title: '{"en":"A1"}', isActive: true });
  const [chapterForm, setChapterForm] = useState({ id: '', levelId: '', categoryId: '', seriesId: '', slug: 'chapter-01', number: 1, title: '{"en":"Chapter 01"}', isActive: true, isPremium: false, isFeatured: false });
  const [assetForm, setAssetForm] = useState({ id: '', chapterId: '', languageCode: 'te', assetType: 'audio', storagePath: '', isActive: true });
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const levels = useMemo(() => courses.flatMap((course) => (course.levels ?? []).map((level: any) => ({ ...level, courseId: course.id, courseSlug: course.slug }))), [courses]);
  const courseLevels = useMemo(() => levels.filter((level: any) => !selectedCourseId || level.courseId === selectedCourseId), [levels, selectedCourseId]);
  const selectableChapters = useMemo(() => options.chapters.filter((chapter) => (!selectedCourseId || chapter.courseId === selectedCourseId) && (!selectedLevelId || chapter.levelId === selectedLevelId)), [options.chapters, selectedCourseId, selectedLevelId]);
  const selectedChapter = useMemo(() => options.chapters.find((chapter) => chapter.id === assetForm.chapterId), [options.chapters, assetForm.chapterId]);
  const selectedLevel = useMemo(() => levels.find((level: any) => level.id === selectedChapter?.levelId || level.id === chapterForm.levelId), [levels, selectedChapter, chapterForm.levelId]);
  const selectedCourse = useMemo(() => courses.find((course) => course.id === selectedChapter?.courseId || course.id === selectedLevel?.courseId), [courses, selectedChapter, selectedLevel]);

  async function run(action: () => Promise<void>) {
    setError(''); setMessage('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); }
  }

  async function load() {
    const [courseRes, optionRes, assetRes] = await Promise.all([
      api.get('/v1/admin/courses'),
      api.get('/v1/admin/content-options'),
      api.get('/v1/admin/chapter-assets')
    ]);
    setCourses(courseRes.data.courses ?? []);
    setOptions(optionRes.data ?? emptyOptions);
    setAssets(assetRes.data.assets ?? []);
  }

  useEffect(() => { load().catch((err) => setError(err instanceof Error ? err.message : 'Load failed')); }, []);

  function editCourse(course: any) {
    setCourseForm({ id: course.id, slug: course.slug, title: jsonText(course.title_json), description: jsonText(course.description_json), isActive: Boolean(course.is_active) });
  }

  function editLevel(level: any, courseId: string) {
    setLevelForm({ id: level.id, courseId, slug: level.slug, title: jsonText(level.title_json), isActive: Boolean(level.is_active ?? true) });
  }

  function editChapter(chapter: any) {
    setChapterForm({
      id: chapter.id,
      levelId: chapter.levelId,
      categoryId: chapter.category?.id ?? '',
      seriesId: chapter.series?.id ?? '',
      slug: chapter.slug,
      number: chapter.number,
      title: jsonText(chapter.titleJson),
      isActive: Boolean(chapter.isActive),
      isPremium: Boolean(chapter.isPremium),
      isFeatured: Boolean(chapter.isFeatured)
    });
  }

  async function saveCourse(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const body = { slug: courseForm.slug, title: safeJsonParse(courseForm.title), description: safeJsonParse(courseForm.description), isActive: courseForm.isActive };
      if (courseForm.id) await api.patch(`/v1/admin/courses/${courseForm.id}`, body); else await api.post('/v1/admin/courses', body);
      setMessage(courseForm.id ? 'Course updated.' : 'Course created.');
      setCourseForm({ id: '', slug: 'german', title: '{"en":"German Course"}', description: '{"en":"A1 to B1 lessons"}', isActive: true });
      await load();
    });
  }

  async function saveLevel(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const body = { courseId: levelForm.courseId, slug: levelForm.slug, title: safeJsonParse(levelForm.title), isActive: levelForm.isActive };
      if (levelForm.id) await api.patch(`/v1/admin/levels/${levelForm.id}`, body); else await api.post('/v1/admin/levels', body);
      setMessage(levelForm.id ? 'Level updated.' : 'Level created.');
      setLevelForm({ id: '', courseId: levelForm.courseId, slug: 'A1', title: '{"en":"A1"}', isActive: true });
      await load();
    });
  }

  async function saveChapter(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const body: any = { levelId: chapterForm.levelId, slug: chapterForm.slug, number: chapterForm.number, title: safeJsonParse(chapterForm.title), isActive: chapterForm.isActive, isPremium: chapterForm.isPremium, isFeatured: chapterForm.isFeatured };
      if (chapterForm.categoryId) body.categoryId = chapterForm.categoryId;
      if (chapterForm.seriesId) body.seriesId = chapterForm.seriesId;
      if (chapterForm.id) await api.patch(`/v1/admin/chapters/${chapterForm.id}`, body); else await api.post('/v1/admin/chapters', body);
      setMessage(chapterForm.id ? 'Chapter updated.' : 'Chapter created.');
      setChapterForm({ ...chapterForm, id: '' });
      await load();
    });
  }

  async function remove(path: string, id: string, label: string) {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    await run(async () => { await api.delete(`${path}/${id}`); setMessage(`${label} deleted.`); await load(); });
  }

  async function saveAsset() {
    await run(async () => {
      if (!assetForm.chapterId) throw new Error('Choose a chapter first.');
      if (!assetForm.storagePath) throw new Error('Upload a file first.');
      const body = { chapterId: assetForm.chapterId, languageCode: assetForm.languageCode, assetType: assetForm.assetType, storagePath: assetForm.storagePath, isActive: assetForm.isActive, version: new Date().toISOString() };
      if (assetForm.id) await api.patch(`/v1/admin/chapter-assets/${assetForm.id}`, body); else await api.post('/v1/admin/chapter-assets', body);
      setMessage('Asset saved. Now publish the level manifest.');
      setAssetForm({ id: '', chapterId: assetForm.chapterId, languageCode: assetForm.languageCode, assetType: assetForm.assetType, storagePath: '', isActive: true });
      await load();
    });
  }

  async function publish(courseSlug: string, levelSlug: string, languageCode = 'te') {
    await run(async () => {
      const { data } = await api.post(`/v1/admin/courses/${courseSlug}/levels/${levelSlug}/publish`, { languageCode });
      setMessage(`Published ${levelSlug} ${languageCode.toUpperCase()} manifest: ${data.url}`);
    });
  }

  function existingAssetForCurrentChoice() {
    return assets.find((asset) => asset.chapter_id === assetForm.chapterId && asset.language_code === assetForm.languageCode && asset.asset_type === assetForm.assetType);
  }

  return (
    <section className="page widePage">
      <div className="pageHeader"><div><h1>Courses</h1><p>Create, edit, delete, upload audio, and publish manifests without copying hidden IDs.</p></div></div>
      {message ? <div className="successBox">{message}</div> : null}
      {error ? <div className="errorBox">{error}</div> : null}

      <div className="panel">
        <div className="sectionTitle"><h2>Upload or replace chapter audio/file</h2><span>Choose human names. The system handles IDs and storage path.</span></div>
        <div className="smartUploadGrid">
          <label>Course<select value={selectedCourseId} onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedLevelId(''); setAssetForm({ ...assetForm, chapterId: '' }); }}><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.slug} · {labelFromJson(course.title_json, course.slug)}</option>)}</select></label>
          <label>Level<select value={selectedLevelId} onChange={(e) => { setSelectedLevelId(e.target.value); setAssetForm({ ...assetForm, chapterId: '' }); }}><option value="">All levels</option>{courseLevels.map((level: any) => <option key={level.id} value={level.id}>{level.courseSlug} · {level.slug}</option>)}</select></label>
          <label>Chapter<select value={assetForm.chapterId} onChange={(e) => setAssetForm({ ...assetForm, chapterId: e.target.value })}><option value="">Select chapter</option>{selectableChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapterLabel(chapter)}</option>)}</select></label>
          <label>Language<select value={assetForm.languageCode} onChange={(e) => setAssetForm({ ...assetForm, languageCode: e.target.value })}>{options.languages.filter((l) => l.is_active !== false).map((lang) => <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>)}</select></label>
          <label>Asset type<select value={assetForm.assetType} onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}><option value="audio">Audio</option><option value="video">Video</option><option value="cover">Cover image</option><option value="pdf">PDF</option><option value="transcript">Transcript</option></select></label>
        </div>
        <div className="twoCol compactTwoCol">
          <FileUploadBox label={existingAssetForCurrentChoice() ? 'Replace existing file' : 'Upload file'} accept={assetForm.assetType === 'audio' ? 'audio/*' : undefined} onFile={async (file) => {
            if (!selectedChapter) { setError('Choose a chapter before uploading.'); return; }
            const ext = file.name.includes('.') ? file.name.split('.').pop() : 'file';
            const courseSlug = selectedChapter.course || selectedCourse?.slug || 'german';
            const levelSlug = selectedChapter.level || selectedLevel?.slug || 'level';
            const folder = `courses/${courseSlug}/${levelSlug}/${selectedChapter.slug}/${assetForm.assetType}/${assetForm.languageCode}`;
            const upload = await signUpload(new File([file], `${assetForm.assetType}.${ext}`, { type: file.type }), folder);
            const existing = existingAssetForCurrentChoice();
            setAssetForm({ ...assetForm, id: existing?.id ?? '', storagePath: upload.storagePath });
            setMessage(`Uploaded ${file.name}. Click Save asset to link it to ${chapterLabel(selectedChapter)}.`);
          }} />
          <div className="assetPreview">
            <strong>Selected chapter</strong>
            <p>{selectedChapter ? chapterLabel(selectedChapter) : 'No chapter selected'}</p>
            <strong>Current file</strong>
            {existingAssetForCurrentChoice() ? <p><a className="tableLink" href={existingAssetForCurrentChoice().public_url} target="_blank" rel="noreferrer">Open existing asset</a></p> : <p className="muted">No existing asset for this chapter/language/type.</p>}
            <strong>New storage path</strong>
            <p className="pathText">{assetForm.storagePath || 'Upload a file to generate path'}</p>
            <button className="primaryButton" onClick={saveAsset}>Save asset</button>
          </div>
        </div>
      </div>

      <div className="grid3">
        <form className="panel formStack" onSubmit={saveCourse}>
          <h2>{courseForm.id ? 'Edit course' : 'Create course'}</h2>
          <label>Slug<input value={courseForm.slug} onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })} /></label>
          <label>Title JSON<textarea value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} /></label>
          <label>Description JSON<textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></label>
          <label className="inlineCheck"><input type="checkbox" checked={courseForm.isActive} onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })} /> Active</label>
          <button className="primaryButton">{courseForm.id ? 'Update course' : 'Create course'}</button>
        </form>
        <form className="panel formStack" onSubmit={saveLevel}>
          <h2>{levelForm.id ? 'Edit level' : 'Create level'}</h2>
          <label>Course<select value={levelForm.courseId} onChange={(e) => setLevelForm({ ...levelForm, courseId: e.target.value })}><option value="">Select</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.slug}</option>)}</select></label>
          <label>Slug<input value={levelForm.slug} onChange={(e) => setLevelForm({ ...levelForm, slug: e.target.value })} /></label>
          <label>Title JSON<textarea value={levelForm.title} onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })} /></label>
          <label className="inlineCheck"><input type="checkbox" checked={levelForm.isActive} onChange={(e) => setLevelForm({ ...levelForm, isActive: e.target.checked })} /> Active</label>
          <button className="primaryButton">{levelForm.id ? 'Update level' : 'Create level'}</button>
        </form>
        <form className="panel formStack" onSubmit={saveChapter}>
          <h2>{chapterForm.id ? 'Edit chapter' : 'Create chapter'}</h2>
          <label>Level<select value={chapterForm.levelId} onChange={(e) => setChapterForm({ ...chapterForm, levelId: e.target.value })}><option value="">Select</option>{levels.map((l: any) => <option key={l.id} value={l.id}>{l.courseSlug} · {l.slug}</option>)}</select></label>
          <label>Category<select value={chapterForm.categoryId} onChange={(e) => setChapterForm({ ...chapterForm, categoryId: e.target.value })}><option value="">None</option>{options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Series<select value={chapterForm.seriesId} onChange={(e) => setChapterForm({ ...chapterForm, seriesId: e.target.value })}><option value="">None</option>{options.series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
          <label>Slug<input value={chapterForm.slug} onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })} /></label>
          <label>Number<input type="number" value={chapterForm.number} onChange={(e) => setChapterForm({ ...chapterForm, number: Number(e.target.value) })} /></label>
          <label>Title JSON<textarea value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })} /></label>
          <label className="inlineCheck"><input type="checkbox" checked={chapterForm.isPremium} onChange={(e) => setChapterForm({ ...chapterForm, isPremium: e.target.checked })} /> Premium</label>
          <label className="inlineCheck"><input type="checkbox" checked={chapterForm.isActive} onChange={(e) => setChapterForm({ ...chapterForm, isActive: e.target.checked })} /> Active</label>
          <button className="primaryButton">{chapterForm.id ? 'Update chapter' : 'Create chapter'}</button>
        </form>
      </div>

      <div className="twoCol">
        <div className="panel tablePanel">
          <h2>Existing courses & levels</h2>
          {courses.map((course) => <div className="listCard" key={course.id}>
            <div className="actionHeader"><div><strong>{course.slug}</strong><small>{labelFromJson(course.title_json, course.slug)}</small></div><div className="rowActions"><button onClick={() => editCourse(course)}>Edit</button><button className="dangerButton" onClick={() => remove('/v1/admin/courses', course.id, 'course')}>Delete</button></div></div>
            {(course.levels ?? []).map((level: any) => <div key={level.id} className="subRow"><span>{level.slug} · {labelFromJson(level.title_json, level.slug)}</span><div className="rowActions"><button onClick={() => editLevel(level, course.id)}>Edit</button><button onClick={() => publish(course.slug, level.slug, 'te')}>Publish TE</button><button className="dangerButton" onClick={() => remove('/v1/admin/levels', level.id, 'level')}>Delete</button></div></div>)}
          </div>)}
        </div>
        <div className="panel tablePanel">
          <h2>Chapter files</h2>
          <table className="dataTable compactDataTable"><thead><tr><th>Chapter</th><th>Type</th><th>Lang</th><th>File</th><th>Actions</th></tr></thead><tbody>
            {assets.map((asset) => <tr key={asset.id}><td>{asset.chapter?.title ?? '—'}<small>{asset.chapter?.level ?? ''} · {asset.chapter?.slug ?? ''}</small></td><td>{asset.asset_type}</td><td>{asset.language_code ?? '—'}</td><td><a className="tableLink" href={asset.public_url} target="_blank" rel="noreferrer">Open</a></td><td><div className="rowActions"><button onClick={() => setAssetForm({ id: asset.id, chapterId: asset.chapter_id, languageCode: asset.language_code ?? 'te', assetType: asset.asset_type, storagePath: asset.storage_path, isActive: asset.is_active })}>Edit</button><button className="dangerButton" onClick={() => remove('/v1/admin/chapter-assets', asset.id, 'asset')}>Delete</button></div></td></tr>)}
          </tbody></table>
        </div>
      </div>
    </section>
  );
}
