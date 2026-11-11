import Link from '@/lib/link';
import { redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import type { WritingDto } from '@triyan/shared';
import { adminFetch } from '@/features/admin/fetch';
import { WritingEditor } from '@/features/admin/writing-editor';

export async function loader({ params }: LoaderFunctionArgs) {
  const { status, data } = await adminFetch<WritingDto>(`/admin/writings/${params.id ?? ''}`);
  if (status === 401) throw redirect('/admin/login');
  if (!data) throw new Response('Not found', { status: 404 });
  return data;
}

export default function EditWritingPage() {
  const data = useLoaderData<typeof loader>();

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
