/**
 * Reads the interval from SYNC_CRON. Only the "every N minutes" form (star-slash-N) is supported; it is
 * the only one this job needs, and a cron library would be a dependency for one line.
 */
export const intervalFromCron = (cron: string): number => {
  const match = /^\*\/(\d+) \* \* \* \*$/.exec(cron.trim());
  const minutes = match ? Number(match[1]) : 30;
  return Math.max(5, minutes) * 60_000;
};
