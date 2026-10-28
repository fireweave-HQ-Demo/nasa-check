import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

const SUGGESTIONS = ['Nebula', 'Apollo', 'Hubble', 'Mars', 'Jupiter', 'Earth from space'];

type Props = {
  value: string;
  onSearch: (query: string, suggested: boolean) => void;
};

/** Remount with `key={value}` to reset the draft when the URL query changes. */
export function SearchBar({ value, onSearch }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = draft.trim();
    if (q) onSearch(q, false);
  };

  return (
    <div className="explore__search">
      <form role="search" className="explore__form" onSubmit={submit}>
        <label htmlFor={id} className="visually-hidden">
          Search NASA images
        </label>
        <input
          id={id}
          className="input explore__input"
          type="search"
          placeholder="Search nebulae, missions, planets…"
          value={draft}
          maxLength={100}
          onChange={(e) => setDraft(e.target.value)}
          autoComplete="off"
        />
        <Button type="submit" variant="primary" disabled={!draft.trim()}>
          Search
        </Button>
      </form>
      <div className="row explore__chips" aria-label="Suggested searches">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn--ghost explore__chip"
            aria-pressed={value.toLowerCase() === s.toLowerCase()}
            onClick={() => onSearch(s, true)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
