import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { fetchAboutSafely, fetchSettings } from '@/features/content/api';
import { Intro } from '@/features/intro/intro';
import { Cursor } from '@/components/motion/cursor';
import { ArtDefs } from '@/components/art';

/**
 * The public shell. Admin lives in its own route group with no header or footer,
 * so the two surfaces cannot drift into each other.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [about, settings] = await Promise.all([
    fetchAboutSafely(),
    fetchSettings()
      .then((r) => r.data)
      .catch(() => null),
  ]);
  // On by default; the owner can switch it off from settings without a deploy.
  const introEnabled = settings?.introEnabled ?? true;

  return (
    <>
      {introEnabled && <Intro />}
      {/* #site is made inert while the intro plays, so focus cannot wander behind it. */}
      <div id="site" className="flex min-h-dvh flex-col">
        <ArtDefs />
        <Cursor />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter
          {...(about?.links.literaryInstagram
            ? { literaryInstagram: about.links.literaryInstagram }
            : {})}
          {...(about?.links.email ? { email: about.links.email } : {})}
        />
      </div>
    </>
  );
}
