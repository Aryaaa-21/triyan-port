import Image from 'next/image';
import type { CategoryKey } from '@triyan/shared';
import { cn } from '@/lib/cn';
import { CategoryArt } from './category-art';

/**
 * A category's image in a frame. Uses a real photograph when one is supplied
 * (`src`), and the generated artwork otherwise. Reveals and hovers are handled by
 * the parent; this only paints.
 */
export function CategoryPlate({
  category,
  src,
  alt = '',
  className,
  sizes = '(min-width: 1024px) 25vw, 50vw',
}: {
  category: CategoryKey;
  src?: string | undefined;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={cn('category-plate relative overflow-hidden bg-surface', className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover grayscale" />
      ) : (
        <CategoryArt category={category} className="absolute inset-0" />
      )}
    </div>
  );
}
