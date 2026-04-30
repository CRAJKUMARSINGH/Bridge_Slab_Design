import { memo, type ComponentType } from 'react';
import type { RouteComponentProps } from 'wouter';
import { PageLayout, type RouteShellProps } from '@/components/PageLayout';

/**
 * Wraps a page component in {@link PageLayout} so routes share one shell without repeating layout props.
 * Think React Router `Outlet` + parent layout, flattened for wouter.
 */
export function withRouteShell(
  Page: ComponentType<object>,
  shell: RouteShellProps
): ComponentType<RouteComponentProps> {
  const name = Page.displayName ?? Page.name ?? 'Page';

  function RouteLayoutOutlet(props: RouteComponentProps) {
    const PageCmp = Page as ComponentType<RouteComponentProps>;
    return (
      <PageLayout {...shell}>
        <PageCmp {...props} />
      </PageLayout>
    );
  }

  RouteLayoutOutlet.displayName = `RouteShell(${name})`;
  return memo(RouteLayoutOutlet);
}
