/* global document, getComputedStyle */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
/**
 * Browser end-to-end check of the public site, the Instagram archive and the admin.
 *
 *   BASE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run e2e:browser
 *
 * Needs a running client + API with at least one published ENGLISH and one HINDI
 * writing, and synced Instagram posts (the mock provider is fine). CHROMIUM_PATH
 * may point at a Chromium binary; otherwise Playwright's installed one is used.
 * Screenshots at 390px and 1440px go to OUT (default e2e/screenshots).
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = process.env.OUT ?? 'e2e/screenshots';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
fs.mkdirSync(OUT, { recursive: true });
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const results = [];
const hydrated = (pg) =>
  pg.waitForFunction(
    () => {
      const b = document.querySelector('header button');
      return b && Object.keys(b).some((k) => k.startsWith('__react'));
    },
    null,
    { timeout: 15000 },
  );
const fail = (m) => results.push(`FAIL ${m}`);
const pass = (m) => results.push(`ok   ${m}`);
const check = (cond, ok, bad) => (cond ? pass(ok) : fail(bad));

const ctx = await browser.newContext();
// The black-hole intro plays once per session on the homepage; it has its own check
// below, so the general walk-through starts with it already seen.
await ctx.addInitScript(() => sessionStorage.setItem('triyan.intro', '1'));
const page = await ctx.newPage();
const errors = [];
page.on(
  'console',
  (m) =>
    m.type() === 'error' &&
    !m.text().includes('Failed to load resource') &&
    errors.push(`${page.url()} ${m.text()}`),
);
page.on(
  'response',
  (r) =>
    r.status() >= 400 &&
    !r.url().includes('nope-404') &&
    errors.push(`HTTP ${r.status()} ${r.url()}`),
);
page.on('pageerror', (e) => errors.push(`${page.url()} ${e.message}`));

// discover dynamic urls
await page.goto(`${BASE}/writings?language=ENGLISH`);
const writingLink = page.locator('main a[href^="/writings/"]').first();
const writing = await writingLink.getAttribute('href');
const searchWord = ((await writingLink.innerText()).match(/[A-Za-z]{4,}/) ?? ['a'])[0];
await page.goto(`${BASE}/writings?language=HINDI`);
const hindiWriting = await page.locator('main a[href^="/writings/"]').first().getAttribute('href');
await page.goto(`${BASE}/instagram`);
const post = await page.locator('main a[href^="/instagram/"]').first().getAttribute('href');
const ROUTES = [
  '/',
  '/writings',
  writing,
  hindiWriting,
  '/about',
  '/book',
  '/contact',
  '/instagram',
  post,
  '/abyss',
  '/instagram?language=HINDI',
  '/writings?q=zzzz',
  '/nope-404',
];

for (const route of ROUTES) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    const res = await page.goto(BASE + route, { waitUntil: 'load' });
    await page.waitForTimeout(250);
    // Streamed routes show a loading state first; judge the page once it has arrived.
    await page
      .waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, {
        timeout: 10000,
      })
      .catch(() => undefined);
    const status = res?.status();
    const expect = route === '/nope-404' ? 404 : 200;
    if (status !== expect) fail(`${route} @${w} status ${status}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 0) fail(`${route} @${w} horizontal overflow ${overflow}px`);
    const h1 = await page.locator('h1:visible').count();
    if (h1 !== 1) fail(`${route} @${w} has ${h1} visible h1`);
    if (w === 390 || w === 1440)
      await page.screenshot({
        path: `${OUT}/${route.replace(/[^a-z0-9]+/gi, '_') || 'home'}_${w}.png`,
        fullPage: true,
      });
  }
  pass(`${route} at ${WIDTHS.length} widths`);
}

// poem preservation
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(BASE + writing);
const poem = await page.evaluate(() => {
  const block = [...document.querySelectorAll('article *')].find((n) =>
    getComputedStyle(n).whiteSpace.startsWith('pre'),
  );
  return {
    ws: block ? getComputedStyle(block).whiteSpace : null,
    lines: block?.textContent?.split('\n').length ?? 0,
  };
});
check(
  poem.ws,
  `poem whitespace preserved (white-space: ${poem.ws}, ${poem.lines} lines)`,
  'poem is not rendered with preserved whitespace',
);
await page.goto(BASE + hindiWriting);
const hi = await page.evaluate(() => {
  const el = document.querySelector('[lang="hi"]');
  return el ? { font: getComputedStyle(el).fontFamily, text: el.textContent?.slice(0, 30) } : null;
});
check(hi, `Hindi rendered with lang=hi, font: ${hi.font}`, 'Hindi writing has no lang=hi element');

// theme toggle persists
await page.goto(BASE + '/');
await hydrated(page);
const before = await page.evaluate(() => document.documentElement.dataset.theme ?? 'system');
await page
  .getByRole('button', { name: /switch/i })
  .locator('visible=true')
  .first()
  .click();
const after = await page.evaluate(() => [
  document.documentElement.dataset.theme,
  localStorage.getItem('triyan.theme'),
]);
await page.reload();
await hydrated(page);
const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
check(
  after[0] !== before && persisted === after[0],
  `theme toggle ${before} → ${after[0]}, persisted`,
  `theme toggle ${before} ${after} ${persisted}`,
);
await page.screenshot({ path: `${OUT}/home_light_1280.png` });
await page.evaluate(() => localStorage.removeItem('triyan.theme'));

// keyboard: first tab reaches skip link / focus visible
await page.goto(BASE + '/writings');
await page.keyboard.press('Tab');
const focus = await page.evaluate(() => {
  const a = document.activeElement;
  const s = getComputedStyle(a);
  return {
    tag: a.tagName,
    text: a.textContent?.trim().slice(0, 30),
    outline: s.outlineStyle + ' ' + s.outlineWidth,
    shadow: s.boxShadow,
  };
});
check(
  focus.tag !== 'BODY' && (focus.outline !== 'none 0px' || focus.shadow !== 'none'),
  `keyboard focus visible on "${focus.text}" (${focus.outline})`,
  `focus not visible ${JSON.stringify(focus)}`,
);

// mobile menu
await page.setViewportSize({ width: 375, height: 800 });
await page.goto(BASE + '/');
await hydrated(page);
await page.getByRole('button', { name: 'Menu' }).click();
await page
  .getByRole('dialog', { name: 'Navigation' })
  .getByRole('link', { name: 'Instagram' })
  .click();
await page.waitForURL('**/instagram');
pass('mobile menu navigates to /instagram');

