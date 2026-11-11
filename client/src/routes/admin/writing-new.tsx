import Link from '@/lib/link';
import { WritingEditor } from '@/features/admin/writing-editor';

export default function NewWritingPage() {
  return (
    <main id="main" className="gutter mx-auto max-w-6xl py-12">
      <Link
        href="/admin"
        className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
      >
        ← All writings
      </Link>
      <h1 className="mt-6 mb-10 font-display text-3xl font-light tracking-tight">New writing</h1>
      <WritingEditor />
    </main>
  );
}
