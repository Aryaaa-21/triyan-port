/**
 * Placeholder. Phase 3 installs the real shell (navigation, theme, cursor) and
 * Phase 5 builds the editorial homepage. This exists so Phase 1 has something
 * that builds, renders and is testable.
 */
export default function HomePage() {
  return (
    <main id="main" style={{ padding: '4rem 1.5rem', maxWidth: '42rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.3em' }}>TRIYAN</h1>
      <p style={{ color: '#8a8a8f', marginTop: '1.5rem', lineHeight: 1.7 }}>
        Phase 1 — foundations in place. See <code>docs/ROADMAP.md</code>.
      </p>
    </main>
  );
}
