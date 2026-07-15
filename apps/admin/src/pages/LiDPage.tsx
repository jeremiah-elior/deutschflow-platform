import { useEffect, useState } from 'react';
import { api, signUpload } from '../api/client';
import { FileUploadBox } from '../components/FileUploadBox';

export function LiDPage() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [jsonPath, setJsonPath] = useState('');
  const [asset, setAsset] = useState({ assetType: 'image', languageCode: 'te', key: '', storagePath: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const run = async (action: () => Promise<void>) => {
    setError('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed'); }
  };

  async function load() {
    const { data } = await api.get('/v1/admin/lid/catalogs');
    setCatalogs(data.catalogs ?? []);
  }
  useEffect(() => { load(); }, []);

  async function importJson() {
    await run(async () => {
      const { data } = await api.post('/v1/admin/lid/import-json', {
        storagePath: jsonPath,
        title: 'BAMF 2025 Study Material'
      });
      setMessage(`Imported ${data.importedCards} LiD cards.`);
      await load();
    });
  }

  async function saveAsset() {
    await run(async () => {
      await api.post('/v1/admin/lid/assets', asset);
      setMessage(`Saved LiD asset ${asset.key}.`);
    });
  }

  async function publish(lang: string) {
    await run(async () => {
      const { data } = await api.post('/v1/admin/lid/publish', { languageCode: lang });
      setMessage(`Published LiD manifest: ${data.manifestUrl}`);
    });
  }

  return (
    <section className="page">
      <div className="pageHeader">
        <div>
          <h1>LiD Test</h1>
          <p>Manage Leben in Deutschland catalog, images, audio, video, and manifests.</p>
        </div>
      </div>
      {message ? <div className="successBox">{message}</div> : null}
      {error ? <div className="errorBox">{error}</div> : null}
      <div className="twoCol">
        <div className="panel formStack">
          <h2>1. Upload and import study JSON</h2>
          <FileUploadBox label="Upload bamf_2025_study_material_en_te.json" accept="application/json,.json" onFile={async (file) => {
            const upload = await signUpload(file, 'lid/json');
            setJsonPath(upload.storagePath);
          }} />
          <label>Storage path<input value={jsonPath} onChange={(e) => setJsonPath(e.target.value)} /></label>
          <button className="primaryButton" onClick={importJson} disabled={!jsonPath}>Import 460 cards</button>
          <p className="hint">This stores cards in Postgres and keeps catalog_id as the stable app key.</p>
        </div>
        <div className="panel formStack">
          <h2>2. Upload LiD assets</h2>
          <label>Asset type<select value={asset.assetType} onChange={(e)=>setAsset({...asset, assetType:e.target.value})}>
            <option value="image">Question image</option>
            <option value="intro_video">Intro video</option>
            <option value="tips_audio">Tips audio</option>
            <option value="sample_json">Sample paper JSON</option>
            <option value="exam_info">Exam info JSON</option>
            <option value="ui_asset">UI design asset</option>
            <option value="audio_track">Audio journey track</option>
          </select></label>
          <label>Language code<input value={asset.languageCode} onChange={(e)=>setAsset({...asset, languageCode:e.target.value})}/></label>
          <label>Key<input placeholder="general_21 or lid_tips_te" value={asset.key} onChange={(e)=>setAsset({...asset, key:e.target.value})}/></label>
          <FileUploadBox label="Upload asset" onFile={async (file) => {
            const folder = asset.assetType === 'image' ? 'lid/images' : asset.assetType.includes('audio') ? 'lid/audio' : asset.assetType.includes('video') ? 'lid/video' : 'lid/json';
            const upload = await signUpload(file, folder);
            setAsset({...asset, storagePath: upload.storagePath});
          }} />
          <label>Storage path<input value={asset.storagePath} onChange={(e)=>setAsset({...asset, storagePath:e.target.value})}/></label>
          <button className="primaryButton" onClick={saveAsset}>Save asset metadata</button>
        </div>
      </div>
      <div className="twoCol">
        <div className="panel">
          <h2>3. Publish manifests</h2>
          <div className="buttonRow">
            <button onClick={()=>publish('te')}>Publish Telugu</button>
            <button onClick={()=>publish('en')}>Publish English</button>
            <button onClick={()=>publish('ta')}>Publish Tamil</button>
            <button onClick={()=>publish('kn')}>Publish Kannada</button>
          </div>
          <p className="hint">Publishing generates compressed card packs and a stable manifest for Android/iOS.</p>
        </div>
        <div className="panel">
          <h2>Catalogs</h2>
          {catalogs.map((catalog) => <div className="listCard" key={catalog.id}>
            <strong>{catalog.title}</strong>
            <div>{catalog.total_cards} cards · {catalog.general_cards} general · {catalog.state_cards} state</div>
            <small>{catalog.version} {catalog.is_active ? '· active' : ''}</small>
          </div>)}
        </div>
      </div>
    </section>
  );
}
