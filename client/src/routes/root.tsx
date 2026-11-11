import { Outlet, ScrollRestoration } from 'react-router';

/** Everything the site and the admin share: the skip link and scroll restoration. */
export default function RootLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-(--z-nav) focus-visible:bg-surface focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm"
      >
        Skip to content
      </a>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

/** While the first page's data loads: the site's own background, nothing else. */
export function FirstLoad() {
  return <div className="min-h-dvh bg-bg" aria-busy="true" />;
}
