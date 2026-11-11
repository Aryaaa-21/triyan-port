import { Typewriter } from '@/components/motion/typewriter';

/**
 * The statement before the archive opens: typed out as it comes into view, with room
 * above and below so it reads as a pause between chapters.
 */
export function ArchiveStatement({ statement }: { statement: string }) {
  return (
    <section aria-label="An archive" className="gutter border-t border-border">
      <div className="mx-auto max-w-[90rem] py-32 sm:py-40 lg:py-56">
        <Typewriter
          className="mx-auto max-w-4xl text-center font-display text-[clamp(2rem,4.6vw,4rem)] leading-[1.12] font-light tracking-tight text-fg"
          segments={[
            { text: statement },
            {
              text: ' Poetry on love and its absence, on grief, mortality and existence.',
              className: 'mt-6 block text-[0.55em] leading-snug text-fg-muted italic sm:mt-8',
            },
          ]}
        />
      </div>
    </section>
  );
}
