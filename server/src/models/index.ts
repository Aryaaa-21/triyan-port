/**
 * The models that exist today, and why.
 *
 * Six models, not sixteen. Each one is required by a workflow that is being built
 * now; the rest are documented in `docs/MODELS.md` and will arrive with the phase
 * that needs them, rather than being created early to make a count look complete.
 */
export { Writing } from './writing.model.js';
export type { WritingAttrs, WritingDoc, WritingModel } from './writing.model.js';

export { User } from './user.model.js';
export type { UserAttrs, UserDoc } from './user.model.js';

export { Session } from './session.model.js';
export type { SessionAttrs } from './session.model.js';

export { Book } from './book.model.js';
export type { BookAttrs } from './book.model.js';

export { About } from './about.model.js';
export type { AboutAttrs } from './about.model.js';

export { Abyss } from './abyss.model.js';
export type { AbyssAttrs } from './abyss.model.js';

export { SiteSettings } from './siteSettings.model.js';
export type { SiteSettingsAttrs } from './siteSettings.model.js';

export { InstagramMedia } from './instagramMedia.model.js';
export type { InstagramMediaAttrs, InstagramMediaDoc } from './instagramMedia.model.js';

export { InstagramSyncState } from './instagramSyncState.model.js';
export type { InstagramSyncStateAttrs } from './instagramSyncState.model.js';

export { ContactMessage } from './contactMessage.model.js';
export type { ContactMessageAttrs } from './contactMessage.model.js';

export { Subscriber } from './subscriber.model.js';
export type { SubscriberAttrs } from './subscriber.model.js';

export { WaitlistSubscriber } from './waitlistSubscriber.model.js';
export type { WaitlistSubscriberAttrs } from './waitlistSubscriber.model.js';
