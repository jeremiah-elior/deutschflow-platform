import { BookOpen, Headphones, Languages, ListChecks, ShieldCheck } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="legalPage publicContainer aboutPage">
      <div className="legalHero aboutHero">
        <span className="sectionEyebrow">ABOUT DEUTSCHFLOW</span>
        <h1>German learning built around clarity and steady progress.</h1>
        <p>DeutschFlow is designed to help learners understand German concepts, practise them in context and prepare for everyday life in Germany without a cluttered learning experience.</p>
      </div>

      <section className="aboutStoryGrid">
        <div>
          <h2>Why DeutschFlow exists</h2>
          <p>Language learning becomes frustrating when lessons, vocabulary, audio and test preparation are scattered across different tools. DeutschFlow brings those learning activities into one structured flow.</p>
          <p>The goal is straightforward: make the next step obvious, make explanations easier to understand and give learners a practical way to keep progressing.</p>
        </div>
        <div className="valuesCard">
          <strong>What we focus on</strong>
          <div><BookOpen size={20} /><span>Structured lessons</span></div>
          <div><Languages size={20} /><span>Multilingual support</span></div>
          <div><Headphones size={20} /><span>Listening and pronunciation</span></div>
          <div><ListChecks size={20} /><span>Practice and review</span></div>
          <div><ShieldCheck size={20} /><span>LiD Test preparation</span></div>
        </div>
      </section>

      <section className="legalCard disclaimerCard">
        <h2>Independent learning app</h2>
        <p>DeutschFlow is an independent educational product. It is not an official app of BAMF, the German federal government, or another public authority. Official information, test rules and current requirements should always be verified with the responsible authority.</p>
      </section>
    </div>
  );
}
