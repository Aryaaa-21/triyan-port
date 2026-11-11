import Link from 'next/link';
import { getCategory, type WritingDto } from '@triyan/shared';

const LANGUAGE_LABEL: Record<string, string> = {
  ENGLISH: 'English',
  HINDI: 'Hindi',
  HINGLISH: 'Hinglish',
  UNKNOWN: '',
};

/**
 * One entry in the archive. On a wide screen it is a ruled row — number, title,
 * category, language, year — that comes alive under the pointer. On a phone it
 * becomes a compact block with a full-width touch target.
 */
export function WritingRow({ writing, index }: { writing: WritingDto; index: number }) {
  const category = writing.primaryCategory ? getCategory(writing.primaryCategory) : null;
  const year = writing.publishedAt ? new Date(writing.publishedAt).getFullYear() : null;
  const language = LANGUAGE_LABEL[writing.language] ?? '';
  const hindi = writing.language === 'HINDI';

  return (
    <Link
      href={`/writings/${writing.slug}`}
      data-cursor="writing"
      className="archive-row group grid grid-cols-[2.5rem_1fr_auto] gap-x-4 gap-y-2 border-b border-border py-8 no-underline md:grid-cols-[4rem_minmax(0,1fr)_12rem_6rem_4rem_1.5rem] md:items-baseline md:gap-x-6 md:py-10"
    >
      <span className="font-mono text-2xs text-fg-subtle tabular-nums md:text-xs">
        {String(index).padStart(2, '0')}
      </span>

      <span className="min-w-0">
        <span
          lang={hindi ? 'hi' : undefined}
          className="block font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.08] font-light tracking-tight text-fg-muted transition-[color,translate] duration-700 ease-void group-hover:translate-x-2 group-hover:text-fg group-focus-visible:text-fg"
        >
          {writing.title}
        </span>
        {/* Mobile: metadata sits under the title. */}
        <span className="mt-3 block font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase md:hidden">
          {[category?.label, language, year].filter(Boolean).join(' · ')}
        </span>
        {writing.excerpt && (
          <span className="archive-excerpt mt-3 block max-w-xl font-reading text-base leading-prose text-fg-subtle">
            {writing.excerpt}
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className="self-start pt-2 font-mono text-sm text-fg-subtle md:hidden"
      >
        →
      </span>

      <span className="hidden font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase md:block">
        {category?.label}
      </span>
      <span className="hidden font-mono text-2xs tracking-[0.18em] text-fg-subtle uppercase md:block">
        {language}
      </span>
      <span className="hidden font-mono text-2xs text-fg-subtle tabular-nums md:block">{year}</span>
      <span
        aria-hidden="true"
        className="hidden font-mono text-sm text-fg-subtle opacity-0 transition-[opacity,translate] duration-500 group-hover:translate-x-1 group-hover:opacity-100 md:block"
      >
        →
      </span>
    </Link>
  );
}
