export function SettingsPage() {
  return (
    <section className="page">
      <div className="pageHeader"><div><h1>App Config</h1><p>Feature flags, minimum app versions, and remote config will live here.</p></div></div>
      <div className="panel"><h2>Stable API contract</h2><pre>{`GET /v1/app/bootstrap\nGET /v1/courses/:course/levels/:level/manifest?lang=te\nGET /v1/lid/manifest?lang=te`}</pre></div>
    </section>
  );
}
