/**
 * Re-mounts on every navigation, which is what gives each page its entrance.
 * The transition is CSS-only and disappears under reduced motion.
 */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
