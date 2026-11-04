import type { HTMLAttributes } from 'react';
import saraswatiImg from '../assets/saraswati.jpg';

const SIZES = {
  sm: 'h-16 w-16',
  md: 'h-28 w-28',
  lg: 'h-40 w-40',
} as const;

export type SaraswatiSize = keyof typeof SIZES;

export interface SaraswatiProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Guidance line shown beside the mascot. Omitted when empty. */
  message?: string;
  size?: SaraswatiSize;
}

/**
 * Saraswati — the guide mascot for the learning apps.
 *
 * The image is imported (not referenced by URL) so Vite fingerprints and emits
 * it with the bundle; a hardcoded `/suite/...` path would 404 on any base other
 * than the one it was written for.
 */
export function SARASWATI({ message = '', size = 'md', className = '', ...rest }: SaraswatiProps) {
  return (
    <figure
      className={`flex flex-col items-center gap-3 text-center ${className}`.trim()}
      {...rest}
    >
      <img
        src={saraswatiImg}
        alt="Saraswati, the design guide"
        className={`${SIZES[size]} rounded-full border-2 border-[var(--auspicious-gold)]/40 object-cover shadow-md`}
        loading="lazy"
        decoding="async"
      />
      {message ? (
        <figcaption className="max-w-xs text-sm font-bold text-[var(--auspicious-maroon)] dark:text-slate-300">
          {message}
        </figcaption>
      ) : null}
    </figure>
  );
}
