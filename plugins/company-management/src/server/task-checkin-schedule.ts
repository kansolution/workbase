import { isCheckinDueToday, isoWeekRangeOf, toLocalDateString, type RecurringTaskLike } from './task-checkin-logic';

/**
 * Minimal surface of `Plugin`/`Database` actually used here, so this file has
 * no hard dependency on `@nocobase/server` being installed yet (the plugin
 * skeleton itself is still scaffolded later via the NocoBase CLI — see
 * ../../README.md). Swap these for the real types once the skeleton exists.
 */
interface RepositoryLike {
  find(options: Record<string, unknown>): Promise<Array<Record<string, unknown>>>;
  count(options: Record<string, unknown>): Promise<number>;
  create(options: { values: Record<string, unknown> }): Promise<{ id: number | string }>;
}

interface PluginLike {
  db: { getRepository(name: string): RepositoryLike };
  app: {
    resourcer: { registerActionHandler(name: string, handler: (ctx: any, next: () => Promise<void>) => Promise<void>): void };
    logger: { info(message: string, meta?: unknown): void; error(message: string, meta?: unknown): void };
  };
}

const STATUSES_NOT_ACTIVE = ['Hoàn thành', 'Đang dừng'];

/**
 * For every `tasks` record with `task_type = 'Định kỳ'` that isn't finished
 * or paused, decides (via `isCheckinDueToday`) whether it needs a new
 * `task_checkins` record for today, and creates it if so. Idempotent per
 * task/day because it always re-counts existing checkins first.
 */
export async function generateTaskCheckinsForToday(plugin: PluginLike, today: Date = new Date()): Promise<void> {
  const tasksRepo = plugin.db.getRepository('tasks');
  const checkinsRepo = plugin.db.getRepository('task_checkins');

  const todayStr = toLocalDateString(today);
  const { start, end } = isoWeekRangeOf(today);
  const weekStartStr = toLocalDateString(start);
  const weekEndStr = toLocalDateString(end);

  const activeRecurringTasks = (await tasksRepo.find({
    filter: {
      task_type: 'Định kỳ',
      status: { $notIn: STATUSES_NOT_ACTIVE },
    },
  })) as unknown as RecurringTaskLike[];

  let createdCount = 0;
  for (const task of activeRecurringTasks) {
    const [todayCount, weekCount] = await Promise.all([
      checkinsRepo.count({ filter: { task: task.id, checkin_date: todayStr } }),
      checkinsRepo.count({ filter: { task: task.id, checkin_date: { $gte: weekStartStr, $lte: weekEndStr } } }),
    ]);

    if (isCheckinDueToday(task, todayCount, weekCount)) {
      await checkinsRepo.create({ values: { task: task.id, checkin_date: todayStr, status: 'Chưa làm' } });
      createdCount++;
    }
  }

  plugin.app.logger.info(
    `[company-management] task checkin generation for ${todayStr}: ${createdCount}/${activeRecurringTasks.length} tasks got a new checkin`,
  );
}

/** setTimeout's delay is a 32-bit signed int (~24.8 days max); irrelevant here (always <1 day) but kept for parity with cycle-schedule.ts. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Next local 00:05 strictly after `now`. */
function nextDailyBoundary(now: Date): Date {
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 5, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setTime(target.getTime() + ONE_DAY_MS);
  }
  return target;
}

function scheduleNextDailyBoundary(plugin: PluginLike, onBoundary: () => Promise<void>): void {
  const target = nextDailyBoundary(new Date());
  const delay = target.getTime() - Date.now();
  setTimeout(() => {
    onBoundary()
      .catch((err) => plugin.app.logger.error('[company-management] task checkin generation failed', { err }))
      .finally(() => scheduleNextDailyBoundary(plugin, onBoundary));
  }, Math.max(delay, 0));
}

/**
 * Wires the daily 00:05 "Schedule" trigger for `task_checkins` generation
 * (equivalent to a NocoBase Workflow "Schedule" trigger, implemented as plain
 * server code for the same reasons as `registerCycleAutoGeneration` in
 * cycle-schedule.ts), plus a manual `task_checkins:generateForToday` action
 * for testing. Call from the plugin's `load()`:
 *
 *   await this.importCollections(path.resolve(__dirname, '../../collections'));
 *   registerTaskCheckinAutoGeneration(this);
 *
 * Runs in the server's local timezone — make sure the `app` container's TZ
 * matches the business's timezone, or adjust `nextDailyBoundary` to use UTC
 * with an explicit offset if not.
 */
export function registerTaskCheckinAutoGeneration(plugin: PluginLike): void {
  scheduleNextDailyBoundary(plugin, () => generateTaskCheckinsForToday(plugin));

  plugin.app.resourcer.registerActionHandler('task_checkins:generateForToday', async (ctx, next) => {
    await generateTaskCheckinsForToday(plugin);
    ctx.body = { status: 'ok' };
    await next();
  });
}
