import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lightbox } from '@/components/media/Lightbox';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { track } from '@/lib/observability';
import {
  addDays,
  APOD_FIRST_DATE,
  isApodDateInRange,
  randomApodDate,
  todayInEastern,
} from '@/utils/dates';
import { ApodCard } from './ApodCard';
import { useApod } from './useApod';
import './today.css';

export function TodayPage() {
  const { date } = useParams<{ date?: string }>();
  const today = todayInEastern();
  const invalid = date !== undefined && !isApodDateInRange(date, today);

  if (invalid) {
    return (
      <div className="page">
        <div className="state state--error" role="alert">
          <h2>That date isn&apos;t available</h2>
          <p>
            APOD entries exist from June 16, 1995 to today. Pick a date in that range, or jump back
            to the latest picture.
          </p>
          <Link to="/" className="btn btn--primary">
            Go to today
          </Link>
        </div>
      </div>
    );
  }
  return <ApodView date={date} today={today} />;
}

function ApodView({ date, today }: { date?: string; today: string }) {
  const navigate = useNavigate();
  const query = useApod(date);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const apod = query.data;
  const current = apod?.date ?? date ?? today;

  useEffect(() => {
    if (apod)
      track('apod_viewed', { date: apod.date, media_type: apod.media_type, source: 'today' });
  }, [apod]);

  const go = (target: string, via: 'picker' | 'prev' | 'next') => {
    track('apod_date_changed', { via });
    navigate(`/today/${target}`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Astronomy Picture of the Day</p>
        <h1>{date ? 'A picture from the archive' : "Today's picture"}</h1>
      </div>

      <div className="row today__controls" role="group" aria-label="Choose a date">
        <Button
          onClick={() => go(addDays(current, -1), 'prev')}
          disabled={current <= APOD_FIRST_DATE}
        >
          ← Previous
        </Button>
        <DatePicker
          label="Pick a date"
          value={current}
          min={APOD_FIRST_DATE}
          max={today}
          onChange={(d) => go(d, 'picker')}
        />
        <Button onClick={() => go(addDays(current, 1), 'next')} disabled={current >= today}>
          Next →
        </Button>
        <span className="today__spacer" />
        {date && (
          <Link
            to="/"
            className="btn btn--ghost"
            onClick={() => track('apod_date_changed', { via: 'latest' })}
          >
            Latest
          </Link>
        )}
        <Button
          variant="primary"
          onClick={() => {
            track('apod_random_clicked', {});
            navigate(`/today/${randomApodDate(today)}`);
          }}
        >
          Surprise me
        </Button>
      </div>

      {query.isPending && <ApodSkeleton />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {apod && (
        <>
          <ApodCard
            apod={apod}
            onOpen={() => {
              track('lightbox_opened', { source: 'today' });
              setLightboxOpen(true);
            }}
          />
          <Lightbox
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            index={0}
            slides={[
              {
                src: apod.hdurl ?? apod.url ?? '',
                alt: apod.title,
                title: apod.title,
                description: apod.copyright ? `© ${apod.copyright}` : undefined,
              },
            ]}
          />
        </>
      )}
    </div>
  );
}

function ApodSkeleton() {
  return (
    <div className="apod" aria-busy="true" aria-label="Loading picture">
      <Skeleton height="auto" style={{ aspectRatio: '16 / 10', borderRadius: 'var(--radius)' }} />
      <div className="apod__body">
        <Skeleton width={140} height={12} />
        <Skeleton width="70%" height={28} />
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton width="85%" height={14} />
      </div>
    </div>
  );
}
