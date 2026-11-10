'use client';

import { useRouter } from 'next/navigation';
import { adminApi } from '@/features/admin/client';

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() =>
        void adminApi.logout().finally(() => {
          router.replace('/admin/login');
          router.refresh();
        })
      }
      className="font-ui text-2xs tracking-widest text-fg-subtle uppercase hover:text-fg"
    >
      Sign out
    </button>
  );
}
