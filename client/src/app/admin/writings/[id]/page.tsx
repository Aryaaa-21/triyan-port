import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { WritingDto } from '@triyan/shared';
import { adminFetch } from '@/features/admin/server';
import { WritingEditor } from '@/features/admin/writing-editor';

export const dynamic = 'force-dynamic';

export default async function EditWritingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, data } = await adminFetch<WritingDto>(`/admin/writings/${id}`);

  if (status === 401) redirect('/admin/login');
  if (!data) notFound();

  return (
    <main id="main" className="gutter mx-auto max-w-6xl py-12">
      <Link
        href="/admin"
        className="font-ui text-2xs tracking-widest text-fg-subtle uppercase no-underline hover:text-fg"
      >
        ← All writings
      </Link>
      <h1 className="mt-6 mb-2 font-display text-3xl font-light tracking-tight">{data.title}</h1>
      <p className="mb-10 font-ui text-2xs tracking-widest text-fg-subtle uppercase">
        {data.status === 'PUBLISHED' ? 'Published' : 'Draft'}
      </p>
      <WritingEditor existing={data} />
    </main>
  );
}
