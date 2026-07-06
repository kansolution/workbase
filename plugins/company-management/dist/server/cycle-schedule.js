"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCyclesForYear = generateCyclesForYear;
exports.registerCycleAutoGeneration = registerCycleAutoGeneration;
const generate_cycles_1 = require("./generate-cycles");
/**
 * Idempotent: does nothing if `year`'s "Năm" record already exists, so it's
 * safe to call on every app boot as a catch-up in case the server was down
 * exactly at the year boundary.
 */
async function generateCyclesForYear(plugin, year) {
    const repo = plugin.db.getRepository('cycles');
    const existing = await repo.findOne({ filter: { type: 'Năm', year } });
    if (existing) {
        plugin.app.logger.info(`[company-management] cycles for ${year} already exist, skipping`);
        return;
    }
    const records = (0, generate_cycles_1.buildCycleRecordsForYear)(year);
    const idByKey = new Map();
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
function scheduleAt(targetTimeMs, callback) {
    const delay = targetTimeMs - Date.now();
    if (delay > MAX_TIMEOUT_MS) {
        setTimeout(() => scheduleAt(targetTimeMs, callback), MAX_TIMEOUT_MS);
    }
    else {
        setTimeout(callback, Math.max(delay, 0));
    }
}
function scheduleNextYearBoundary(plugin, onBoundary) {
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
function registerCycleAutoGeneration(plugin) {
    const runForCurrentYear = () => generateCyclesForYear(plugin, new Date().getUTCFullYear());
    // Catch-up in case the app was offline exactly at Jan 1st.
    runForCurrentYear().catch((err) => plugin.app.logger.error('[company-management] cycle catch-up failed', { err }));
    scheduleNextYearBoundary(plugin, runForCurrentYear);
    plugin.app.resourcer.registerActionHandler('cycles:generate', async (ctx, next) => {
        var _a, _b, _c;
        const year = Number((_c = (_b = (_a = ctx.action) === null || _a === void 0 ? void 0 : _a.params) === null || _b === void 0 ? void 0 : _b.values) === null || _c === void 0 ? void 0 : _c.year) || new Date().getUTCFullYear();
        await generateCyclesForYear(plugin, year);
        ctx.body = { year, status: 'ok' };
        await next();
    });
}
