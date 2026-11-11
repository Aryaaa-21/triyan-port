import { About, Abyss, Book, SiteSettings } from '../models/index.js';

/**
 * The singleton content documents.
 *
 * Each getter creates the document on first read with schema defaults, so a fresh
 * database serves an empty-but-valid page rather than a 404. Every factual field
 * defaults to an empty string: a missing fact is rendered as absent, never invented.
 */

export const getBook = async () =>
  (await Book.findOne({ key: 'book' }).lean()) ?? (await Book.create({})).toObject();

export const getAbout = async () =>
  (await About.findOne({ key: 'about' }).lean()) ?? (await About.create({})).toObject();

export const getAbyss = async () =>
  (await Abyss.findOne({ key: 'abyss' }).lean()) ?? (await Abyss.create({})).toObject();

export const getSettings = async () =>
  (await SiteSettings.findOne({ key: 'settings' }).lean()) ??
  (await SiteSettings.create({})).toObject();

export const updateBook = async (patch: Record<string, unknown>) =>
  Book.findOneAndUpdate(
    { key: 'book' },
    { $set: patch },
    { returnDocument: 'after', upsert: true },
  ).lean();

export const updateAbout = async (patch: Record<string, unknown>) =>
  About.findOneAndUpdate(
    { key: 'about' },
    { $set: patch },
    { returnDocument: 'after', upsert: true },
  ).lean();

export const updateAbyss = async (patch: Record<string, unknown>) =>
  Abyss.findOneAndUpdate(
    { key: 'abyss' },
    { $set: patch },
    { returnDocument: 'after', upsert: true },
  ).lean();

export const updateSettings = async (patch: Record<string, unknown>) =>
  SiteSettings.findOneAndUpdate(
    { key: 'settings' },
    { $set: patch },
    { returnDocument: 'after', upsert: true },
  ).lean();