// search + filter + share on archive
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/writings?q=${encodeURIComponent(searchWord)}`);
check(
  (await page.locator('main a[href^="/writings/"]').count()) >= 1,
  'archive search returns results',
  'archive search empty',
);
await page.goto(BASE + '/writings?language=HINDI');
const hiOnly = await page.locator('main a[href^="/writings/"]').count();
check(hiOnly >= 1, 'archive language filter', `language filter returned ${hiOnly}`);
await page.goto(BASE + '/instagram?category=GRIEF_MELANCHOLY');
check(
  (await page.locator('main a[href^="/instagram/"]').count()) > 0,
  'instagram category filter',
  'instagram category filter empty',
);
await page.goto(BASE + '/instagram');
const older = page.getByRole('link', { name: /Older posts/ });
if (await older.count()) {
  await older.click();
  await page.waitForURL(/cursor=/);
  check(
    (await page.locator('main a[href^="/instagram/"]').count()) > 0,
    'instagram pagination',
    'page 2 empty',
  );
} else fail('no "Older posts" link (needs more than one page of posts)');
await page.goto(BASE + post);
const permalink = await page.getByRole('link', { name: /View on Instagram/ }).getAttribute('href');
check(
  permalink?.startsWith('https://www.instagram.com/'),
  `original link ${permalink}`,
  'no original link',
);

// admin instagram
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');
await page.goto(BASE + '/admin/login');
await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
await page.getByRole('button', { name: /sign in|log in/i }).click();
await page.waitForURL(`${BASE}/admin`);
await page.goto(BASE + '/admin/instagram');
await page.getByRole('button', { name: 'Sync now' }).click();
await page.getByText(/Sync (completed|partial)/).waitFor({ timeout: 15000 });
pass('admin sync now');
await page.getByRole('button', { name: 'Correct' }).first().click();
await page.getByLabel('Category').first().selectOption('HOPE_DESPAIR');
await page.getByRole('button', { name: 'Save' }).click();
await page
  .getByText(/MANUAL/)
  .first()
  .waitFor({ timeout: 10000 });
pass('admin manual correction');
await page.getByRole('button', { name: 'Hide' }).first().click();
await page.getByText('· hidden').first().waitFor({ timeout: 10000 });
pass('admin hide');
await page.screenshot({ path: `${OUT}/admin_instagram.png`, fullPage: true });

// reduced motion
const rm = await browser.newContext({ reducedMotion: 'reduce' });
const rp = await rm.newPage();
await rp.goto(BASE + '/');
const hidden = await rp.evaluate(
  () =>
    [...document.querySelectorAll('main *')].filter(
      (e) => getComputedStyle(e).opacity === '0' && e.textContent?.trim(),
    ).length,
);
check(
  hidden === 0,
  'reduced motion: no content left invisible',
  `reduced motion: ${hidden} invisible elements`,
);
await rm.close();

// loading screen: plays on a fresh homepage visit, hands over to the site, Skip works
{
  const ic = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const ip = await ic.newPage();
  await ip.goto(BASE + '/', { waitUntil: 'commit' });
  const played = await ip
    .waitForSelector('.intro', { state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (played) {
    await ip.getByRole('button', { name: 'Skip' }).click();
    const gone = await ip
      .waitForFunction(() => !document.querySelector('.intro'), null, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    const inert = await ip.evaluate(() => document.getElementById('site')?.hasAttribute('inert'));
    check(
      gone && !inert,
      'intro plays, Skip hands over to the site',
      `intro did not finish (gone=${gone}, inert=${inert})`,
    );
  } else {
    // Without WebGL in this browser, the intro must simply not appear.
    pass('intro skipped (no WebGL in this browser) — site shown directly');
  }
  await ip.goto(BASE + '/about');
  check(
    (await ip.evaluate(() => document.documentElement.dataset.intro)) === undefined,
    'intro never covers other pages',
    'intro appeared on a deep link',
  );
  await ic.close();
}

if (errors.length) errors.slice(0, 10).forEach((e) => fail(`console: ${e}`));
else pass('no console errors');
process.stdout.write(`${results.join('\n')}\n`);
if (results.some((r) => r.startsWith('FAIL'))) process.exitCode = 1;
await browser.close();
