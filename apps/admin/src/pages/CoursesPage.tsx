import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Eye, Plus, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import { api, signUpload } from '../api/client';
import { FileUploadBox } from '../components/FileUploadBox';
import { AsyncButton, BusyOverlay, ConfirmBar, Drawer, EmptyState, PageNotice } from '../components/AdminUi';
import { chapterLabel, jsonText, labelFromJson, safeJsonParse } from '../utils/adminHelpers';

type Options = { languages: any[]; courses: any[]; chapters: any[]; categories: any[]; series: any[] };
type DrawerMode = 'course' | 'level' | 'chapter' | null;
type AssetPanelMode = 'add' | 'view' | 'replace';
type Tab = 'levels' | 'files';

const emptyOptions: Options = { languages: [], courses: [], chapters: [], categories: [], series: [] };
const defaultCourse = { id: '', slug: 'german', title: '{"en":"German Course"}', description: '{"en":"A1 to B1 lessons"}', isActive: true };
const defaultLevel = { id: '', courseId: '', slug: 'A1', title: '{"en":"A1"}', isActive: true };
const defaultChapter = { id: '', levelId: '', categoryId: '', seriesId: '', slug: 'chapter-01', number: 1, title: '{"en":"Chapter 01"}', isActive: true, isPremium: false, isFeatured: false };
const defaultAsset = { id: '', chapterId: '', languageCode: 'te', assetType: 'audio', storagePath: '', isActive: true };
const pageSize = 8;

function assetChapterText(asset: any) {
  const title = asset.chapter?.title ?? 'Unknown chapter';
  const level = asset.chapter?.level ?? '';
  const slug = asset.chapter?.slug ?? '';
  return `${title} ${level} ${slug}`.toLowerCase();
}

function timestamp(value: string | null | undefined) {
  if (!value) return '—';
  try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); } catch { return value; }
}

