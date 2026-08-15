import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | 'full';
};

export function GlassModal({ open, onOpenChange, title, children, size = 'lg' }: Props) {
  const id = useId();
  const titleId = `${id}-title`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const sizeCls =
    size === 'md'
      ? 'max-w-md'
      : size === 'lg'
        ? 'max-w-3xl'
        : size === 'xl'
          ? 'max-w-6xl'
          : 'max-w-[min(96rem,calc(100vw-2rem))]';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm dark:bg-black/65"
        aria-label="Close dialog"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'glass-modal-content relative z-10 flex max-h-[min(90vh,920px)] w-full flex-col rounded-2xl border shadow-2xl',
          sizeCls,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--app-glass-border)] px-4 py-3 sm:px-5">
          {title ? (
            <h2 id={titleId} className="text-base font-semibold text-app-fg sm:text-lg">
              {title}
            </h2>
          ) : null}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-auto rounded-lg p-2 text-app-muted transition-colors hover:bg-white/10 hover:text-app-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
