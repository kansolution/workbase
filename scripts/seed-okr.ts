/**
 * Seeds a demo OKR tree so the "OKR Quý" page has something to look at:
 * 1 Objective cấp Công ty (with 1 manually-input Key Result), decomposed
 * into 2 Objective cấp Phòng ban (Kinh doanh / Kỹ thuật), each with 2 Key
 * Results.
 *
 * Independent from `seed-org.ts` (that script's demo departments/teams have
 * not been run against this instance yet — see CLAUDE.md TODO). This script
 * creates its own 3 lightweight owner accounts, reusing the same
 * key/email/nickname as `seed-org.ts`'s DEMO_USERS so the two stay
 * compatible if that script is run later (checks by email first, only
 * creates if missing — safe to run in either order).
 *
 * Talks to the running NocoBase instance over its REST API, same as
 * `seed-org.ts` (see ../README.md for that rationale).
 *
 * Usage:
 *   NOCOBASE_ADMIN_EMAIL=you@example.com NOCOBASE_ADMIN_PASSWORD=... \
 *     npx tsx scripts/seed-okr.ts
 *
 * Env vars:
 *   NOCOBASE_URL             default http://127.0.0.1:13000
 *   NOCOBASE_ADMIN_EMAIL     required
 *   NOCOBASE_ADMIN_PASSWORD  required
 */

const BASE_URL = process.env.NOCOBASE_URL ?? 'http://127.0.0.1:13000';
const ADMIN_EMAIL = process.env.NOCOBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NOCOBASE_ADMIN_PASSWORD;
const DEMO_PASSWORD = 'Demo@123456';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing NOCOBASE_ADMIN_EMAIL / NOCOBASE_ADMIN_PASSWORD env vars.');
  process.exit(1);
}

let authToken = '';

async function apiPost<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/${path}`, {
    method: 'GET',
    headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
  });
  if (!res.ok) {
    throw new Error(`${path} -> HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function signIn(): Promise<void> {
  const result = await apiPost<{ data: { token: string } }>('auth:signIn', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  authToken = result.data.token;
}

async function createRecord(collection: string, values: Record<string, unknown>): Promise<number> {
  const result = await apiPost<{ data: { id: number } }>(`${collection}:create`, { values });
  return result.data.id;
}

async function findOneId(collection: string, filter: Record<string, unknown>): Promise<number | null> {
  const result = await apiGet<{ data: { id: number }[] }>(
    `${collection}:list?filter=${encodeURIComponent(JSON.stringify(filter))}`,
  );
  return result.data[0]?.id ?? null;
}

async function getOrCreateUser(values: {
  nickname: string;
  email: string;
  role_level: string;
  position_title: string;
}): Promise<number> {
  const existing = await findOneId('users', { email: values.email });
  if (existing) return existing;
  return createRecord('users', {
    ...values,
    password: DEMO_PASSWORD,
    start_date: '2024-01-01',
    status: 'Đang làm việc',
  });
}

/** Current calendar quarter (per system clock), matching the auto-generated `cycles` rows. */
function currentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  return { year: now.getFullYear(), quarter: Math.floor(now.getMonth() / 3) + 1 };
}

