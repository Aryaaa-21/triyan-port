import { Outlet, useLoaderData, useLocation, useNavigation } from 'react-router';
import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { fetchAboutSafely, fetchSettings } from '@/features/content/api';
import { Cursor } from '@/components/motion/cursor';
import WindStreamCursor from '@/components/ui/wind-stream-cursor';
import { ArtDefs } from '@/components/art';
import WritingsLoading from './writings-loading';
import WritingLoading from './writing-loading';
import { ScrollProgress } from '@/features/site/scroll-progress';
import { FloatingActions } from '@/features/site/floating-actions';
import { CookieNotice } from '@/features/site/cookie-notice';
import { rememberCampaign } from '@/lib/utm';
import { useEffect } from 'react';

/**
 * The public shell. Admin lives in its own route group with no header or footer,
 * so the two surfaces cannot drift into each other.
 */
export const loader = async () => {
  const [about, settings] = await Promise.all([
    fetchAboutSafely(),
    fetchSettings()
      .then((r) => r.data)
      .catch(() => null),
  ]);
  return { about, newsletter: Boolean(settings?.newsletterEnabled) };
};

/** These only feed the footer: no need to refetch them on every page. */
export const shouldRevalidate = () => false;

/** Archive pages show their own quiet skeleton while the next one loads. */
const pendingFor = (path: string) =>
  path === '/writings' ? (
    <WritingsLoading />
  ) : path.startsWith('/writings/') ? (
    <WritingLoading />
  ) : null;

export default function SiteLayout() {
  const { about, newsletter } = useLoaderData<typeof loader>();
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const pendingPath = navigation.state === 'loading' ? navigation.location.pathname : null;
  const pending = pendingPath && pendingPath !== pathname ? pendingFor(pendingPath) : null;

  // Note the campaign tags of a tagged link once, on arrival.
  useEffect(rememberCampaign, []);

  return (
    <>
      <ScrollProgress />
      <div id="site" className="flex min-h-dvh flex-col">
        <ArtDefs />
        <Cursor />
        {/* The wind that trails the pointer, on every page. */}
        <WindStreamCursor fixed />
        <SiteHeader />
        <div className="flex-1">
          {/* Re-keyed on every navigation, which is what gives each page its entrance.
              The transition is CSS-only and disappears under reduced motion. */}
          <div key={pathname} className="page-enter">
            {pending ?? <Outlet />}
          </div>
        </div>
        <SiteFooter
          newsletter={newsletter}
          {...(about?.links.literaryInstagram
            ? { literaryInstagram: about.links.literaryInstagram }
            : {})}
          {...(about?.links.email ? { email: about.links.email } : {})}
        />
      </div>
      <FloatingActions pathname={pathname} />
      <CookieNotice />
    </>
  );
}
