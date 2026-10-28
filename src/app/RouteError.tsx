import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { log } from '@/lib/observability';

export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (!notFound) {
    log('error', 'Route render error', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return (
    <div className="container page">
      <div className="state state--error" role="alert">
        <h2>{notFound ? 'Page not found' : 'Something went wrong'}</h2>
        <p>
          {notFound
            ? 'That page drifted out of orbit.'
            : 'An unexpected error occurred while showing this page.'}
        </p>
        <Link className="btn btn--primary" to="/">
          Back to today
        </Link>
      </div>
    </div>
  );
}
