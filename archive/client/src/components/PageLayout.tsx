import type { ReactNode } from 'react';

const maxWidthByVariant = {
  standard: 'max-w-7xl',
  narrow: 'max-w-6xl',
  wide: 'max-w-[1400px]',
  ultrawide: 'max-w-[1600px]',
} as const;

export type PageLayoutVariant = keyof typeof maxWidthByVariant | 'hero';

export type PageLayoutProps = {
  children: ReactNode;
  /** hero = centered landing; otherwise constrained content width */
  variant?: PageLayoutVariant;
  /** Optional page title region below nav */
  title?: string;
  description?: string;
  className?: string;
  /** Skip inner max-width wrapper (full-width main, you supply padding) */
  noContainer?: boolean;
};

/** Props passed from the route table into `withRouteShell` (Outlet-style). */
export type RouteShellProps = Omit<PageLayoutProps, 'children'>;

export function PageLayout({
  children,
  variant = 'standard',
  title,
  description,
  className = '',
  noContainer = false,
}: PageLayoutProps) {
  if (variant === 'hero') {
    return (
      <main id="main-content" className={`flex flex-1 flex-col outline-none ${className}`} tabIndex={-1}>
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4">{children}</div>
      </main>
    );
  }

  if (noContainer) {
    return (
      <main id="main-content" className={`flex w-full flex-1 flex-col outline-none ${className}`} tabIndex={-1}>
        {children}
      </main>
    );
  }

  const max = maxWidthByVariant[variant];

  return (
    <main id="main-content" className={`flex w-full flex-1 flex-col outline-none ${className}`} tabIndex={-1}>
      <div className={`mx-auto w-full px-4 py-8 ${max}`}>
        {(title || description) && (
          <header className="mb-8">
            {title ? <h1 className="text-3xl font-bold tracking-tight text-app-fg">{title}</h1> : null}
            {description ? <p className="mt-2 text-sm text-app-muted">{description}</p> : null}
          </header>
        )}
        {children}
      </div>
    </main>
  );
}
