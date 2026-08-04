import { LegalDocument, LegalSection } from './PrivacyPolicyPage';
import { siteConfig } from '../../public/siteConfig';

export function TermsPage() {
  return (
    <LegalDocument title="Terms of Use" intro="These terms govern your use of the DeutschFlow app, website and learning services.">
      <LegalSection title="1. About DeutschFlow">
        <p>DeutschFlow is an educational application for learning German and preparing with study tools such as Leben in Deutschland practice content. The service is operated by {siteConfig.legalName}.</p>
      </LegalSection>
      <LegalSection title="2. Educational purpose">
        <p>DeutschFlow provides learning and practice material only. It does not provide official examination results, immigration advice, legal advice or a guarantee that a user will pass an examination or meet a government requirement.</p>
        <p>DeutschFlow is independent and is not affiliated with or endorsed by BAMF, the German federal government or another public authority unless explicitly stated otherwise.</p>
      </LegalSection>
      <LegalSection title="3. Accounts">
        <p>You are responsible for maintaining the confidentiality of your sign-in credentials and for activity performed through your account. Information supplied during registration should be accurate and you should notify support if you believe your account has been compromised.</p>
      </LegalSection>
      <LegalSection title="4. Acceptable use">
        <p>You may use DeutschFlow for lawful personal learning purposes. You must not attempt to interfere with the service, bypass security, access administrative systems without permission, scrape protected content at scale, or use the service in a way that infringes the rights of others.</p>
      </LegalSection>
      <LegalSection title="5. Content and intellectual property">
        <p>The DeutschFlow application, branding, original explanations, layouts, software and other original content are protected by applicable intellectual-property laws. Government-origin or third-party material, where used, remains subject to the rights and conditions applicable to that source.</p>
      </LegalSection>
      <LegalSection title="6. Availability and changes">
        <p>Features, lessons, languages and content may be added, changed or removed over time. We aim to keep the service available and accurate, but uninterrupted availability cannot be guaranteed.</p>
      </LegalSection>
      <LegalSection title="7. No official-status guarantee">
        <p>Rules, question catalogues, test procedures and public requirements can change. Users should verify important current information with the official responsible authority. DeutschFlow does not warrant that all educational content will always reflect the latest official wording at every moment.</p>
      </LegalSection>
      <LegalSection title="8. Account termination">
        <p>You may stop using DeutschFlow at any time and may request account deletion. We may restrict access where reasonably necessary for security, abuse prevention or violations of these terms.</p>
      </LegalSection>
      <LegalSection title="9. Liability">
        <p>Mandatory statutory liability remains unaffected. To the extent permitted by applicable law, DeutschFlow is not responsible for indirect losses resulting from reliance on educational content, service interruptions, third-party services or user device issues.</p>
      </LegalSection>
      <LegalSection title="10. Contact">
        <p>Questions about these terms can be sent to <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.</p>
      </LegalSection>
    </LegalDocument>
  );
}
