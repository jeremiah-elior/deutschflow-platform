import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { api, signUpload } from '../api/client';
import { FileUploadBox } from '../components/FileUploadBox';
import { AsyncButton, BusyOverlay, ConfirmBar, Drawer, EmptyState, PageNotice } from '../components/AdminUi';
import { chapterLabel, jsonText, labelFromJson, safeJsonParse } from '../utils/adminHelpers';

type Options = { languages: any[]; courses: any[]; chapters: any[]; categories: any[]; series: any[] };
type DrawerMode = 'course' | 'level' | 'chapter' | null;
const emptyOptions: Options = { languages: [], courses: [], chapters: [], categories: [], series: [] };

const defaultCourse = { id: '', slug: 'german', title: '{"en":"German Course"}', description: '{"en":"A1 to B1 lessons"}', isActive: true };
const defaultLevel = { id: '', courseId: '', slug: 'A1', title: '{"en":"A1"}', isActive: true };
const defaultChapter = { id: '', levelId: '', categoryId: '', seriesId: '', slug: 'chapter-01', number: 1, title: '{"en":"Chapter 01"}', isActive: true, isPremium: false, isFeatured: false };

export function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [assets, setAssets] = useState<any[]>([]);
  const [courseForm, setCourseForm] = useState(defaultCourse);
  const [levelForm, setLevelForm] = useState(defaultLevel);
  const [chapterForm, setChapterForm] = useState(defaultChapter);
  const [assetForm, setAssetForm] = useState({ id: '', chapterId: '', languageCode: 'te', assetType: 'audio', storagePath: '', isActive: true });
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [pendingDelete, setPendingDelete] = useState<{ path: string; id: string; label: string } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyLabel, setBusyLabel] = useState('');

  const busy = Boolean(busyLabel);
  const levels = useMemo(() => courses.flatMap((course) => (course.levels ?? []).map((level: any) => ({ ...level, courseId: course.id, courseSlug: course.slug }))), [courses]);
  const courseLevels = useMemo(() => levels.filter((level: any) => !selectedCourseId || level.courseId === selectedCourseId), [levels, selectedCourseId]);
  const selectableChapters = useMemo(() => options.chapters.filter((chapter) => (!selectedCourseId || chapter.courseId === selectedCourseId) && (!selectedLevelId || chapter.levelId === selectedLevelId)), [options.chapters, selectedCourseId, selectedLevelId]);
  const selectedChapter = useMemo(() => options.chapters.find((chapter) => chapter.id === assetForm.chapterId), [options.chapters, assetForm.chapterId]);
  const selectedLevel = useMemo(() => levels.find((level: any) => level.id === selectedChapter?.levelId || level.id === chapterForm.levelId), [levels, selectedChapter, chapterForm.levelId]);
  const selectedCourse = useMemo(() => courses.find((course) => course.id === selectedChapter?.courseId || course.id === selectedLevel?.courseId), [courses, selectedChapter, selectedLevel]);
  const currentAsset = useMemo(() => assets.find((asset) => asset.chapter_id === assetForm.chapterId && asset.language_code === assetForm.languageCode && asset.asset_type === assetForm.assetType), [assets, assetForm]);

  async function run(label: string, action: () => Promise<void>) {
    setError(''); setMessage(''); setBusyLabel(label);
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); }
    finally { setBusyLabel(''); }
  }

  async function load() {
    setLoading(true); setError('');
    try {
      const [courseRes, optionRes, assetRes] = await Promise.all([api.get('/v1/admin/courses'), api.get('/v1/admin/content-options'), api.get('/v1/admin/chapter-assets')]);
      setCourses(courseRes.data.courses ?? []);
      setOptions(optionRes.data ?? emptyOptions);
      setAssets(assetRes.data.assets ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Load failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreateCourse() { setCourseForm(defaultCourse); setDrawer('course'); }
  function openCreateLevel(courseId = '') { setLevelForm({ ...defaultLevel, courseId }); setDrawer('level'); }
  function openCreateChapter(levelId = '') { setChapterForm({ ...defaultChapter, levelId }); setDrawer('chapter'); }
  function editCourse(course: any) { setCourseForm({ id: course.id, slug: course.slug, title: jsonText(course.title_json), description: jsonText(course.description_json), isActive: Boolean(course.is_active) }); setDrawer('course'); }
  function editLevel(level: any, courseId: string) { setLevelForm({ id: level.id, courseId, slug: level.slug, title: jsonText(level.title_json), isActive: Boolean(level.is_active ?? true) }); setDrawer('level'); }
  function editChapter(chapter: any) { setChapterForm({ id: chapter.id, levelId: chapter.levelId, categoryId: chapter.category?.id ?? '', seriesId: chapter.series?.id ?? '', slug: chapter.slug, number: chapter.number, title: jsonText(chapter.titleJson), isActive: Boolean(chapter.isActive), isPremium: Boolean(chapter.isPremium), isFeatured: Boolean(chapter.isFeatured) }); setDrawer('chapter'); }

  async function saveCourse(event: FormEvent) {
    event.preventDefault();
    await run(courseForm.id ? 'Updating course…' : 'Creating course…', async () => {
      const body = { slug: courseForm.slug, title: safeJsonParse(courseForm.title), description: safeJsonParse(courseForm.description), isActive: courseForm.isActive };
      if (courseForm.id) await api.patch(`/v1/admin/courses/${courseForm.id}`, body); else await api.post('/v1/admin/courses', body);
      setMessage(courseForm.id ? 'Course updated.' : 'Course created.'); setDrawer(null); await load();
    });
  }
  async function saveLevel(event: FormEvent) {
    event.preventDefault();
    await run(levelForm.id ? 'Updating level…' : 'Creating level…', async () => {
      const body = { courseId: levelForm.courseId, slug: levelForm.slug, title: safeJsonParse(levelForm.title), isActive: levelForm.isActive };
      if (levelForm.id) await api.patch(`/v1/admin/levels/${levelForm.id}`, body); else await api.post('/v1/admin/levels', body);
      setMessage(levelForm.id ? 'Level updated.' : 'Level created.'); setDrawer(null); await load();
    });
  }
  async function saveChapter(event: FormEvent) {
    event.preventDefault();
    await run(chapterForm.id ? 'Updating chapter…' : 'Creating chapter…', async () => {
      const body: any = { levelId: chapterForm.levelId, slug: chapterForm.slug, number: chapterForm.number, title: safeJsonParse(chapterForm.title), isActive: chapterForm.isActive, isPremium: chapterForm.isPremium, isFeatured: chapterForm.isFeatured };
      body.categoryId = chapterForm.categoryId || null; body.seriesId = chapterForm.seriesId || null;
      if (chapterForm.id) await api.patch(`/v1/admin/chapters/${chapterForm.id}`, body); else await api.post('/v1/admin/chapters', body);
      setMessage(chapterForm.id ? 'Chapter updated.' : 'Chapter created.'); setDrawer(null); await load();
    });
  }
  async function confirmDelete() {
    if (!pendingDelete) return;
    const item = pendingDelete;
    await run(`Deleting ${item.label}…`, async () => { await api.delete(`${item.path}/${item.id}`); setPendingDelete(null); setMessage(`${item.label} deleted.`); await load(); });
  }
  async function saveAsset() {
    await run('Saving asset…', async () => {
      if (!assetForm.chapterId) throw new Error('Choose a chapter first.');
      if (!assetForm.storagePath) throw new Error('Upload a file first.');
      const body = { chapterId: assetForm.chapterId, languageCode: assetForm.languageCode, assetType: assetForm.assetType, storagePath: assetForm.storagePath, isActive: assetForm.isActive, version: new Date().toISOString() };
      if (assetForm.id) await api.patch(`/v1/admin/chapter-assets/${assetForm.id}`, body); else await api.post('/v1/admin/chapter-assets', body);
      setMessage('Asset saved. Publish the level manifest so the mobile app receives it.');
      setAssetForm({ id: '', chapterId: assetForm.chapterId, languageCode: assetForm.languageCode, assetType: assetForm.assetType, storagePath: '', isActive: true }); await load();
    });
  }
  async function publish(courseSlug: string, levelSlug: string, languageCode = 'te') {
    await run(`Publishing ${levelSlug} ${languageCode.toUpperCase()}…`, async () => {
      const { data } = await api.post(`/v1/admin/courses/${courseSlug}/levels/${levelSlug}/publish`, { languageCode });
      setMessage(`Published ${levelSlug} ${languageCode.toUpperCase()} manifest: ${data.url}`);
    });
  }

  async function uploadFile(file: File) {
    await run(`Uploading ${file.name}…`, async () => {
      if (!selectedChapter) throw new Error('Choose a chapter before uploading.');
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'file';
      const courseSlug = selectedChapter.course || selectedCourse?.slug || 'german';
      const levelSlug = selectedChapter.level || selectedLevel?.slug || 'level';
      const folder = `courses/${courseSlug}/${levelSlug}/${selectedChapter.slug}/${assetForm.assetType}/${assetForm.languageCode}`;
      const upload = await signUpload(new File([file], `${assetForm.assetType}.${ext}`, { type: file.type }), folder);
      setAssetForm({ ...assetForm, id: currentAsset?.id ?? '', storagePath: upload.storagePath });
      setMessage(`Uploaded ${file.name}. Click Save asset to link it to ${chapterLabel(selectedChapter)}.`);
    });
  }

  return (
    <section className="page widePage">
      <BusyOverlay show={busy} label={busyLabel} />
      <div className="pageHeader">
        <div><h1>Courses</h1><p>Production workflow: pick human names, edit in drawers, see loading/saving states, publish manifests when ready.</p></div>
        <div className="pageHeaderActions"><button className="secondaryButton" onClick={load}><RefreshCw size={16} /> Refresh</button><button className="primaryButton" onClick={openCreateCourse}><Plus size={16} /> Add course</button><button className="primaryButton" onClick={() => openCreateLevel()}><Plus size={16} /> Add level</button><button className="primaryButton" onClick={() => openCreateChapter()}><Plus size={16} /> Add chapter</button></div>
      </div>
      <PageNotice type="success">{message}</PageNotice><PageNotice type="error">{error}</PageNotice>
      {pendingDelete ? <ConfirmBar title={`Delete ${pendingDelete.label}?`} body="This cannot be undone." busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} /> : null}

      <div className="managerHero">
        <div className="panel">
          <div className="sectionTitle"><h2>Upload or replace chapter audio/file</h2><span>No IDs. Select course → level → chapter.</span></div>
          <div className="uploadStepper"><div><strong>1. Select</strong><span>Choose course, level, chapter.</span></div><div><strong>2. Upload</strong><span>Audio/video/cover/PDF file.</span></div><div><strong>3. Save</strong><span>Attach file to chapter.</span></div><div><strong>4. Publish</strong><span>Update mobile manifest.</span></div></div>
          <div className="smartUploadGrid">
            <label>Course<select value={selectedCourseId} onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedLevelId(''); setAssetForm({ ...assetForm, chapterId: '' }); }}><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.slug} · {labelFromJson(course.title_json, course.slug)}</option>)}</select></label>
            <label>Level<select value={selectedLevelId} onChange={(e) => { setSelectedLevelId(e.target.value); setAssetForm({ ...assetForm, chapterId: '' }); }}><option value="">All levels</option>{courseLevels.map((level: any) => <option key={level.id} value={level.id}>{level.courseSlug} · {level.slug}</option>)}</select></label>
            <label>Chapter<select value={assetForm.chapterId} onChange={(e) => setAssetForm({ ...assetForm, chapterId: e.target.value })}><option value="">Select chapter</option>{selectableChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapterLabel(chapter)}</option>)}</select></label>
            <label>Language<select value={assetForm.languageCode} onChange={(e) => setAssetForm({ ...assetForm, languageCode: e.target.value })}>{options.languages.filter((l) => l.is_active !== false).map((lang) => <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>)}</select></label>
            <label>Asset type<select value={assetForm.assetType} onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}><option value="audio">Audio</option><option value="video">Video</option><option value="cover">Cover image</option><option value="pdf">PDF</option><option value="transcript">Transcript</option></select></label>
          </div>
          <div className="twoCol compactTwoCol">
            <FileUploadBox label={currentAsset ? 'Replace existing file' : 'Upload file'} accept={assetForm.assetType === 'audio' ? 'audio/*' : undefined} onFile={uploadFile} />
            <div className="assetStatusCard"><strong>{selectedChapter ? chapterLabel(selectedChapter) : 'Select a chapter to continue'}</strong><span className="muted">Current: {currentAsset ? <a className="tableLink" href={currentAsset.public_url} target="_blank" rel="noreferrer">Open existing asset</a> : 'No existing file for this choice'}</span><span className="pathText">{assetForm.storagePath || 'Upload file to generate storage path'}</span><AsyncButton type="button" className="primaryButton" busy={busy} busyLabel="Saving…" onClick={saveAsset}>Save asset</AsyncButton></div>
          </div>
        </div>

        <div className="panel">
          <div className="listHeader"><h2>Courses & levels</h2><button className="secondaryButton" onClick={openCreateCourse}>Add course</button></div>
          {loading ? <p>Loading courses…</p> : null}
          {!loading && !courses.length ? <EmptyState title="No courses yet" body="Create the German course first." /> : null}
          <div className="stackList">{courses.map((course) => <div className="listCard" key={course.id}><div className="actionHeader"><div><strong>{course.slug}</strong><small>{labelFromJson(course.title_json, course.slug)}</small></div><div className="rowActions"><button onClick={() => editCourse(course)}>Edit</button><button onClick={() => openCreateLevel(course.id)}>Add level</button><button className="dangerButton" onClick={() => setPendingDelete({ path: '/v1/admin/courses', id: course.id, label: 'course' })}>Delete</button></div></div><div className="levelList">{(course.levels ?? []).map((level: any) => <div key={level.id} className="levelItem"><div className="levelMeta"><strong>{level.slug} · {labelFromJson(level.title_json, level.slug)}</strong><small>{level.is_active ? 'Active' : 'Inactive'} · Publish after changing audio/content</small></div><div className="rowActions"><button onClick={() => editLevel(level, course.id)}>Edit</button><button onClick={() => openCreateChapter(level.id)}>Add chapter</button><button onClick={() => publish(course.slug, level.slug, 'te')}>Publish TE</button><button className="dangerButton" onClick={() => setPendingDelete({ path: '/v1/admin/levels', id: level.id, label: 'level' })}>Delete</button></div></div>)}</div></div>)}</div>
        </div>
      </div>

      <div className="panel tablePanel">
        <div className="listHeader"><h2>Chapter files</h2><span className="muted">Open, replace, or delete uploaded assets.</span></div>
        <div className="assetTableWrap"><table className="dataTable compactDataTable"><thead><tr><th>Chapter</th><th>Type</th><th>Lang</th><th>Path</th><th>File</th><th>Actions</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id}><td>{asset.chapter?.title ?? '—'}<small>{asset.chapter?.level ?? ''} · {asset.chapter?.slug ?? ''}</small></td><td>{asset.asset_type}</td><td>{asset.language_code ?? '—'}</td><td><small className="pathText">{asset.storage_path}</small></td><td><a className="tableLink" href={asset.public_url} target="_blank" rel="noreferrer">Open</a></td><td><div className="rowActions"><button onClick={() => setAssetForm({ id: asset.id, chapterId: asset.chapter_id, languageCode: asset.language_code ?? 'te', assetType: asset.asset_type, storagePath: asset.storage_path, isActive: asset.is_active })}>Replace</button><button className="dangerButton" onClick={() => setPendingDelete({ path: '/v1/admin/chapter-assets', id: asset.id, label: 'asset' })}>Delete</button></div></td></tr>)}</tbody></table></div>
      </div>

      <Drawer open={drawer === 'course'} title={courseForm.id ? 'Edit course' : 'Create course'} subtitle="Save without losing your place on the page." onClose={() => setDrawer(null)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(null)}>Cancel</button><AsyncButton form="courseForm" className="primaryButton" busy={busy} busyLabel="Saving…">{courseForm.id ? 'Update course' : 'Create course'}</AsyncButton></>}><form id="courseForm" className="formStack" onSubmit={saveCourse}><label>Slug<input value={courseForm.slug} onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })} /></label><label>Title JSON<textarea value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} /></label><label>Description JSON<textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></label><label className="inlineCheck"><input type="checkbox" checked={courseForm.isActive} onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })} /> Active</label></form></Drawer>
      <Drawer open={drawer === 'level'} title={levelForm.id ? 'Edit level' : 'Create level'} subtitle="Choose course once. No scrolling back to update." onClose={() => setDrawer(null)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(null)}>Cancel</button><AsyncButton form="levelForm" className="primaryButton" busy={busy} busyLabel="Saving…">{levelForm.id ? 'Update level' : 'Create level'}</AsyncButton></>}><form id="levelForm" className="formStack" onSubmit={saveLevel}><label>Course<select value={levelForm.courseId} onChange={(e) => setLevelForm({ ...levelForm, courseId: e.target.value })}><option value="">Select course</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.slug} · {labelFromJson(c.title_json, c.slug)}</option>)}</select></label><label>Slug<input value={levelForm.slug} onChange={(e) => setLevelForm({ ...levelForm, slug: e.target.value })} /></label><label>Title JSON<textarea value={levelForm.title} onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })} /></label><label className="inlineCheck"><input type="checkbox" checked={levelForm.isActive} onChange={(e) => setLevelForm({ ...levelForm, isActive: e.target.checked })} /> Active</label></form></Drawer>
      <Drawer open={drawer === 'chapter'} title={chapterForm.id ? 'Edit chapter' : 'Create chapter'} subtitle="Level, category, and series are dropdowns." onClose={() => setDrawer(null)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(null)}>Cancel</button><AsyncButton form="chapterForm" className="primaryButton" busy={busy} busyLabel="Saving…">{chapterForm.id ? 'Update chapter' : 'Create chapter'}</AsyncButton></>}><form id="chapterForm" className="formStack" onSubmit={saveChapter}><div className="formGrid2"><label>Level<select value={chapterForm.levelId} onChange={(e) => setChapterForm({ ...chapterForm, levelId: e.target.value })}><option value="">Select level</option>{levels.map((l: any) => <option key={l.id} value={l.id}>{l.courseSlug} · {l.slug}</option>)}</select></label><label>Number<input type="number" value={chapterForm.number} onChange={(e) => setChapterForm({ ...chapterForm, number: Number(e.target.value) })} /></label></div><label>Slug<input value={chapterForm.slug} onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })} /></label><div className="formGrid2"><label>Category<select value={chapterForm.categoryId} onChange={(e) => setChapterForm({ ...chapterForm, categoryId: e.target.value })}><option value="">None</option>{options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Series<select value={chapterForm.seriesId} onChange={(e) => setChapterForm({ ...chapterForm, seriesId: e.target.value })}><option value="">None</option>{options.series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label></div><label>Title JSON<textarea value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })} /></label><div className="buttonRow"><label className="inlineCheck"><input type="checkbox" checked={chapterForm.isPremium} onChange={(e) => setChapterForm({ ...chapterForm, isPremium: e.target.checked })} /> Premium</label><label className="inlineCheck"><input type="checkbox" checked={chapterForm.isFeatured} onChange={(e) => setChapterForm({ ...chapterForm, isFeatured: e.target.checked })} /> Featured</label><label className="inlineCheck"><input type="checkbox" checked={chapterForm.isActive} onChange={(e) => setChapterForm({ ...chapterForm, isActive: e.target.checked })} /> Active</label></div></form></Drawer>
    </section>
  );
}
