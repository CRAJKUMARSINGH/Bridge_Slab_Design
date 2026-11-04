import { Link, useLocation } from 'wouter';
import { Landmark, Moon, Sun, Database, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useModelStore } from '@/stores/useModelStore';

const NAV_LINK_CLASS =
  'relative whitespace-nowrap pb-1 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-app-accent after:transition-[width,opacity] after:duration-200';

function ModelThemeToolbar() {
  const { theme, toggleTheme } = useTheme();
  const { activeModel, setModel } = useModelStore();

  return (
    <>
      <div className="flex items-center gap-1 rounded-lg border border-[var(--app-glass-border)] bg-[var(--app-glass-bg)] p-0.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setModel('model-a')}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
            activeModel === 'model-a'
              ? 'bg-app-accent/20 text-app-accent shadow-sm'
              : 'text-app-muted hover:text-app-fg'
          }`}
          aria-label="Switch to Model A"
          title="Model A — Industrial Core (SheetJS)"
        >
          <Database className="h-3 w-3" aria-hidden /> A
        </button>
        <button
          type="button"
          onClick={() => setModel('model-b')}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
            activeModel === 'model-b'
              ? 'bg-royalblue/20 text-royalblue shadow-sm'
              : 'text-app-muted hover:text-app-fg'
          }`}
          aria-label="Switch to Model B"
          title="Model B — Premium Presentation (ExcelJS)"
        >
          <FileSpreadsheet className="h-3 w-3" aria-hidden /> B
        </button>
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--app-glass-border)] bg-[var(--app-glass-bg)] text-app-fg backdrop-blur-md transition-[transform,box-shadow,border-color,color] duration-200 hover:border-app-accent/40 hover:text-app-accent hover:shadow-[0_0_20px_-6px_var(--app-accent-glow)] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/45 motion-reduce:transition-none motion-reduce:hover:shadow-none motion-reduce:active:scale-100"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
      </button>
    </>
  );
}

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { path: '/', label: 'Home' },
    { path: '/merge', label: 'Merge' },
    { path: '/design', label: 'Design' },
    { path: '/projects', label: 'Projects' },
    { path: '/pier-stability', label: 'Pier Stability' },
    { path: '/drawing', label: 'Drawing' },
    { path: '/estimate', label: 'Estimate' },
    { path: '/about-scope', label: 'About Scope' },
    { path: '/report', label: 'Narrative Report' },
    { path: '/hydraulics', label: 'Hydraulics' },
    { path: '/slab-design', label: 'Slab Design' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/t-girder', label: 'T-Girder' },
    { path: '/astra-library', label: 'ASTRA Library' },
    { path: '/interaction-diagram', label: 'P-M Diagram' },
    { path: '/abutment-stability', label: 'Abutment' },
    { path: '/formula-evaluator', label: 'Formula Eval' },
  ];

  return (
    <nav
      className="border-b border-[var(--app-glass-border)] bg-[var(--app-nav-bg)] backdrop-blur-xl"
      aria-label="Primary"
    >
      <div className="mx-auto w-full max-w-[1600px] px-4">
        <div className="flex min-h-16 flex-col gap-3 py-3 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
          <div className="flex items-center justify-between gap-4 lg:shrink-0">
            <Link href="/">
              <a className="flex items-center gap-2 text-lg font-semibold text-app-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-nav-bg)] rounded-md">
                <Landmark className="h-6 w-6 shrink-0 text-app-accent" aria-hidden />
                Bridge Design
              </a>
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <ModelThemeToolbar />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--app-glass-border)] pt-3 lg:border-t-0 lg:pt-0 lg:justify-center">
            {links.map((link) => {
              const active = location === link.path;
              return (
                <Link key={link.path} href={link.path}>
                  <a
                    className={`${NAV_LINK_CLASS} ${
                      active
                        ? 'text-app-accent after:w-full after:opacity-100'
                        : 'text-app-muted after:w-0 after:opacity-0 hover:text-app-fg hover:after:w-full hover:after:opacity-70'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {link.label}
                  </a>
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-2 lg:flex lg:shrink-0">
            <ModelThemeToolbar />
          </div>
        </div>
      </div>
    </nav>
  );
}


