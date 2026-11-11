import { Outlet } from 'react-router';
import { Meta } from '@/lib/meta';

/**
 * The admin shell. Function over form, per the brief: no 3D, no cursor, no motion.
 * Never indexed.
 */
export default function AdminLayout() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Meta title="Admin" noindex nofollow />
      <Outlet />
    </div>
  );
}
