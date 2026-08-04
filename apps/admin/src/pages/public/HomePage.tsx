import { ArrowRight, BookOpenCheck, BrainCircuit, Check, GraduationCap, Headphones, Languages, MapPinned, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../public/siteConfig';

const features = [
  { icon: GraduationCap, title: 'Structured German learning', body: 'Follow clear lessons from beginner foundations toward higher language levels without losing track of what comes next.' },
  { icon: Languages, title: 'Explanations that feel familiar', body: 'Learn German with supporting explanations designed for multilingual learners, including Telugu support and additional languages as content becomes available.' },
  { icon: Headphones, title: 'Learn with audio', body: 'Practice pronunciation and listening alongside lesson notes and vocabulary so learning is not limited to reading.' },
  { icon: ShieldCheck, title: 'Leben in Deutschland Test', body: 'Prepare with practice questions, learning mode, mock exams and progress review in one place.' },
  { icon: BrainCircuit, title: 'Practice with purpose', body: 'Review vocabulary, quizzes and mistakes instead of repeating material without knowing what needs attention.' },
  { icon: MapPinned, title: 'Built for life in Germany', body: 'Combine language learning with practical knowledge that supports everyday life and integration in Germany.' }
];

const steps = [
  ['01', 'Choose your learning language', 'Set the explanation language that helps you understand new German concepts fastest.'],
  ['02', 'Follow a clear lesson path', 'Move through lessons, vocabulary, notes, audio and quizzes at your own pace.'],
  ['03', 'Prepare and measure progress', 'Use practice and LiD mock exams to identify weak areas and keep improving.']
];

function StoreButtons() {
  const hasGoogle = Boolean(siteConfig.googlePlayUrl);
  const hasApple = Boolean(siteConfig.appStoreUrl);
  if (!hasGoogle && !hasApple) return <Link to="/support" className="heroButton secondaryHeroButton">App availability <ArrowRight size={18} /></Link>;
  return (
    <div className="storeButtons">
      {hasGoogle ? <a className="storeButton" href={siteConfig.googlePlayUrl} rel="noreferrer">Get it on <strong>Google Play</strong></a> : null}
      {hasApple ? <a className="storeButton" href={siteConfig.appStoreUrl} rel="noreferrer">Download on the <strong>App Store</strong></a> : null}
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <section className="heroSection">
        <div className="heroGlow heroGlowOne" />
        <div className="heroGlow heroGlowTwo" />
        <div className="publicContainer heroGrid">
          <div className="heroCopy">
            <div className="heroBadge"><Sparkles size={16} /> German learning, made clearer</div>
            <h1>Learn German in a way that <span>makes sense to you.</span></h1>
            <p className="heroLead">DeutschFlow brings structured lessons, multilingual explanations, audio practice and Leben in Deutschland Test preparation into one focused learning experience.</p>
            <div className="heroActions">
              <StoreButtons />
              <a className="heroButton ghostHeroButton" href="#features">Explore features</a>
            </div>
            <div className="heroTrust">
              <span><Check size={16} /> Learn at your pace</span>
              <span><Check size={16} /> Practice LiD questions</span>
              <span><Check size={16} /> Track your progress</span>
            </div>
          </div>

          <div className="heroVisual" aria-label="DeutschFlow learning preview">
            <div className="heroVisualCard">
              <img className="studentsImage" src="/lid-students.png" alt="Illustration of two German language learners" />
              <div className="floatingCard floatingCardTop">
                <span className="floatingIcon"><BookOpenCheck size={20} /></span>
                <div><small>German lesson</small><strong>Learn · Listen · Practice</strong></div>
              </div>
              <div className="floatingCard floatingCardBottom">
                <span className="floatingIcon purple"><ShieldCheck size={20} /></span>
                <div><small>LiD preparation</small><strong>Practice & mock exams</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="publicSection sectionSoft" id="features">
        <div className="publicContainer">
          <div className="sectionHeading centeredHeading">
            <span className="sectionEyebrow">ONE LEARNING FLOW</span>
            <h2>Everything you need to keep moving forward</h2>
            <p>DeutschFlow keeps the important parts of learning together so you can focus on the next useful step.</p>
          </div>
          <div className="featureGrid">
            {features.map(({ icon: Icon, title, body }) => (
              <article className="featureCard" key={title}>
                <span className="featureIcon"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="publicSection darkSection">
        <div className="publicContainer splitSection">
          <div className="sectionHeading lightHeading">
            <span className="sectionEyebrow">LEBEN IN DEUTSCHLAND</span>
            <h2>Prepare with less guessing and more focused practice.</h2>
            <p>Use learning mode to understand questions, then switch to exam-style practice and review your results.</p>
            <Link to="/about" className="textLink lightTextLink">How DeutschFlow works <ArrowRight size={18} /></Link>
          </div>
          <div className="lidPreviewCard">
            <div className="lidPreviewTop"><span>LiD Test</span><strong>Practice</strong></div>
            <p className="questionCount">Question 12 <span>of 33</span></p>
            <h3>Build confidence before your test.</h3>
            <div className="answerMock selected">A <span>Learn with clear explanations</span></div>
            <div className="answerMock">B <span>Review mistakes after practice</span></div>
            <div className="answerMock">C <span>Track previous scores</span></div>
            <div className="progressMock"><span /></div>
          </div>
        </div>
      </section>

      <section className="publicSection">
        <div className="publicContainer">
          <div className="sectionHeading centeredHeading compactHeading">
            <span className="sectionEyebrow">SIMPLE BY DESIGN</span>
            <h2>Start learning in three steps</h2>
          </div>
          <div className="stepsGrid">
            {steps.map(([number, title, body]) => (
              <article className="stepCard" key={number}>
                <span className="stepNumber">{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="publicSection ctaSection">
        <div className="publicContainer ctaCard">
          <div>
            <span className="sectionEyebrow">DEUTSCHFLOW</span>
            <h2>Ready to make German feel more manageable?</h2>
            <p>Learn consistently, practise what matters and keep your progress in one place.</p>
          </div>
          <StoreButtons />
        </div>
      </section>
    </>
  );
}
