import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page">
      <div className="state">
        <h2>Page not found</h2>
        <p>That page drifted out of orbit.</p>
        <Link className="btn btn--primary" to="/">
          Back to today
        </Link>
      </div>
    </div>
  );
}
