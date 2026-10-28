import { useId } from 'react';

type Props = {
  label: string;
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
};

/** Native date input: accessible, localised and mobile-friendly. */
export function DatePicker({ label, value, min, max, onChange }: Props) {
  const id = useId();
  return (
    <span className="row" style={{ gap: 'var(--space-2)' }}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <input
        id={id}
        className="input"
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
      />
    </span>
  );
}
