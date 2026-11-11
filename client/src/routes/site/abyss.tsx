import { fetchAbyssSafely } from '@/features/content/api';
import { wordmark } from '@/lib/wordmark';
import { SplitText } from '@/components/motion/split-text';
import { Reveal } from '@/components/ui/reveal';
import { ShirtSilhouette } from '@/features/abyss/silhouette';
import { Waitlist } from '@/features/abyss/waitlist';
import WindStreamCursor from '@/components/ui/wind-stream-cursor';
import { FilmGrain } from '@/components/ui/film-grain';
import { BlackHoleBackground } from '@/features/blackhole/background';
import { ABYSS_DIFFERENT, ABYSS_FEELING, ABYSS_FOR, ABYSS_WHY, VENTURES } from '@/content/triyan';
import { useLoaderData } from 'react-router';
import { Meta } from '@/lib/meta';

const mono = 'font-abyss-ui text-2xs tracking-[0.35em] uppercase text-white/50';

/**
 * ABYSS: the next universe. Always night, whichever world the rest of the site is
 * in — a doorway, not another page of the archive. It is introduced, not sold:
 * no products, prices or cart exist, so none are shown.
 */
export const loader = () => fetchAbyssSafely();

export default function AbyssPage() {
  const abyss = useLoaderData<typeof loader>();
  const name = abyss?.name || 'ABYSS';
  const philosophy = abyss?.philosophy || 'because once you enter the abyss you cannot leave.';

  return (
    <main id="main" className="abyss-door -mt-px overflow-x-clip bg-black text-white">
      <Meta
        title="ABYSS"
        description="ABYSS — soul is deeper than the abyss. A creative identity by Triyan."
        canonical="/abyss"
        ogTitle="ABYSS — Triyan"
        ogDescription="soul is deeper than the abyss"
      />
      {/* ------------------------------------------------------------ mark */}
      <section className="gutter relative isolate flex min-h-[92svh] flex-col justify-end pb-20">
        <WindStreamCursor />
        {/* The black hole behind the mark: a living background, above the name. */}
        <BlackHoleBackground radius={0.2} offset={[0, 0.4]} />
        <FilmGrain />
        <div className="relative mx-auto w-full max-w-[90rem]">
          <h1 className="font-abyss pb-[1.1em] pl-[0.18em] text-[clamp(3.5rem,12vw,10.5rem)] leading-[1.15] font-normal whitespace-nowrap">
            <SplitText text={wordmark(name)} step={90} />
          </h1>
          {abyss?.tagline && (
            <p className="mt-6 max-w-3xl font-display text-[clamp(1.5rem,3.4vw,3rem)] leading-tight font-light text-white/80 italic">
              {abyss.tagline}
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------- manifesto */}
      <section aria-labelledby="manifesto" className="gutter border-t border-white/10">
        <div className="mx-auto grid max-w-[90rem] gap-12 py-32 lg:grid-cols-12 lg:gap-8 lg:py-48">
          <h2 id="manifesto" className={`${mono} lg:col-span-3`}>
            Manifesto
          </h2>
          <Reveal variant="blur" className="lg:col-span-9">
            <p className="font-display text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.98] font-light tracking-tight">
              {philosophy.split(' the abyss ').length === 2 ? (
                <>
                  {philosophy.split(' the abyss ')[0]}
                  <br />
                  <span className="pl-[1.5em] font-abyss font-normal">the abyss</span>
                  <br />
                  <span className="text-white/60 italic">{philosophy.split(' the abyss ')[1]}</span>
                </>
              ) : (
                philosophy
              )}
            </p>
          </Reveal>
          {abyss?.direction && (
            <p className="max-w-xl font-reading text-xl leading-prose text-white/65 lg:col-span-6 lg:col-start-4">
              {abyss.direction}
            </p>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------- clothing */}
      <section aria-labelledby="clothing" className="gutter border-t border-white/10">
        <div className="mx-auto max-w-[90rem] py-32 lg:py-48">
          <div className="grid gap-16 lg:grid-cols-12 lg:items-center lg:gap-8">
            <div className="lg:col-span-6">
              <Reveal variant="clip">
                <figure className="relative bg-white/[0.03] p-8 sm:p-14">
                  <ShirtSilhouette className="mx-auto w-full max-w-md" />
                  <figcaption className={`${mono} mt-8 flex justify-between`}>
                    <span>Silhouette study</span>
                    <span>Not a product photograph</span>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <h2 id="clothing" className={mono}>
                Clothing
              </h2>
              <p className="mt-8 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] font-light tracking-tight">
                Oversized
                <br />
                <span className="font-abyss font-normal">gothic</span> shirts
              </p>
              <dl className="mt-14 grid grid-cols-[8rem_1fr] gap-y-5 border-t border-white/10 pt-8">
                <dt className={mono}>Collection</dt>
                <dd className="font-reading text-lg text-white/75">The first — not yet released</dd>
                <dt className={mono}>Next</dt>
                <dd className="font-reading text-lg text-white/75">To come</dd>
                <dt className={mono}>Available</dt>
                <dd className="font-reading text-lg text-white/75">
                  {abyss?.comingSoonNote || 'Nothing is for sale yet.'}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- why */}
      <section aria-labelledby="why-abyss" className="gutter border-t border-white/10">
        <div className="mx-auto grid max-w-[90rem] gap-12 py-32 lg:grid-cols-12 lg:gap-8 lg:py-40">
          <h2 id="why-abyss" className={`${mono} lg:col-span-3`}>
            Why ABYSS
          </h2>
          <div className="lg:col-span-8">
            <Reveal variant="blur">
              <p className="font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-tight font-light text-white/90">
                {ABYSS_WHY}
              </p>
            </Reveal>
            <p className="mt-10 max-w-2xl font-reading text-xl leading-prose text-white/65">
              {ABYSS_DIFFERENT}
            </p>
            <dl className="mt-16 grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2">
              <div>
                <dt className={mono}>For</dt>
                <dd className="mt-4 font-reading text-lg leading-prose text-white/75">
                  {ABYSS_FOR}
                </dd>
              </div>
              <div>
                <dt className={mono}>The feeling</dt>
                <dd className="mt-4 font-reading text-lg leading-prose text-white/75">
                  {ABYSS_FEELING}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- ventures */}
      <section aria-labelledby="beyond" className="gutter border-t border-white/10">
        <div className="mx-auto grid max-w-[90rem] gap-12 py-32 lg:grid-cols-12 lg:gap-8">
          <h2 id="beyond" className={`${mono} lg:col-span-3`}>
            Beyond clothing
          </h2>
          <div className="lg:col-span-8">
            <p className="max-w-3xl font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-tight font-light text-white/80">
              Multiple creative ventures under one larger identity.
            </p>
            <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-4">
              {VENTURES.map((v) => (
                <li
                  key={v}
                  className="font-abyss-ui text-sm tracking-[0.3em] text-white/60 uppercase"
                >
                  {v}
                </li>
              ))}
              <li className="font-abyss-ui text-sm tracking-[0.3em] text-white/35 uppercase">
                and other artistic projects
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- waitlist */}
      <section aria-label="Waitlist" className="gutter border-t border-white/10">
        <div className="mx-auto max-w-[90rem] py-32 lg:py-48">
          <Waitlist />
        </div>
      </section>
    </main>
  );
}
