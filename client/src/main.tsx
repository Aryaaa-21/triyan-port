import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/spectral/300.css';
import '@fontsource/spectral/300-italic.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/500-italic.css';
import '@fontsource/tiro-devanagari-hindi/400.css';
import '@fontsource/tiro-devanagari-hindi/400-italic.css';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist-mono/400.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/600.css';
import './styles/fonts.css';
import './styles/globals.css';
import { createRouter } from './router';

// The static title and description in index.html are for readers and crawlers that do
// not run scripts. From here on, each page renders its own.
document.querySelectorAll('[data-static-head]').forEach((element) => element.remove());

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={createRouter()} />
    </StrictMode>,
  );
}
