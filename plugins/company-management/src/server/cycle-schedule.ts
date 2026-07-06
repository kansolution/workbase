import { buildCycleRecordsForYear } from './generate-cycles';

/**
 * Minimal surface of `Plugin`/`Database` actually used here, so this file has
 * no hard dependency on `@nocobase/server` being installed yet (the plugin
 * skeleton itself is still scaffolded later via the NocoBase CLI — see
 * ../README.md). Swap these for the real types once the skeleton exists.
 */
interface RepositoryLike {
  findOne(options: Record<string, unknown>): Promise<{ id: number | string } | null>;
  create(options: { values: Record<string, unknown> }): Promise<{ id: number | string }>;
}

interface PluginLike {
  db: { getRepository(name: string): RepositoryLike };
  app: {
    resourcer: { registerActionHandler(name: string, handler: (ctx: any, next: () => Promise<void>) => Promise<void>): void };
    logger: { info(message: string, meta?: unknown): void; error(message: string, meta?: unknown): void };
  };
}

/**
 * Idempotent: does nothing if `year`'s "Năm" record already exists, so it's
 * safe to call on every app boot as a catch-up in case the server was down
 * exactly at the year boundary.
 */
export async function generateCyclesForYear(plugin: PluginLike, year: number): Promise<void> {
  const repo = plugin.db.getRepository('cycles');
  const existing = await repo.findOne({ filter: { type: 'Năm', year } });
  if (existing) {
    plugin.app.logger.info(`[company-management] cycles for ${year} already exist, skipping`);
    return;
  }

  const records = buildCycleRecordsForYear(year);
  const idByKey = new Map<string, number | string>();

  for (const record of records) {
    const { key, parentKey, ...values } = record;
    const created = await repo.create({
      values: {
        ...values,
        parentCycleId: parentKey ? idByKey.get(parentKey) : null,
      },
    });
    idByKey.set(key, created.id);
  }

  plugin.app.logger.info(`[company-management] generated ${records.length} cycle records for ${year}`);
}

/** setTimeout's delay is a 32-bit signed int (~24.8 days max); a year-long wait must be chunked. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

function scheduleAt(targetTimeMs: number, callback: () => void): void {
  const delay = targetTimeMs - Date.now();
  if (delay > MAX_TIMEOUT_MS) {
    setTimeout(() => scheduleAt(targetTimeMs, callback), MAX_TIMEOUT_MS);
  } else {
    setTimeout(callback, Math.max(delay, 0));
  }
}

function scheduleNextYearBoundary(plugin: PluginLike, onBoundary: () => Promise<void>): void {
  const now = new Date();
  const target = Date.UTC(now.getUTCFullYear() + 1, 0, 1, 0, 5, 0); // Jan 1, 00:05 UTC
  scheduleAt(target, () => {
    onBoundary()
      .catch((err) => plugin.app.logger.error('[company-management] cycle auto-generation failed', { err }))
      .finally(() => scheduleNextYearBoundary(plugin, onBoundary));
  });
}

/**
 * Wires the "start of year" schedule trigger for `cycles` generation plus a
 * manual `cycles:generate` action (for testing, or to backfill a specific
 * year from the admin UI / curl). Call from the plugin's `load()`:
 *
 *   await this.importCollections(path.resolve(__dirname, '../../collections'));
 *   registerCycleAutoGeneration(this);
 */
export function registerCycleAutoGeneration(plugin: PluginLike): void {
  const runForCurrentYear = () => generateCyclesForYear(plugin, new Date().getUTCFullYear());

  // Catch-up in case the app was offline exactly at Jan 1st.
  runForCurrentYear().catch((err) => plugin.app.logger.error('[company-management] cycle catch-up failed', { err }));
  scheduleNextYearBoundary(plugin, runForCurrentYear);

  plugin.app.resourcer.registerActionHandler('cycles:generate', async (ctx, next) => {
    const year = Number(ctx.action?.params?.values?.year) || new Date().getUTCFullYear();
    await generateCyclesForYear(plugin, year);
    ctx.body = { year, status: 'ok' };
    await next();
  });
}
