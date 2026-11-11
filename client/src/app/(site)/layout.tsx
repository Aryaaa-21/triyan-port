import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { fetchAboutSafely } from '@/features/content/api';

/**
 * The public shell. Admin lives in its own route group with no header or footer,
 * so the two surfaces cannot drift into each other.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const about = await fetchAboutSafely();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter
        {...(about?.links.literaryInstagram
          ? { literaryInstagram: about.links.literaryInstagram }
          : {})}
        {...(about?.links.email ? { email: about.links.email } : {})}
      />
    </div>
  );
}
