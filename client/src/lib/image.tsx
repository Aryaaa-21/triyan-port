import type { CSSProperties, ImgHTMLAttributes } from 'react';

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src: string;
  alt: string;
  /** Cover the nearest positioned parent. */
  fill?: boolean;
  /** Above the fold: load eagerly, at high priority. Everything else loads lazily. */
  priority?: boolean;
  /** Accepted for compatibility; images are served as they are. */
  unoptimized?: boolean;
  quality?: number;
};

const FILL: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

/** An image, lazy by default; `fill` and `priority` as the layouts use them. */
export function Image({
  fill,
  priority,
  style,
  unoptimized: _unoptimized,
  quality: _quality,
  ...rest
}: ImageProps) {
  return (
    <img
      {...rest}
      style={fill ? { ...FILL, ...style } : style}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
}

export default Image;
