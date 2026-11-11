import { useContext, useMemo } from 'react';
import {
  UNSAFE_DataRouterContext,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
} from 'react-router';

/**
 * Navigation hooks for components. They read React Router's contexts directly so they
 * also work when a component is rendered without a router (tests, isolated renders),
 * falling back to the browser's own location.
 */

const browserLocation = () =>
  typeof window === 'undefined'
    ? { pathname: '/', search: '' }
    : { pathname: window.location.pathname, search: window.location.search };

export function usePathname(): string {
  return useContext(UNSAFE_LocationContext)?.location.pathname ?? browserLocation().pathname;
}

/** The current query string, read-only. To change it, navigate with `useRouter()`. */
export function useSearchParams(): URLSearchParams {
  const search = useContext(UNSAFE_LocationContext)?.location.search ?? browserLocation().search;
  return useMemo(() => new URLSearchParams(search), [search]);
}

export interface AppRouter {
  push: (to: string, options?: { scroll?: boolean }) => void;
  replace: (to: string, options?: { scroll?: boolean }) => void;
  back: () => void;
  /** Re-runs the current page's data loaders, e.g. after an admin change. */
  refresh: () => void;
}

export function useRouter(): AppRouter {
  const navigation = useContext(UNSAFE_NavigationContext);
  const data = useContext(UNSAFE_DataRouterContext);
  return useMemo(
    () => ({
      push: (to) => {
        if (navigation) void navigation.navigator.push(to);
        else window.location.assign(to);
      },
      replace: (to) => {
        if (navigation) void navigation.navigator.replace(to);
        else window.location.replace(to);
      },
      back: () => window.history.back(),
      refresh: () => {
        void data?.router.revalidate();
      },
    }),
    [navigation, data],
  );
}
