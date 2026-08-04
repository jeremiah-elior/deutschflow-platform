import { siteConfig } from '../../public/siteConfig';

const needsSetup = [siteConfig.legalName, siteConfig.legalStreet, siteConfig.legalCity].some((value) => value.startsWith('REPLACE_'));

export function ImpressumPage() {
  return (
    <div className="legalPage publicContainer">
      <div className="legalHero">
        <span className="sectionEyebrow">LEGAL NOTICE</span>
        <h1>Impressum</h1>
        <p>Information about the provider responsible for DeutschFlow.</p>
      </div>
      {needsSetup ? <div className="setupWarning">Before publishing this page, replace the legal operator placeholders through the VITE_LEGAL_* environment variables described in README.md.</div> : null}
      <div className="legalDocument">
        <section className="legalSection">
          <h2>Information pursuant to § 5 DDG</h2>
          <p><strong>{siteConfig.legalName}</strong><br />{siteConfig.legalStreet}<br />{siteConfig.legalCity}<br />{siteConfig.legalCountry}</p>
        </section>
        <section className="legalSection">
          <h2>Contact</h2>
          <p>Email: <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a></p>
        </section>
        <section className="legalSection">
          <h2>Responsible for content</h2>
          <p>{siteConfig.legalName}<br />{siteConfig.legalStreet}<br />{siteConfig.legalCity}<br />{siteConfig.legalCountry}</p>
        </section>
        <section className="legalSection">
          <h2>Dispute resolution</h2>
          <p>Where legally required, additional consumer-dispute information should be added here based on the operator's business status. DeutschFlow is not obliged to participate in a dispute-resolution procedure before a consumer arbitration board unless a specific legal obligation applies.</p>
        </section>
      </div>
    </div>
  );
}
