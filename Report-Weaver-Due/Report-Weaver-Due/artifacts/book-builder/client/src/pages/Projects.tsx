import { Link } from 'wouter';
import { FolderKanban } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';

export function Projects() {
  return (
    <div className="glass-panel p-8">
      <div className="mb-6 flex items-center gap-3 text-app-muted">
        <FolderKanban className="h-10 w-10 shrink-0 text-app-accent" />
        <p className="text-sm leading-relaxed">
          Use <strong className="text-app-fg">Design</strong> to run calculations and exports. Multi-project persistence
          can be wired to this shell when a backend store is added.
        </p>
      </div>
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full max-w-lg" />
      </div>
      <div className="mt-8 text-center">
        <Link href="/design">
          <a className="inline-flex rounded-lg bg-app-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Open Design
          </a>
        </Link>
      </div>
    </div>
  );
}
