"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTaskCheckinsForToday = generateTaskCheckinsForToday;
exports.registerTaskCheckinAutoGeneration = registerTaskCheckinAutoGeneration;
const task_checkin_logic_1 = require("./task-checkin-logic");
const STATUSES_NOT_ACTIVE = ['Hoàn thành', 'Đang dừng'];
/**
 * For every `tasks` record with `task_type = 'Định kỳ'` that isn't finished
 * or paused, decides (via `isCheckinDueToday`) whether it needs a new
 * `task_checkins` record for today, and creates it if so. Idempotent per
 * task/day because it always re-counts existing checkins first.
 */
async function generateTaskCheckinsForToday(plugin, today = new Date()) {
    const tasksRepo = plugin.db.getRepository('tasks');
    const checkinsRepo = plugin.db.getRepository('task_checkins');
    const todayStr = (0, task_checkin_logic_1.toLocalDateString)(today);
    const { start, end } = (0, task_checkin_logic_1.isoWeekRangeOf)(today);
    const weekStartStr = (0, task_checkin_logic_1.toLocalDateString)(start);
    const weekEndStr = (0, task_checkin_logic_1.toLocalDateString)(end);
    const activeRecurringTasks = (await tasksRepo.find({
        filter: {
            task_type: 'Định kỳ',
            status: { $notIn: STATUSES_NOT_ACTIVE },
        },
    }));
    let createdCount = 0;
    for (const task of activeRecurringTasks) {
        const [todayCount, weekCount] = await Promise.all([
            checkinsRepo.count({ filter: { task: task.id, checkin_date: todayStr } }),
            checkinsRepo.count({ filter: { task: task.id, checkin_date: { $gte: weekStartStr, $lte: weekEndStr } } }),
        ]);
        if ((0, task_checkin_logic_1.isCheckinDueToday)(task, todayCount, weekCount)) {
            await checkinsRepo.create({ values: { task: task.id, checkin_date: todayStr, status: 'Chưa làm' } });
            createdCount++;
        }
    }
    plugin.app.logger.info(`[company-management] task checkin generation for ${todayStr}: ${createdCount}/${activeRecurringTasks.length} tasks got a new checkin`);
}
/** setTimeout's delay is a 32-bit signed int (~24.8 days max); irrelevant here (always <1 day) but kept for parity with cycle-schedule.ts. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
/** Next local 00:05 strictly after `now`. */
function nextDailyBoundary(now) {
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 5, 0, 0);
    if (target.getTime() <= now.getTime()) {
        target.setTime(target.getTime() + ONE_DAY_MS);
    }
    return target;
}
function scheduleNextDailyBoundary(plugin, onBoundary) {
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
function registerTaskCheckinAutoGeneration(plugin) {
    scheduleNextDailyBoundary(plugin, () => generateTaskCheckinsForToday(plugin));
    plugin.app.resourcer.registerActionHandler('task_checkins:generateForToday', async (ctx, next) => {
        await generateTaskCheckinsForToday(plugin);
        ctx.body = { status: 'ok' };
        await next();
    });
}
