import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type Variant = 'default' | 'primary' | 'ghost';

function classes(variant: Variant, className?: string) {
  return ['btn', variant !== 'default' && `btn--${variant}`, className].filter(Boolean).join(' ');
}

export function Button({
  variant = 'default',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={classes(variant, className)} {...props} />;
}

export function ExternalLink({
  variant = 'default',
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      className={classes(variant, className)}
      {...props}
    />
  );
}
