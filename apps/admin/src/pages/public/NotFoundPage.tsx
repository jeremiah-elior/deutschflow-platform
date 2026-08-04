import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="notFoundPage publicContainer">
      <img src="/deutschflow-logo.png" alt="DeutschFlow" />
      <span>404</span>
      <h1>That page isn't here.</h1>
      <p>The link may be outdated or the page may have moved.</p>
      <Link className="heroButton primaryHeroButton" to="/"><ArrowLeft size={18} /> Back to DeutschFlow</Link>
    </div>
  );
}