async function main(): Promise<void> {
  await signIn();
  console.log('Signed in.');

  const { year, quarter } = currentQuarter();
  const cycleId = await findOneId('cycles', { type: 'Quý', year, quarter_no: quarter });
  if (!cycleId) {
    throw new Error(
      `No "Quý" cycle found for ${year} Q${quarter} — expected the auto-generated cycles to already exist.`,
    );
  }
  console.log(`Using cycle Quý ${quarter}/${year} (id ${cycleId}).`);

  const giamDocId = await getOrCreateUser({
    nickname: 'Giám đốc',
    email: 'giam.doc@demo.local',
    role_level: 'Admin-Giám đốc',
    position_title: 'Giám đốc điều hành',
  });
  const truongPhongKdId = await getOrCreateUser({
    nickname: 'Trưởng phòng Kinh doanh',
    email: 'truongphong.kd@demo.local',
    role_level: 'Quản lý bộ phận',
    position_title: 'Trưởng phòng Kinh doanh',
  });
  const truongPhongKtId = await getOrCreateUser({
    nickname: 'Trưởng phòng Kỹ thuật',
    email: 'truongphong.kt@demo.local',
    role_level: 'Quản lý bộ phận',
    position_title: 'Trưởng phòng Kỹ thuật',
  });
  console.log('Owners ready:', { giamDocId, truongPhongKdId, truongPhongKtId });

  const companyObjectiveId = await createRecord('objectives', {
    title: `Tăng trưởng doanh thu và năng lực vận hành Quý ${quarter}/${year}`,
    description: 'Mục tiêu cấp Công ty cho quý hiện tại — phân rã xuống 2 phòng ban.',
    level: 'Công ty',
    cycleId,
    ownerId: giamDocId,
    status: 'Đang thực hiện',
  });
  console.log('Created Objective (Công ty):', companyObjectiveId);

  await createRecord('key_results', {
    objectiveId: companyObjectiveId,
    title: 'Tổng doanh thu toàn công ty',
    metric_type: 'Doanh thu',
    target_value: 10_000_000_000,
    current_value: 3_500_000_000,
    unit: 'VNĐ',
    weight: 100,
    status: 'Đang theo dõi',
    is_manual_input: true,
  });

  const salesObjectiveId = await createRecord('objectives', {
    title: 'Tăng trưởng doanh thu mảng Kinh doanh',
    level: 'Phòng ban',
    cycleId,
    ownerId: truongPhongKdId,
    parentObjectiveId: companyObjectiveId,
    status: 'Đang thực hiện',
  });
  console.log('Created Objective (Phòng ban - Kinh doanh):', salesObjectiveId);

  await createRecord('key_results', {
    objectiveId: salesObjectiveId,
    title: 'Doanh thu ký mới trong quý',
    metric_type: 'Doanh thu',
    target_value: 3_000_000_000,
    current_value: 1_200_000_000,
    unit: 'VNĐ',
    weight: 60,
    status: 'Đang theo dõi',
    is_manual_input: false,
  });
  await createRecord('key_results', {
    objectiveId: salesObjectiveId,
    title: 'Triển khai dự án CRM mới',
    metric_type: 'Dự án chiến lược',
    target_value: 100,
    current_value: 40,
    unit: '%',
    weight: 40,
    status: 'Đang theo dõi',
    is_manual_input: false,
  });

  const techObjectiveId = await createRecord('objectives', {
    title: 'Nâng cao năng lực hệ thống kỹ thuật',
    level: 'Phòng ban',
    cycleId,
    ownerId: truongPhongKtId,
    parentObjectiveId: companyObjectiveId,
    status: 'Đang thực hiện',
  });
  console.log('Created Objective (Phòng ban - Kỹ thuật):', techObjectiveId);

  await createRecord('key_results', {
    objectiveId: techObjectiveId,
    title: 'Ngân sách vận hành hạ tầng trong định mức',
    metric_type: 'Ngân sách',
    target_value: 500_000_000,
    current_value: 210_000_000,
    unit: 'VNĐ',
    weight: 50,
    status: 'Đang theo dõi',
    is_manual_input: false,
  });
  await createRecord('key_results', {
    objectiveId: techObjectiveId,
    title: 'Chiến dịch nâng cấp hệ thống Quý ' + quarter,
    metric_type: 'Chiến dịch chiến lược',
    target_value: 100,
    current_value: 25,
    unit: '%',
    weight: 50,
    status: 'Đang theo dõi',
    is_manual_input: false,
  });

  console.log('\nDone. OKR tree seeded: 1 Công ty objective -> 2 Phòng ban objectives -> 5 key results total.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
