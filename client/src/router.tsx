import type { ComponentType } from 'react';
import { createBrowserRouter, type LoaderFunction, type RouteObject } from 'react-router';
import RootLayout, { FirstLoad } from './routes/root';
import SiteLayout, {
  loader as siteLoader,
  shouldRevalidate as siteShouldRevalidate,
} from './routes/site/layout';
import RouteError from './routes/site/error';
import NotFound from './routes/site/not-found';
import Home, { loader as homeLoader } from './routes/site/home';

interface RouteModule {
  default: ComponentType;
  loader?: LoaderFunction;
}

/** A page loaded on demand: its code arrives with its first visit. */
const page = (load: () => Promise<RouteModule>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => {
    const mod = await load();
    return { Component: mod.default, ...(mod.loader ? { loader: mod.loader } : {}) };
  },
});

/**
 * The site's routes. The homepage and the public shell load with the app; every
 * other page loads on demand. Each page's `loader` fetches its data before the page
 * shows, so a page never paints half-empty.
 */
export const routes: RouteObject[] = [
  {
    Component: RootLayout,
    HydrateFallback: FirstLoad,
    children: [
      {
        Component: SiteLayout,
        loader: siteLoader,
        shouldRevalidate: siteShouldRevalidate,
        ErrorBoundary: RouteError,
        children: [
          {
            // Errors inside a page keep the header and footer around them.
            ErrorBoundary: RouteError,
            children: [
              { index: true, Component: Home, loader: homeLoader },
              { path: 'writings', ...page(() => import('./routes/site/writings')) },
              { path: 'writings/:slug', ...page(() => import('./routes/site/writing')) },
              { path: 'about', ...page(() => import('./routes/site/about')) },
              { path: 'book', ...page(() => import('./routes/site/book')) },
              { path: 'abyss', ...page(() => import('./routes/site/abyss')) },
              { path: 'instagram', ...page(() => import('./routes/site/instagram')) },
              { path: 'instagram/:id', ...page(() => import('./routes/site/instagram-post')) },
              { path: 'contact', ...page(() => import('./routes/site/contact')) },
              { path: 'subscription', ...page(() => import('./routes/site/subscription')) },
              { path: '*', Component: NotFound },
            ],
          },
        ],
      },
      {
        path: 'admin',
        ErrorBoundary: RouteError,
        ...page(() => import('./routes/admin/layout')),
        children: [
          { index: true, ...page(() => import('./routes/admin/dashboard')) },
          { path: 'login', ...page(() => import('./routes/admin/login')) },
          { path: 'inbox', ...page(() => import('./routes/admin/inbox')) },
          { path: 'subscribers', ...page(() => import('./routes/admin/subscribers')) },
          { path: 'instagram', ...page(() => import('./routes/admin/instagram')) },
          { path: 'writings/new', ...page(() => import('./routes/admin/writing-new')) },
          { path: 'writings/:id', ...page(() => import('./routes/admin/writing-edit')) },
        ],
      },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
