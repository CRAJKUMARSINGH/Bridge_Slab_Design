import { lazy, Suspense, useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { ThemeProvider } from '@/lib/theme-context';
import { withRouteShell } from '@/layouts/withRouteShell';
import { useDesignStore } from '@/stores/useDesignStore';
import { Landing } from '@/pages/Landing';
import { Design } from '@/pages/Design';
import { Drawing } from '@/pages/Drawing';
import { Estimate } from '@/pages/Estimate';
import { PierStability } from '@/pages/PierStability';
import { Projects } from '@/pages/Projects';
import { AboutScope } from '@/pages/AboutScope';
import { MergeIntegration } from '@/pages/MergeIntegration';
import { NotFound } from '@/pages/NotFound';
import { installFirstRunDemoIfNeeded } from '@/lib/demo-seed';

// Repo B: Narrative prose report (lazy-loaded — heavy component)
const BridgeSlabReport = lazy(() => import('@/pages/BridgeSlabReport'));
// REFERENCE-APP00: Standalone hydraulic + slab design pages
const HydraulicPage = lazy(() => import('@/pages/HydraulicPage'));
const SlabPage = lazy(() => import('@/pages/SlabPage'));
// MERGE: Dashboard with SVG charts & design check verdicts (from Repo B)
const Dashboard = lazy(() => import('@/pages/Dashboard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

const HomePage = withRouteShell(Landing, { variant: 'hero' });
const DesignPage = withRouteShell(Design, { variant: 'wide' });
const DrawingPage = withRouteShell(Drawing, { variant: 'standard' });
const EstimatePage = withRouteShell(Estimate, { variant: 'narrow' });
const PierPage = withRouteShell(PierStability, { variant: 'ultrawide' });
const ProjectsPage = withRouteShell(Projects, {
  variant: 'standard',
  title: 'Projects',
  description: 'Saved designs and deliverables will list here; the app currently uses browser storage for the active design.',
});
const AboutScopePage = withRouteShell(AboutScope, {
  variant: 'standard',
  title: 'About Drawing Scope',
  description: 'Transparent status of current drawing outputs and known limits.',
});
const MergeIntegrationPage = withRouteShell(MergeIntegration, {
  variant: 'wide',
  title: 'Merge integration',
  description: 'Repo A + Repo B hybrid: model selector, merged routes, and live feature flags.',
});
const NotFoundPage = withRouteShell(NotFound, {
  variant: 'standard',
  title: '404',
  description: 'This path is not part of the bridge design app.',
});

function HydrateDesignStore() {
  useEffect(() => { useDesignStore.getState().hydrateFromStorage(); }, []);
  return null;
}

function FirstRunDemoSeed() {
  useEffect(() => { void installFirstRunDemoIfNeeded(); }, []);
  return null;
}

const ReportFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <span className="animate-pulse text-app-muted">Loading narrative report</span>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HydrateDesignStore />
        <AppShell>
        <FirstRunDemoSeed />
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/design" component={DesignPage} />
          <Route path="/drawing" component={DrawingPage} />
          <Route path="/estimate" component={EstimatePage} />
          <Route path="/pier-stability" component={PierPage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/about-scope" component={AboutScopePage} />
          <Route path="/merge" component={MergeIntegrationPage} />
          <Route path="/report" component={() => (
            <Suspense fallback={<ReportFallback />}>
              <BridgeSlabReport />
            </Suspense>
          )} />
          <Route path="/hydraulics" component={() => (<Suspense fallback={<ReportFallback />}><HydraulicPage /></Suspense>)} />
          <Route path="/slab-design" component={() => (<Suspense fallback={<ReportFallback />}><SlabPage /></Suspense>)} />
          <Route path="/dashboard" component={() => (<Suspense fallback={<ReportFallback />}><Dashboard /></Suspense>)} />
          <Route component={NotFoundPage} />
        </Switch>
      </AppShell>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

