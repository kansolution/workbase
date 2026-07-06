"use strict";
/**
 * Pure date math to build the `cycles` record tree for one calendar year:
 * 1 Năm -> 4 Quý -> 12 Tháng -> 52/53 Tuần (ISO 8601 weeks).
 *
 * No NocoBase/DB imports here on purpose, so this can be unit-tested with
 * plain `node --test` without booting the app.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCycleRecordsForYear = buildCycleRecordsForYear;
function pad2(n) {
    return String(n).padStart(2, '0');
}
function toISODateString(d) {
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
/**
 * ISO 8601: a year has 53 weeks iff it (or the previous year) starts on the
 * right weekday (Dickey's rule). All other years have 52.
 */
function isoWeeksInYear(year) {
    const p = (y) => (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
    return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}
function isoWeekdayUTC(d) {
    // getUTCDay(): 0=Sun..6=Sat -> ISO: 1=Mon..7=Sun
    return ((d.getUTCDay() + 6) % 7) + 1;
}
/** Jan 4 is always in ISO week 1; from it, walk back to that week's Monday. */
function mondayOfIsoWeek1(year) {
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - (isoWeekdayUTC(jan4) - 1));
    return monday;
}
function isoWeekRange(year, weekNo) {
    const week1Monday = mondayOfIsoWeek1(year);
    const start = new Date(week1Monday);
    start.setUTCDate(week1Monday.getUTCDate() + (weekNo - 1) * 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return { start, end };
}
/**
 * Builds every cycle record for `year`, with local `key`/`parentKey` links
 * (Năm -> Quý -> Tháng -> Tuần) instead of DB ids. The caller inserts them in
 * array order (parents always precede children) and swaps keys for real ids.
 *
 * Weeks are assigned to the month containing their Thursday (the ISO 8601
 * anchor day), so a week straddling a month/quarter boundary is never
 * ambiguous, and — because ISO week years are defined so every week's
 * Thursday falls in that same calendar year — it also never lands outside
 * `year`.
 */
function buildCycleRecordsForYear(year) {
    const records = [];
    const yearKey = `Y${year}`;
    records.push({
        key: yearKey,
        parentKey: null,
        type: 'Năm',
        year,
        quarter_no: null,
        month_no: null,
        week_no: null,
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
    });
    for (let q = 1; q <= 4; q++) {
        const quarterKey = `Q${year}-${q}`;
        const startMonth0 = (q - 1) * 3;
        const quarterStart = new Date(Date.UTC(year, startMonth0, 1));
        const quarterEnd = new Date(Date.UTC(year, startMonth0 + 3, 0));
        records.push({
            key: quarterKey,
            parentKey: yearKey,
            type: 'Quý',
            year,
            quarter_no: q,
            month_no: null,
            week_no: null,
            start_date: toISODateString(quarterStart),
            end_date: toISODateString(quarterEnd),
        });
        for (let offset = 0; offset < 3; offset++) {
            const month = startMonth0 + offset + 1;
            const monthKey = `M${year}-${month}`;
            const monthStart = new Date(Date.UTC(year, month - 1, 1));
            const monthEnd = new Date(Date.UTC(year, month, 0));
            records.push({
                key: monthKey,
                parentKey: quarterKey,
                type: 'Tháng',
                year,
                quarter_no: q,
                month_no: month,
                week_no: null,
                start_date: toISODateString(monthStart),
                end_date: toISODateString(monthEnd),
            });
        }
    }
    const totalWeeks = isoWeeksInYear(year);
    for (let w = 1; w <= totalWeeks; w++) {
        const { start, end } = isoWeekRange(year, w);
        const thursday = new Date(start);
        thursday.setUTCDate(start.getUTCDate() + 3);
        const month = thursday.getUTCMonth() + 1;
        const quarter = Math.ceil(month / 3);
        records.push({
            key: `W${year}-${w}`,
            parentKey: `M${year}-${month}`,
            type: 'Tuần',
            year,
            quarter_no: quarter,
            month_no: month,
            week_no: w,
            start_date: toISODateString(start),
            end_date: toISODateString(end),
        });
    }
    return records;
}
