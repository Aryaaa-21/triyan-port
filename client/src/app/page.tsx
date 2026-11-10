import { Prose } from '@/components/ui/prose';
import { Rule } from '@/components/ui/rule';

/**
 * Placeholder. Phase 3 installs the real shell (navigation, theme toggle, cursor)
 * and Phase 5 builds the editorial homepage. This renders enough of the design
 * system to verify it end to end.
 */
export default function HomePage() {
  return (
    <main id="main" className="gutter section-gap mx-auto measure-prose">
      <p className="font-ui text-2xs tracking-widest text-fg-subtle uppercase">Phase 2</p>
      <h1 className="mt-6 font-display text-display font-light tracking-tighter">Triyan</h1>
      <Rule className="my-10" />
      <Prose>
        <p>
          The design system is in place: two environments, five type roles, and a token layer that
          fails the build if any pair stops being legible.
        </p>
        <p className="text-fg-muted">
          See <code className="font-ui text-sm">docs/ROADMAP.md</code> for what comes next.
        </p>
      </Prose>
    </main>
  );
}
