import { lazy, Suspense, useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { ThemeProvider } from '@/lib/theme-context';
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
import { ThemedToaster } from '@/components/ThemedToaster';

// Lazy load heavy pages
const BridgeSlabReport = lazy(() => import('@/pages/BridgeSlabReport'));
const HydraulicPage = lazy(() => import('@/pages/HydraulicPage'));
const SlabPage = lazy(() => import('@/pages/SlabPage'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function HydrateDesignStore() {
  useEffect(() => { 
    // Try to hydrate if method exists
    const store = useDesignStore.getState() as any;
    if (store.hydrateFromStorage) {
      store.hydrateFromStorage();
    }
  }, []);
  return null;
}

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-slate-950">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <span className="text-slate-400 font-medium">Loading Bridge Design Suite...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HydrateDesignStore />
        <AppShell>
          <Suspense fallback={<LoadingFallback />}>
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/design" component={Design} />
              <Route path="/drawing" component={Drawing} />
              <Route path="/estimate" component={Estimate} />
              <Route path="/pier-stability" component={PierStability} />
              <Route path="/projects" component={Projects} />
              <Route path="/about-scope" component={AboutScope} />
              <Route path="/merge" component={MergeIntegration} />
              <Route path="/report" component={BridgeSlabReport} />
              <Route path="/hydraulics" component={HydraulicPage} />
              <Route path="/slab-design" component={SlabPage} />
              <Route path="/dashboard" component={Dashboard} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
          <ThemedToaster />
        </AppShell>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
