import { AlertTriangle, CheckCircle2, Mail, Smartphone, Trash2 } from 'lucide-react';
import { mailto, siteConfig } from '../../public/siteConfig';

export function DeleteAccountPage() {
  const deletionMail = mailto(
    'DeutschFlow account deletion request',
    'I would like to delete my DeutschFlow account and associated personal data.\n\nAccount email: \nSign-in method (Email / Google / Apple): \n\nI understand that deletion is permanent.'
  );

  return (
    <div className="legalPage publicContainer deletePage">
      <div className="legalHero">
        <span className="sectionEyebrow">ACCOUNT & DATA</span>
        <h1>Delete your DeutschFlow account</h1>
        <p>You can request permanent deletion of your DeutschFlow account and personal data associated with that account.</p>
      </div>

      <div className="deleteGrid">
        <section className="legalCard">
          <span className="largeLegalIcon"><Smartphone size={26} /></span>
          <h2>Option 1 — In the app</h2>
          <p>If your installed version shows a <strong>Delete Account</strong> option, open DeutschFlow and go to your Profile/Settings area, choose Delete Account and follow the confirmation steps.</p>
        </section>
        <section className="legalCard">
          <span className="largeLegalIcon"><Mail size={26} /></span>
          <h2>Option 2 — Request deletion online</h2>
          <p>If you cannot access the app or the deletion option is unavailable in your installed version, send a deletion request from the email address connected to your account.</p>
          <a className="deleteRequestButton" href={deletionMail}><Trash2 size={18} /> Request account deletion</a>
          <small>Requests are sent to {siteConfig.supportEmail}.</small>
        </section>
      </div>

      <section className="legalCard deletionDetails">
        <h2>What will be deleted</h2>
        <div className="deletionList">
          <span><CheckCircle2 size={19} /> Your DeutschFlow authentication account/identifier, where controlled by DeutschFlow.</span>
          <span><CheckCircle2 size={19} /> Account profile information associated with that account.</span>
          <span><CheckCircle2 size={19} /> Other server-side personal data directly associated with the account, where applicable and not legally required to be retained.</span>
        </div>
        <h2>What may require a separate local action</h2>
        <p>Some learning preferences, LiD practice history, results and other progress information can be stored locally on your device. You can remove local app data by clearing the app's storage or uninstalling the app after your account deletion is complete.</p>
      </section>

      <section className="legalCard warningCard">
        <AlertTriangle size={23} />
        <div><h2>Deletion is permanent</h2><p>After an account is deleted, it may not be possible to restore the account or associated data. Limited records may be retained where required by law, security obligations or the establishment, exercise or defence of legal claims.</p></div>
      </section>
    </div>
  );
}
