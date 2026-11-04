import type { HTMLAttributes } from 'react';

const base =
  'animate-pulse rounded-md bg-[color-mix(in_oklab,var(--app-fg)_11%,transparent)] dark:bg-[color-mix(in_oklab,#fff_8%,transparent)]';

export function Skeleton({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${base} ${className}`.trim()} role="presentation" {...rest} />;
}

/** Design page template row + panel placeholders while `/api/design/templates` loads */
export function DesignPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading design workspace">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
