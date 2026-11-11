import { useRouter } from '@/lib/navigation';
import { useState } from 'react';
import {
  CATEGORIES,
  EMOTION_KEYS,
  LANGUAGE_KEYS,
  THEME_KEYS,
  humanizeKey,
  type WritingDto,
} from '@triyan/shared';
import { adminApi, AdminError } from '@/features/admin/client';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Prose } from '@/components/ui/prose';

/**
 * The writing editor.
 *
 * Content is a plain textarea, deliberately. A rich-text editor normalises
 * whitespace, collapses blank lines and "helpfully" fixes punctuation — all of which
 * destroys a poem. Here the text the author types is exactly the text that is stored,
 * and the preview renders it with the real reading typography so what they see is
 * what a reader gets.
 */
export function WritingEditor({ existing }: { existing?: WritingDto }) {
  const router = useRouter();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [excerpt, setExcerpt] = useState(existing?.excerpt ?? '');
  const [language, setLanguage] = useState(existing?.language ?? 'UNKNOWN');
  const [primaryCategory, setPrimaryCategory] = useState(existing?.primaryCategory ?? '');
  const [themes, setThemes] = useState<string[]>(existing?.themes ?? []);
  const [emotions, setEmotions] = useState<string[]>(existing?.emotions ?? []);
  const [tags, setTags] = useState((existing?.tags ?? []).join(', '));
  const [featured, setFeatured] = useState(existing?.featured ?? false);
  const [seoTitle, setSeoTitle] = useState(existing?.seo?.title ?? '');
  const [seoDescription, setSeoDescription] = useState(existing?.seo?.description ?? '');

  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const toggle = (list: string[], set: (next: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const payload = () => ({
    title,
    content,
    language,
    ...(slug ? { slug } : {}),
    ...(excerpt ? { excerpt } : {}),
    ...(primaryCategory ? { primaryCategory } : {}),
    themes,
    emotions,
    tags: tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    featured,
    seo: {
      noindex: existing?.seo?.noindex ?? false,
      ...(seoTitle ? { title: seoTitle } : {}),
      ...(seoDescription ? { description: seoDescription } : {}),
    },
  });

  const save = async (then?: 'publish') => {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      const result = existing
        ? await adminApi.updateWriting(existing._id, payload())
        : await adminApi.createWriting(payload());

      const id = result.data?._id ?? existing?._id;
      if (then === 'publish' && id) await adminApi.publish(id);

      setSaved(then === 'publish' ? 'Published' : 'Draft saved');

      if (!existing && id) router.replace(`/admin/writings/${id}`);
      else router.refresh();
    } catch (cause) {
      setError(cause instanceof AdminError ? cause.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    if (!confirm(`Delete “${existing.title}”? This cannot be undone.`)) return;
    try {
      await adminApi.remove(existing._id);
      router.replace('/admin');
    } catch (cause) {
      setError(cause instanceof AdminError ? cause.message : 'Could not delete');
    }
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-6">
        <TextField
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="content"
              className="font-ui text-2xs tracking-widest text-fg-muted uppercase"
            >
              The writing
            </label>
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="font-ui text-2xs tracking-widest text-fg-subtle uppercase hover:text-fg"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {preview ? (
            <div className="min-h-[24rem] border border-border bg-bg-raised p-6">
              <Prose language={language} variant="poem">
                {content || 'Nothing to preview yet.'}
              </Prose>
            </div>
          ) : (
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              spellCheck={false}
              // A monospace, non-wrapping field makes line breaks and indentation
              // visible as the author types them.
              className="w-full resize-y border border-border bg-bg-raised p-6 font-reading text-lg leading-poem whitespace-pre-wrap text-fg focus:border-focus focus:outline-none"
            />
          )}
          <p className="font-ui text-2xs text-fg-subtle">
            Line breaks and blank lines are preserved exactly as typed.
          </p>
        </div>

        <TextField
          label="Excerpt"
          hint="Leave empty to derive one from the opening lines."
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />

        {error && (
          <p role="alert" className="font-ui text-xs text-ember">
            {error}
          </p>
        )}
        {saved && <p className="font-ui text-xs text-accent">{saved}</p>}

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save draft'}
          </Button>
          {existing?.status !== 'PUBLISHED' && (
            <Button variant="solid" disabled={busy} onClick={() => void save('publish')}>
              Publish
            </Button>
          )}
          {existing?.status === 'PUBLISHED' && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void adminApi.unpublish(existing._id).then(() => router.refresh())}
            >
              Unpublish
            </Button>
          )}
          {existing && (
            <Button variant="ghost" disabled={busy} onClick={() => void remove()}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <Select
          label="Language"
          value={language}
          onChange={(v) => setLanguage(v as typeof language)}
          options={LANGUAGE_KEYS.map((l) => ({ value: l, label: humanizeKey(l.toLowerCase()) }))}
        />

        <Select
          label="Category"
          value={primaryCategory}
          onChange={setPrimaryCategory}
          options={[
            { value: '', label: '— none —' },
            ...CATEGORIES.map((c) => ({ value: c.key, label: c.label })),
          ]}
        />

        <CheckGroup
          legend="Themes"
          values={themes}
          all={[...THEME_KEYS]}
          onToggle={(v) => toggle(themes, setThemes, v)}
        />
        <CheckGroup
          legend="Emotions"
          values={emotions}
          all={[...EMOTION_KEYS]}
          onToggle={(v) => toggle(emotions, setEmotions, v)}
        />

        <TextField
          label="Tags"
          hint="Comma separated"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <TextField
          label="Slug"
          hint={
            existing ? 'Changing this breaks existing links.' : 'Derived from the title if empty.'
          }
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <label className="flex items-center gap-3 font-ui text-xs text-fg-muted">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Featured
        </label>

        <TextField
          label="SEO title"
          hint={`${seoTitle.length}/70`}
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
        />
        <TextField
          label="SEO description"
          hint={`${seoDescription.length}/180`}
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
        />
      </aside>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-ui text-2xs tracking-widest text-fg-muted uppercase">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-sm border border-border bg-bg-raised px-3 py-2.5 font-ui text-sm text-fg focus:border-focus focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckGroup({
  legend,
  values,
  all,
  onToggle,
}: {
  legend: string;
  values: string[];
  all: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-ui text-2xs tracking-widest text-fg-muted uppercase">{legend}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {all.map((key) => {
          const active = values.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(key)}
              className={`rounded-full border px-3 py-1 font-ui text-2xs ${
                active
                  ? 'border-fg bg-fg text-bg'
                  : 'border-border text-fg-subtle hover:border-border-strong hover:text-fg'
              }`}
            >
              {humanizeKey(key)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
