import { Link } from 'react-router-dom';
import { siteConfig } from '../../public/siteConfig';

export function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Privacy Policy" intro="This policy explains how DeutschFlow handles personal data when you use the DeutschFlow mobile app, website and related services.">
      <LegalSection title="1. Controller and contact">
        <p>The controller responsible for this service is <strong>{siteConfig.legalName}</strong>, {siteConfig.legalStreet}, {siteConfig.legalCity}, {siteConfig.legalCountry}.</p>
        <p>For privacy questions, contact <a href={`mailto:${siteConfig.privacyEmail}`}>{siteConfig.privacyEmail}</a>.</p>
      </LegalSection>

      <LegalSection title="2. Data we process">
        <p>Depending on how you use DeutschFlow, we may process the following categories of data:</p>
        <ul>
          <li><strong>Account data:</strong> email address, display name, authentication identifier and sign-in provider.</li>
          <li><strong>Authentication data:</strong> information required to sign you in using email/password, Google Sign-In or Sign in with Apple. Passwords are handled by the authentication provider and are not readable by DeutschFlow.</li>
          <li><strong>Learning data stored on your device:</strong> selected explanation language, learning preferences, LiD practice history, exam scores, mistakes and similar progress information.</li>
          <li><strong>Technical data:</strong> basic server request information needed to deliver content, protect the service and diagnose errors.</li>
          <li><strong>Support data:</strong> information you choose to send when contacting support.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Why we process data">
        <ul>
          <li>To create and authenticate your account.</li>
          <li>To provide lessons, audio, vocabulary, quizzes and LiD learning content.</li>
          <li>To remember app preferences and learning progress where those features are enabled.</li>
          <li>To secure, maintain and troubleshoot the service.</li>
          <li>To answer support and privacy requests.</li>
        </ul>
        <p>Where the GDPR applies, processing is based on performance of the service you request, our legitimate interests in operating and securing DeutschFlow, legal obligations, or consent where consent is required.</p>
      </LegalSection>

      <LegalSection title="4. Services and processors">
        <p>DeutschFlow uses third-party infrastructure necessary to provide the app. This can include:</p>
        <ul>
          <li><strong>Google Firebase:</strong> user authentication and related identity services.</li>
          <li><strong>Google Sign-In:</strong> optional authentication when selected by the user.</li>
          <li><strong>Apple:</strong> optional Sign in with Apple authentication on supported devices.</li>
          <li><strong>Hostinger:</strong> web/API hosting, MySQL database hosting and delivery of DeutschFlow learning content.</li>
          <li><strong>Hosting providers:</strong> web/API hosting and delivery of DeutschFlow services.</li>
        </ul>
        <p>These providers process data under their own security and privacy obligations. Depending on the provider and infrastructure, data may be processed outside the European Economic Area subject to the applicable transfer safeguards.</p>
      </LegalSection>

      <LegalSection title="5. Local storage on your device">
        <p>DeutschFlow can store preferences, authentication state and learning progress locally on your device using app storage. Removing the app or clearing app data can remove locally stored information that has not been synchronised elsewhere.</p>
      </LegalSection>

      <LegalSection title="6. Data sharing">
        <p>We do not sell personal data to advertisers. Data is shared only where necessary to operate the service, comply with law, protect rights and security, or when you explicitly direct us to use a third-party sign-in provider.</p>
      </LegalSection>

      <LegalSection title="7. Retention">
        <p>Account information is retained while your account is active and for only as long afterward as necessary for security, legal, fraud-prevention or support purposes. Locally stored learning information remains on your device until you clear it, remove the app, or use an available deletion/reset function.</p>
      </LegalSection>

      <LegalSection title="8. Account and data deletion">
        <p>You can request deletion of your DeutschFlow account and associated personal data. See our <Link to="/delete-account">Delete Account</Link> page for the current process. Some information may be retained where required by law or necessary to establish, exercise or defend legal claims.</p>
      </LegalSection>

      <LegalSection title="9. Your rights">
        <p>Where the GDPR applies, you may have rights to access, correct, delete, restrict or object to processing, and to receive certain data in a portable format. You may also lodge a complaint with a competent data-protection supervisory authority.</p>
      </LegalSection>

      <LegalSection title="10. Children">
        <p>DeutschFlow is a general educational service and is not designed to knowingly collect personal data from young children without an appropriate legal basis or required parental involvement. If you believe a child has provided personal data improperly, contact us so we can review the situation.</p>
      </LegalSection>

      <LegalSection title="11. Security">
        <p>We use reasonable technical and organisational measures intended to protect personal data. No internet or storage system can be guaranteed to be completely secure.</p>
      </LegalSection>

      <LegalSection title="12. Changes to this policy">
        <p>We may update this Privacy Policy when the app, service providers or legal requirements change. The latest version will be published on this page with an updated date.</p>
      </LegalSection>
    </LegalDocument>
  );
}

export function LegalDocument({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="legalPage publicContainer">
      <div className="legalHero">
        <span className="sectionEyebrow">DEUTSCHFLOW LEGAL</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <small>Last updated: {siteConfig.lastUpdated}</small>
      </div>
      <div className="legalDocument">{children}</div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="legalSection"><h2>{title}</h2>{children}</section>;
}
