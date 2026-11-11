import type { AnchorHTMLAttributes, Ref } from 'react';
import { Link as RouterLink, useInRouterContext } from 'react-router';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  replace?: boolean;
  /** Accepted for compatibility: scroll restoration is handled by the router. */
  scroll?: boolean;
  prefetch?: boolean;
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * The site's link. Paths inside the site navigate client-side through React Router;
 * external, mail, telephone and in-page links are ordinary anchors. Outside a router
 * (a component rendered on its own, as in tests) it is an ordinary anchor too.
 */
export function Link({
  href,
  replace,
  ref,
  scroll: _scroll,
  prefetch: _prefetch,
  ...rest
}: LinkProps) {
  const inRouter = useInRouterContext();
  if (!inRouter || /^(?:[a-z]+:|#|\/\/)/i.test(href)) {
    return <a ref={ref} href={href} {...rest} />;
  }
  return <RouterLink ref={ref} to={href} replace={replace} {...rest} />;
}

export default Link;
