import { ChevronDown, CircleHelp, Mail, ShieldX, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mailto, siteConfig } from '../../public/siteConfig';

const faqs = [
  ['I cannot sign in. What should I try?', 'Confirm that you are using the same sign-in method you originally used. Check your internet connection, then restart the app and try again. If the issue continues, contact support with the email address used for your account.'],
  ['My lesson content is not loading.', 'Check your connection and reopen the lesson. Some lesson media is delivered online and may take longer on a slow connection. If one specific lesson continues to fail, tell support the course, level and lesson name.'],
  ['How does LiD Test practice work?', 'DeutschFlow provides learning and practice tools for Leben in Deutschland preparation. It is an independent study aid and does not replace official BAMF information or the official test.'],
  ['Can I delete my account?', 'Yes. Use the account deletion option inside the app where available, or follow the instructions on our public Delete Account page.'],
  ['Where is my learning progress stored?', 'Some learning preferences and LiD practice history can be stored locally on your device. Account authentication is handled through the services described in the Privacy Policy.']
];

export function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="legalPage publicContainer supportPage">
      <div className="legalHero centeredLegalHero">
        <span className="sectionEyebrow">SUPPORT</span>
        <h1>How can we help?</h1>
        <p>Find answers to common questions or contact DeutschFlow support directly.</p>
      </div>

      <div className="supportCards">
        <a className="supportCard" href={mailto('DeutschFlow support request', 'Please describe the issue you are experiencing:\n\nApp version:\nDevice:\n') }>
          <span><Mail size={24} /></span><div><h2>Email support</h2><p>{siteConfig.supportEmail}</p></div>
        </a>
        <div className="supportCard">
          <span><Smartphone size={24} /></span><div><h2>App issue?</h2><p>Include your device, app version and the screen where the problem happens.</p></div>
        </div>
        <Link className="supportCard" to="/delete-account">
          <span><ShieldX size={24} /></span><div><h2>Delete account</h2><p>See account and associated data deletion instructions.</p></div>
        </Link>
      </div>

      <section className="faqSection">
        <div className="sectionHeading"><span className="sectionEyebrow">FAQ</span><h2>Frequently asked questions</h2></div>
        <div className="faqList">
          {faqs.map(([question, answer], index) => {
            const open = openIndex === index;
            return (
              <button className={`faqItem ${open ? 'open' : ''}`} key={question} onClick={() => setOpenIndex(open ? null : index)}>
                <span className="faqQuestion"><CircleHelp size={20} /><strong>{question}</strong><ChevronDown size={20} /></span>
                {open ? <span className="faqAnswer">{answer}</span> : null}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