export function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [options, setOptions] = useState<Options>(emptyOptions);
  const [assets, setAssets] = useState<any[]>([]);
  const [courseForm, setCourseForm] = useState(defaultCourse);
  const [levelForm, setLevelForm] = useState(defaultLevel);
  const [chapterForm, setChapterForm] = useState(defaultChapter);
  const [assetForm, setAssetForm] = useState(defaultAsset);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [assetPanelMode, setAssetPanelMode] = useState<AssetPanelMode>('add');
  const [activeTab, setActiveTab] = useState<Tab>('files');
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [pendingDelete, setPendingDelete] = useState<{ path: string; id: string; label: string } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyLabel, setBusyLabel] = useState('');
  const [search, setSearch] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterLevelId, setFilterLevelId] = useState('');
  const [filterChapterId, setFilterChapterId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);

  const busy = Boolean(busyLabel);
  const levels = useMemo(() => courses.flatMap((course) => (course.levels ?? []).map((level: any) => ({ ...level, courseId: course.id, courseSlug: course.slug }))), [courses]);
  const levelsForAssetSelection = useMemo(() => levels.filter((level: any) => !selectedCourseId || level.courseId === selectedCourseId), [levels, selectedCourseId]);
  const levelsForFilters = useMemo(() => levels.filter((level: any) => !filterCourseId || level.courseId === filterCourseId), [levels, filterCourseId]);
  const selectableChapters = useMemo(() => options.chapters.filter((chapter) => (!selectedCourseId || chapter.courseId === selectedCourseId) && (!selectedLevelId || chapter.levelId === selectedLevelId)), [options.chapters, selectedCourseId, selectedLevelId]);
  const filterChapters = useMemo(() => options.chapters.filter((chapter) => (!filterCourseId || chapter.courseId === filterCourseId) && (!filterLevelId || chapter.levelId === filterLevelId)), [options.chapters, filterCourseId, filterLevelId]);
  const selectedChapter = useMemo(() => options.chapters.find((chapter) => chapter.id === assetForm.chapterId), [options.chapters, assetForm.chapterId]);
  const selectedLevel = useMemo(() => levels.find((level: any) => level.id === selectedChapter?.levelId || level.id === chapterForm.levelId), [levels, selectedChapter, chapterForm.levelId]);
  const selectedCourse = useMemo(() => courses.find((course) => course.id === selectedChapter?.courseId || course.id === selectedLevel?.courseId), [courses, selectedChapter, selectedLevel]);
  const currentAsset = useMemo(() => assets.find((asset) => asset.chapter_id === assetForm.chapterId && asset.language_code === assetForm.languageCode && asset.asset_type === assetForm.assetType), [assets, assetForm]);
  const viewingAsset = useMemo(() => assets.find((asset) => asset.id === assetForm.id), [assets, assetForm.id]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const chapter = options.chapters.find((item) => item.id === asset.chapter_id);
      const matchesSearch = !query || assetChapterText(asset).includes(query) || String(asset.storage_path ?? '').toLowerCase().includes(query) || String(asset.asset_type ?? '').toLowerCase().includes(query) || String(asset.language_code ?? '').toLowerCase().includes(query);
      const matchesCourse = !filterCourseId || chapter?.courseId === filterCourseId;
      const matchesLevel = !filterLevelId || chapter?.levelId === filterLevelId;
      const matchesChapter = !filterChapterId || asset.chapter_id === filterChapterId;
      const matchesType = !filterType || asset.asset_type === filterType;
      return matchesSearch && matchesCourse && matchesLevel && matchesChapter && matchesType;
    });
  }, [assets, options.chapters, search, filterCourseId, filterLevelId, filterChapterId, filterType]);

  const pageCount = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const pagedAssets = filteredAssets.slice((page - 1) * pageSize, page * pageSize);
  const showingFrom = filteredAssets.length ? (page - 1) * pageSize + 1 : 0;
  const showingTo = Math.min(page * pageSize, filteredAssets.length);

  async function run(label: string, action: () => Promise<void>) {
    setError('');
    setMessage('');
    setBusyLabel(label);
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); }
    finally { setBusyLabel(''); }
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [courseRes, optionRes, assetRes] = await Promise.all([
        api.get('/v1/admin/courses'),
        api.get('/v1/admin/content-options'),
        api.get('/v1/admin/chapter-assets')
      ]);
      setCourses(courseRes.data.courses ?? []);
      setOptions(optionRes.data ?? emptyOptions);
      setAssets(assetRes.data.assets ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Load failed'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  function applyChapterSelection(chapterId: string) {
    const chapter = options.chapters.find((item) => item.id === chapterId);
    setSelectedCourseId(chapter?.courseId ?? '');
    setSelectedLevelId(chapter?.levelId ?? '');
  }

  function openAssetAdd() {
    setActiveTab('files');
    setAssetPanelMode('add');
    setAssetForm(defaultAsset);
    setSelectedCourseId('');
    setSelectedLevelId('');
  }

  function openAssetView(asset: any) {
    setActiveTab('files');
    setAssetPanelMode('view');
    setAssetForm({ id: asset.id, chapterId: asset.chapter_id, languageCode: asset.language_code ?? 'te', assetType: asset.asset_type, storagePath: asset.storage_path, isActive: asset.is_active ?? true });
    applyChapterSelection(asset.chapter_id);
  }

  function openAssetReplace(asset: any) {
    setActiveTab('files');
    setAssetPanelMode('replace');
    setAssetForm({ id: asset.id, chapterId: asset.chapter_id, languageCode: asset.language_code ?? 'te', assetType: asset.asset_type, storagePath: '', isActive: asset.is_active ?? true });
    applyChapterSelection(asset.chapter_id);
  }

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
      setMessage(courseForm.id ? 'Course updated.' : 'Course created.');
      setDrawer(null);
      await load();
    });
  }

  async function saveLevel(event: FormEvent) {
    event.preventDefault();
    await run(levelForm.id ? 'Updating level…' : 'Creating level…', async () => {
      const body = { courseId: levelForm.courseId, slug: levelForm.slug, title: safeJsonParse(levelForm.title), isActive: levelForm.isActive };
      if (levelForm.id) await api.patch(`/v1/admin/levels/${levelForm.id}`, body); else await api.post('/v1/admin/levels', body);
      setMessage(levelForm.id ? 'Level updated.' : 'Level created.');
      setDrawer(null);
      await load();
    });
  }

  async function saveChapter(event: FormEvent) {
    event.preventDefault();
    await run(chapterForm.id ? 'Updating chapter…' : 'Creating chapter…', async () => {
      const body: any = { levelId: chapterForm.levelId, slug: chapterForm.slug, number: chapterForm.number, title: safeJsonParse(chapterForm.title), isActive: chapterForm.isActive, isPremium: chapterForm.isPremium, isFeatured: chapterForm.isFeatured };
      body.categoryId = chapterForm.categoryId || null;
      body.seriesId = chapterForm.seriesId || null;
      if (chapterForm.id) await api.patch(`/v1/admin/chapters/${chapterForm.id}`, body); else await api.post('/v1/admin/chapters', body);
      setMessage(chapterForm.id ? 'Chapter updated.' : 'Chapter created.');
      setDrawer(null);
      await load();
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const item = pendingDelete;
    await run(`Deleting ${item.label}…`, async () => {
      await api.delete(`${item.path}/${item.id}`);
      setPendingDelete(null);
      setMessage(`${item.label} deleted.`);
      if (item.label === 'asset') openAssetAdd();
      await load();
    });
  }

  async function saveAsset() {
    await run(assetForm.id ? 'Updating chapter file…' : 'Saving chapter file…', async () => {
      if (!assetForm.chapterId) throw new Error('Choose a chapter first.');
      if (!assetForm.storagePath) throw new Error('Upload a file first.');
      const body = { chapterId: assetForm.chapterId, languageCode: assetForm.languageCode, assetType: assetForm.assetType, storagePath: assetForm.storagePath, isActive: assetForm.isActive, version: new Date().toISOString() };
      const { data } = assetForm.id ? await api.patch(`/v1/admin/chapter-assets/${assetForm.id}`, body) : await api.post('/v1/admin/chapter-assets', body);
      const saved = data.asset;
      setMessage('Chapter file saved. Publish the level manifest so the mobile app receives it.');
      setAssetForm({ id: saved?.id ?? assetForm.id, chapterId: assetForm.chapterId, languageCode: assetForm.languageCode, assetType: assetForm.assetType, storagePath: saved?.storage_path ?? assetForm.storagePath, isActive: saved?.is_active ?? assetForm.isActive });
      setAssetPanelMode('view');
      await load();
    });
  }

  async function publish(courseSlug: string, levelSlug: string, languageCode = 'te') {
    await run(`Publishing ${levelSlug} ${languageCode.toUpperCase()}…`, async () => {
      const { data } = await api.post(`/v1/admin/courses/${courseSlug}/levels/${levelSlug}/publish`, { languageCode });
      setMessage(`Published ${levelSlug} ${languageCode.toUpperCase()} manifest: ${data.url}`);
    });
  }

  async function publishSelectedAssetManifest() {
    if (!selectedChapter?.course || !selectedChapter?.level) {
      setError('Choose a chapter first, then publish the manifest.');
      return;
    }
    await publish(selectedChapter.course, selectedChapter.level, assetForm.languageCode);
  }

  async function uploadFile(file: File) {
    await run(`Uploading ${file.name}…`, async () => {
      if (!selectedChapter) throw new Error('Choose a chapter before uploading.');
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'file';
      const courseSlug = selectedChapter.course || selectedCourse?.slug || 'german';
      const levelSlug = selectedChapter.level || selectedLevel?.slug || 'level';
      const folder = `courses/${courseSlug}/${levelSlug}/${selectedChapter.slug}/${assetForm.assetType}/${assetForm.languageCode}`;
      const upload = await signUpload(new File([file], `${assetForm.assetType}.${ext}`, { type: file.type }), folder);
      setAssetForm({ ...assetForm, id: assetForm.id || currentAsset?.id || '', storagePath: upload.storagePath });
      setAssetPanelMode(assetForm.id || currentAsset?.id ? 'replace' : 'add');
      setMessage(`Uploaded ${file.name}. Click Save asset to link it to ${chapterLabel(selectedChapter)}.`);
    });
  }

  const panelTitle = assetPanelMode === 'view' ? 'View Chapter File' : assetPanelMode === 'replace' ? 'Replace Chapter File' : 'Add Chapter File';
  const canEditAssetFields = assetPanelMode !== 'view';

  return (
    <section className="page widePage coursesProductionPage">
      <BusyOverlay show={busy} label={busyLabel} />
      <div className="pageHeader stickyPageHeader">
        <div>
          <h1>Courses</h1>
          <p>Production workflow: manage courses, chapter files, audio, and manifests without hidden IDs.</p>
        </div>
        <div className="pageHeaderActions">
          <button className="secondaryButton" onClick={load}><RefreshCw size={16} /> Refresh</button>
          <button className="primaryButton" onClick={openCreateCourse}><Plus size={16} /> Add course</button>
          <button className="primaryButton" onClick={() => openCreateLevel()}><Plus size={16} /> Add level</button>
          <button className="primaryButton" onClick={() => openCreateChapter()}><Plus size={16} /> Add chapter</button>
        </div>
      </div>

      <PageNotice type="success">{message}</PageNotice>
      <PageNotice type="error">{error}</PageNotice>
      {pendingDelete ? <ConfirmBar title={`Delete ${pendingDelete.label}?`} body="This cannot be undone." busy={busy} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} /> : null}

      <div className="courseTabs panelFlush">
        <button className={activeTab === 'levels' ? 'active' : ''} onClick={() => setActiveTab('levels')}>Courses & levels</button>
        <button className={activeTab === 'files' ? 'active' : ''} onClick={() => setActiveTab('files')}>Chapter files</button>
      </div>

      {activeTab === 'files' ? (
        <div className="assetWorkspace">
          <div className="assetMainPanel panel">
            <div className="assetTopBar">
              <div>
                <h2>Chapter files</h2>
                <span className="muted">View, replace, delete, and publish files while keeping the list visible.</span>
              </div>
              <button className="primaryButton" onClick={openAssetAdd}><Plus size={16} /> Add New</button>
            </div>

            <div className="assetFilters">
              <label className="searchControl"><Search size={18} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search chapter files..." /></label>
              <select value={filterCourseId} onChange={(e) => { setFilterCourseId(e.target.value); setFilterLevelId(''); setFilterChapterId(''); setPage(1); }}><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.slug} · {labelFromJson(course.title_json, course.slug)}</option>)}</select>
              <select value={filterLevelId} onChange={(e) => { setFilterLevelId(e.target.value); setFilterChapterId(''); setPage(1); }}><option value="">All levels</option>{levelsForFilters.map((level: any) => <option key={level.id} value={level.id}>{level.courseSlug} · {level.slug}</option>)}</select>
              <select value={filterChapterId} onChange={(e) => { setFilterChapterId(e.target.value); setPage(1); }}><option value="">All chapters</option>{filterChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapterLabel(chapter)}</option>)}</select>
              <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}><option value="">All types</option><option value="audio">Audio</option><option value="video">Video</option><option value="cover">Cover</option><option value="pdf">PDF</option><option value="transcript">Transcript</option></select>
              <button className="secondaryButton" type="button" onClick={() => { setSearch(''); setFilterCourseId(''); setFilterLevelId(''); setFilterChapterId(''); setFilterType(''); setPage(1); }}><SlidersHorizontal size={16} /> Clear</button>
            </div>

            {loading ? <div className="tableLoading">Loading chapter files…</div> : null}
            {!loading && !filteredAssets.length ? <EmptyState title="No files found" body="Upload the first chapter audio/file from the side panel." /> : null}

            {filteredAssets.length ? (
              <div className="assetTableWrap productionTableWrap">
                <table className="dataTable compactDataTable">
                  <thead><tr><th>Chapter</th><th>Type</th><th>Language</th><th>Path / file</th><th>Updated</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pagedAssets.map((asset) => (
                      <tr key={asset.id} className={asset.id === assetForm.id ? 'selectedRow' : ''}>
                        <td><strong>{asset.chapter?.title ?? '—'}</strong><small>{asset.chapter?.level ?? ''} · {asset.chapter?.slug ?? ''}</small></td>
                        <td><span className="statusBadge good">{asset.asset_type}</span></td>
                        <td>{asset.language_code ?? '—'}</td>
                        <td><small className="pathText">{asset.storage_path}</small></td>
                        <td>{timestamp(asset.created_at)}</td>
                        <td>
                          <div className="rowActions noWrapActions">
                            <button onClick={() => openAssetView(asset)}><Eye size={14} /> View</button>
                            <button onClick={() => openAssetReplace(asset)}>Replace</button>
                            <button className="dangerButton" onClick={() => setPendingDelete({ path: '/v1/admin/chapter-assets', id: asset.id, label: 'asset' })}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="paginationBar">
              <span>Showing {showingFrom}–{showingTo} of {filteredAssets.length} files</span>
              <div className="paginationButtons">
                <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>
                <button className="active">{page}</button>
                <span>of {pageCount}</span>
                <button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>›</button>
              </div>
            </div>
          </div>

          <aside className="sideInspector">
            <div className="inspectorHeader">
              <div>
                <h2>{panelTitle}</h2>
                <p>{assetPanelMode === 'view' ? 'Review the selected file without leaving the list.' : 'Upload or replace chapter audio/file.'}</p>
              </div>
              <button className="iconButton" onClick={openAssetAdd} title="Reset side panel"><X size={18} /></button>
            </div>

            <div className="miniStepper">
              <div className={assetForm.chapterId ? 'done' : 'active'}><strong>1. Select</strong><span>Course, level, chapter</span></div>
              <div className={assetForm.storagePath ? 'done' : ''}><strong>2. Upload</strong><span>File</span></div>
              <div><strong>3. Save</strong><span>Attach to chapter</span></div>
              <div><strong>4. Publish</strong><span>Update app</span></div>
            </div>

            <div className="inspectorBody">
              <div className="formGrid3">
                <label>Course<select disabled={!canEditAssetFields} value={selectedCourseId} onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedLevelId(''); setAssetForm({ ...assetForm, chapterId: '' }); }}><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.slug}</option>)}</select></label>
                <label>Level<select disabled={!canEditAssetFields} value={selectedLevelId} onChange={(e) => { setSelectedLevelId(e.target.value); setAssetForm({ ...assetForm, chapterId: '' }); }}><option value="">All levels</option>{levelsForAssetSelection.map((level: any) => <option key={level.id} value={level.id}>{level.slug}</option>)}</select></label>
                <label>Chapter<select disabled={!canEditAssetFields} value={assetForm.chapterId} onChange={(e) => setAssetForm({ ...assetForm, chapterId: e.target.value })}><option value="">Select chapter</option>{selectableChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapterLabel(chapter)}</option>)}</select></label>
              </div>

              <div className="formGrid2">
                <label>Language<select disabled={!canEditAssetFields} value={assetForm.languageCode} onChange={(e) => setAssetForm({ ...assetForm, languageCode: e.target.value })}>{options.languages.filter((l) => l.is_active !== false).map((lang) => <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>)}</select></label>
                <label>Asset type<select disabled={!canEditAssetFields} value={assetForm.assetType} onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}><option value="audio">Audio</option><option value="video">Video</option><option value="cover">Cover image</option><option value="pdf">PDF</option><option value="transcript">Transcript</option></select></label>
              </div>

              {assetPanelMode === 'view' ? (
                <div className="detailCard">
                  <strong>{selectedChapter ? chapterLabel(selectedChapter) : viewingAsset?.chapter?.title ?? 'Selected file'}</strong>
                  <span>Type: {assetForm.assetType}</span>
                  <span>Language: {assetForm.languageCode || '—'}</span>
                  <span>Status: {assetForm.isActive ? 'Active' : 'Inactive'}</span>
                  <span className="pathText">{assetForm.storagePath}</span>
                  {viewingAsset?.public_url ? <a className="primaryButton asLink" href={viewingAsset.public_url} target="_blank" rel="noreferrer">Open file</a> : null}
                  <div className="buttonRow">
                    <button type="button" onClick={() => viewingAsset && openAssetReplace(viewingAsset)}>Replace file</button>
                    <button type="button" onClick={publishSelectedAssetManifest}>Publish manifest</button>
                  </div>
                </div>
              ) : (
                <>
                  <FileUploadBox label={currentAsset || assetForm.id ? 'Replace existing file' : 'Upload file'} accept={assetForm.assetType === 'audio' ? 'audio/*' : undefined} onFile={uploadFile} />
                  <div className="assetStatusCard inspectorStatus">
                    <strong>{selectedChapter ? chapterLabel(selectedChapter) : 'Select a chapter to continue'}</strong>
                    <span className="muted">Current: {currentAsset ? <a className="tableLink" href={currentAsset.public_url} target="_blank" rel="noreferrer">Open existing asset</a> : 'No existing file for this choice'}</span>
                    <span className="pathText">{assetForm.storagePath || 'Upload file to generate storage path'}</span>
                    <label className="inlineCheck"><input type="checkbox" checked={assetForm.isActive} onChange={(e) => setAssetForm({ ...assetForm, isActive: e.target.checked })} /> Active in app</label>
                  </div>
                  <div className="inspectorActions">
                    <AsyncButton type="button" className="primaryButton" busy={busy} busyLabel="Saving…" onClick={saveAsset}>Save asset</AsyncButton>
                    <AsyncButton type="button" className="secondaryButton" busy={busy} busyLabel="Publishing…" onClick={publishSelectedAssetManifest}>Save done, publish manifest</AsyncButton>
                  </div>
                </>
              )}

              <div className="infoBox inspectorHelp">After saving, publish the level manifest. The mobile app will fetch the new audio/file from the manifest.</div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="panel">
          <div className="listHeader"><h2>Courses & levels</h2><button className="secondaryButton" onClick={openCreateCourse}>Add course</button></div>
          {loading ? <p>Loading courses…</p> : null}
          {!loading && !courses.length ? <EmptyState title="No courses yet" body="Create the German course first." /> : null}
          <div className="stackList">
            {courses.map((course) => (
              <div className="listCard" key={course.id}>
                <div className="actionHeader">
                  <div><strong>{course.slug}</strong><small>{labelFromJson(course.title_json, course.slug)}</small></div>
                  <div className="rowActions"><button onClick={() => editCourse(course)}>Edit</button><button onClick={() => openCreateLevel(course.id)}>Add level</button><button className="dangerButton" onClick={() => setPendingDelete({ path: '/v1/admin/courses', id: course.id, label: 'course' })}>Delete</button></div>
                </div>
                <div className="levelList">
                  {(course.levels ?? []).map((level: any) => (
                    <div key={level.id} className="levelItem">
                      <div className="levelMeta"><strong>{level.slug} · {labelFromJson(level.title_json, level.slug)}</strong><small>{level.is_active ? 'Active' : 'Inactive'} · Publish after changing audio/content</small></div>
                      <div className="rowActions"><button onClick={() => editLevel(level, course.id)}>Edit</button><button onClick={() => openCreateChapter(level.id)}>Add chapter</button><button onClick={() => publish(course.slug, level.slug, 'te')}>Publish TE</button><button className="dangerButton" onClick={() => setPendingDelete({ path: '/v1/admin/levels', id: level.id, label: 'level' })}>Delete</button></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Drawer open={drawer === 'course'} title={courseForm.id ? 'Edit course' : 'Create course'} subtitle="Save without losing your place on the page." onClose={() => setDrawer(null)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(null)}>Cancel</button><AsyncButton form="courseForm" className="primaryButton" busy={busy} busyLabel="Saving…">{courseForm.id ? 'Update course' : 'Create course'}</AsyncButton></>}>
        <form id="courseForm" className="formStack" onSubmit={saveCourse}><label>Slug<input value={courseForm.slug} onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })} /></label><label>Title JSON<textarea value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} /></label><label>Description JSON<textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></label><label className="inlineCheck"><input type="checkbox" checked={courseForm.isActive} onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })} /> Active</label></form>
      </Drawer>

      <Drawer open={drawer === 'level'} title={levelForm.id ? 'Edit level' : 'Create level'} subtitle="Choose course once. No scrolling back to update." onClose={() => setDrawer(null)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(null)}>Cancel</button><AsyncButton form="levelForm" className="primaryButton" busy={busy} busyLabel="Saving…">{levelForm.id ? 'Update level' : 'Create level'}</AsyncButton></>}>
        <form id="levelForm" className="formStack" onSubmit={saveLevel}><label>Course<select value={levelForm.courseId} onChange={(e) => setLevelForm({ ...levelForm, courseId: e.target.value })}><option value="">Select course</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.slug} · {labelFromJson(c.title_json, c.slug)}</option>)}</select></label><label>Slug<input value={levelForm.slug} onChange={(e) => setLevelForm({ ...levelForm, slug: e.target.value })} /></label><label>Title JSON<textarea value={levelForm.title} onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })} /></label><label className="inlineCheck"><input type="checkbox" checked={levelForm.isActive} onChange={(e) => setLevelForm({ ...levelForm, isActive: e.target.checked })} /> Active</label></form>
      </Drawer>

      <Drawer open={drawer === 'chapter'} title={chapterForm.id ? 'Edit chapter' : 'Create chapter'} subtitle="Level, category, and series are dropdowns." onClose={() => setDrawer(null)} footer={<><button type="button" className="secondaryButton" onClick={() => setDrawer(null)}>Cancel</button><AsyncButton form="chapterForm" className="primaryButton" busy={busy} busyLabel="Saving…">{chapterForm.id ? 'Update chapter' : 'Create chapter'}</AsyncButton></>}>
        <form id="chapterForm" className="formStack" onSubmit={saveChapter}><div className="formGrid2"><label>Level<select value={chapterForm.levelId} onChange={(e) => setChapterForm({ ...chapterForm, levelId: e.target.value })}><option value="">Select level</option>{levels.map((l: any) => <option key={l.id} value={l.id}>{l.courseSlug} · {l.slug}</option>)}</select></label><label>Number<input type="number" value={chapterForm.number} onChange={(e) => setChapterForm({ ...chapterForm, number: Number(e.target.value) })} /></label></div><label>Slug<input value={chapterForm.slug} onChange={(e) => setChapterForm({ ...chapterForm, slug: e.target.value })} /></label><div className="formGrid2"><label>Category<select value={chapterForm.categoryId} onChange={(e) => setChapterForm({ ...chapterForm, categoryId: e.target.value })}><option value="">None</option>{options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Series<select value={chapterForm.seriesId} onChange={(e) => setChapterForm({ ...chapterForm, seriesId: e.target.value })}><option value="">None</option>{options.series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label></div><label>Title JSON<textarea value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })} /></label><div className="buttonRow"><label className="inlineCheck"><input type="checkbox" checked={chapterForm.isPremium} onChange={(e) => setChapterForm({ ...chapterForm, isPremium: e.target.checked })} /> Premium</label><label className="inlineCheck"><input type="checkbox" checked={chapterForm.isFeatured} onChange={(e) => setChapterForm({ ...chapterForm, isFeatured: e.target.checked })} /> Featured</label><label className="inlineCheck"><input type="checkbox" checked={chapterForm.isActive} onChange={(e) => setChapterForm({ ...chapterForm, isActive: e.target.checked })} /> Active</label></div></form>
      </Drawer>
    </section>
  );
}
