import { useEffect, useState } from 'react';
import Link from '@/lib/link';
import { cn } from '@/lib/cn';

const pill =
  'flex h-11 items-center justify-center border border-border-strong bg-bg/85 font-mono text-2xs tracking-[0.18em] text-fg uppercase no-underline backdrop-blur transition-colors duration-500 hover:border-fg hover:bg-fg hover:text-bg';

/**
 * Two quiet controls in the bottom corner: a way to write to Triyan from anywhere, and,
 * once the reader is well down a page, a way back to its top.
 */
export function FloatingActions({ pathname }: { pathname: string }) {
  const [deep, setDeep] = useState(false);

  useEffect(() => {
    const check = () => setDeep(window.scrollY > window.innerHeight * 0.9);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  const toTop = () => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  };

  return (
    <div className="floating-actions fixed right-4 bottom-4 z-(--z-sticky) flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
      <button
        type="button"
        onClick={toTop}
        aria-label="Back to top"
        tabIndex={deep ? 0 : -1}
        className={cn(
          pill,
          'w-11 transition-[opacity,translate,background-color,color,border-color]',
          deep ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <span aria-hidden="true">↑</span>
      </button>
      {/* Not on the contact page itself, and not over the ABYSS door. */}
      {pathname !== '/contact' && pathname !== '/abyss' && (
        <Link href="/contact" className={cn(pill, 'px-4')}>
          Write to Triyan
        </Link>
      )}
    </div>
  );
}
