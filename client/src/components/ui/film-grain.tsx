/**
 * Film grain for the black-and-white scenes: tiled noise, overlay-blended, so black
 * stays black and the texture lives in the light. It shifts in steps like film, and
 * holds still under reduced motion (see .film-grain in globals.css). Fills its
 * positioned parent; purely decorative.
 */
export function FilmGrain() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="film-grain absolute" />
    </div>
  );
}
