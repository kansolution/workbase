/**
 * Seeds demo data for the "Tổ chức & Con người" group so the UI can be
 * clicked through: 2 departments, 4 teams, 8 users (all 4 role_levels),
 * 2 product groups.
 *
 * Talks to the running NocoBase instance over its REST API (there is no
 * local @nocobase/database install on the host — NocoBase only runs inside
 * the `app` container, see app/docker-compose.yml), so this must run after
 * `docker compose up -d` and after the first-run admin account has been
 * created through the browser setup wizard (see ../README.md).
 *
 * Usage:
 *   NOCOBASE_ADMIN_EMAIL=you@example.com NOCOBASE_ADMIN_PASSWORD=... \
 *     npx tsx scripts/seed-org.ts
 *
 * Env vars:
 *   NOCOBASE_URL             default http://127.0.0.1:13000
 *   NOCOBASE_ADMIN_EMAIL     required — the root account created via the setup wizard
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

async function api<T>(path: string, body?: Record<string, unknown>): Promise<T> {
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

async function signIn(): Promise<void> {
  const result = await api<{ data: { token: string } }>('auth:signIn', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  authToken = result.data.token;
}

async function createRecord(collection: string, values: Record<string, unknown>): Promise<number> {
  const result = await api<{ data: { id: number } }>(`${collection}:create`, { values });
  return result.data.id;
}

async function updateRecord(collection: string, id: number, values: Record<string, unknown>): Promise<void> {
  await api(`${collection}:update?filterByTk=${id}`, { values });
}

interface DemoUser {
  key: string;
  nickname: string;
  email: string;
  role_level: 'Nhân viên' | 'Quản lý team' | 'Quản lý bộ phận' | 'Admin-Giám đốc';
  position_title: string;
  departmentKey: 'kinh_doanh' | 'ky_thuat' | null;
  teamKey: 'sales_a' | 'sales_b' | 'backend' | 'frontend' | null;
  directManagerKey: string | null;
}

// Manager-before-report order so `directManagerKey` always resolves to an already-created user.
const DEMO_USERS: DemoUser[] = [
  {
    key: 'giam_doc',
    nickname: 'Giám đốc',
    email: 'giam.doc@demo.local',
    role_level: 'Admin-Giám đốc',
    position_title: 'Giám đốc điều hành',
    departmentKey: null,
    teamKey: null,
    directManagerKey: null,
  },
  {
    key: 'truong_phong_kd',
    nickname: 'Trưởng phòng Kinh doanh',
    email: 'truongphong.kd@demo.local',
    role_level: 'Quản lý bộ phận',
    position_title: 'Trưởng phòng Kinh doanh',
    departmentKey: 'kinh_doanh',
    teamKey: null,
    directManagerKey: 'giam_doc',
  },
  {
    key: 'truong_phong_kt',
    nickname: 'Trưởng phòng Kỹ thuật',
    email: 'truongphong.kt@demo.local',
    role_level: 'Quản lý bộ phận',
    position_title: 'Trưởng phòng Kỹ thuật',
    departmentKey: 'ky_thuat',
    teamKey: null,
    directManagerKey: 'giam_doc',
  },
  {
    key: 'truong_nhom_sales_a',
    nickname: 'Trưởng nhóm Sales A',
    email: 'truongnhom.salesa@demo.local',
    role_level: 'Quản lý team',
    position_title: 'Trưởng nhóm Sales A',
    departmentKey: 'kinh_doanh',
    teamKey: 'sales_a',
    directManagerKey: 'truong_phong_kd',
  },
  {
    key: 'truong_nhom_backend',
    nickname: 'Trưởng nhóm Backend',
    email: 'truongnhom.backend@demo.local',
    role_level: 'Quản lý team',
    position_title: 'Trưởng nhóm Backend',
    departmentKey: 'ky_thuat',
    teamKey: 'backend',
    directManagerKey: 'truong_phong_kt',
  },
  {
    key: 'nv_sales_a',
    nickname: 'NV Sales A',
    email: 'nv.salesa@demo.local',
    role_level: 'Nhân viên',
    position_title: 'Chuyên viên kinh doanh',
    departmentKey: 'kinh_doanh',
    teamKey: 'sales_a',
    directManagerKey: 'truong_nhom_sales_a',
  },
  {
    key: 'nv_sales_b',
    nickname: 'NV Sales B',
    email: 'nv.salesb@demo.local',
    role_level: 'Nhân viên',
    position_title: 'Chuyên viên kinh doanh',
    departmentKey: 'kinh_doanh',
    teamKey: 'sales_b',
    directManagerKey: 'truong_phong_kd', // Sales B has no dedicated lead in this seed
  },
  {
    key: 'nv_frontend',
    nickname: 'NV Frontend',
    email: 'nv.frontend@demo.local',
    role_level: 'Nhân viên',
    position_title: 'Kỹ sư phần mềm',
    departmentKey: 'ky_thuat',
    teamKey: 'frontend',
    directManagerKey: 'truong_phong_kt', // Frontend has no dedicated lead in this seed
  },
];

async function main(): Promise<void> {
  await signIn();
  console.log('Signed in.');

  const departmentIds = {
    kinh_doanh: await createRecord('departments', { name: 'Kinh doanh', description: 'Phòng Kinh doanh' }),
    ky_thuat: await createRecord('departments', { name: 'Kỹ thuật', description: 'Phòng Kỹ thuật' }),
  };
  console.log('Created departments:', departmentIds);

  const teamIds = {
    sales_a: await createRecord('teams', { name: 'Sales A', departmentId: departmentIds.kinh_doanh }),
    sales_b: await createRecord('teams', { name: 'Sales B', departmentId: departmentIds.kinh_doanh }),
    backend: await createRecord('teams', { name: 'Backend', departmentId: departmentIds.ky_thuat }),
    frontend: await createRecord('teams', { name: 'Frontend', departmentId: departmentIds.ky_thuat }),
  };
  console.log('Created teams:', teamIds);

  const userIds = new Map<string, number>();
  for (const user of DEMO_USERS) {
    const id = await createRecord('users', {
      nickname: user.nickname,
      email: user.email,
      password: DEMO_PASSWORD,
      role_level: user.role_level,
      position_title: user.position_title,
      departmentId: user.departmentKey ? departmentIds[user.departmentKey] : null,
      teamId: user.teamKey ? teamIds[user.teamKey] : null,
      directManagerId: user.directManagerKey ? userIds.get(user.directManagerKey) : null,
      start_date: '2024-01-01',
      status: 'Đang làm việc',
    });
    userIds.set(user.key, id);
  }
  console.log('Created users:', Object.fromEntries(userIds));

  await updateRecord('departments', departmentIds.kinh_doanh, { managerId: userIds.get('truong_phong_kd') });
  await updateRecord('departments', departmentIds.ky_thuat, { managerId: userIds.get('truong_phong_kt') });
  await updateRecord('teams', teamIds.sales_a, { leaderId: userIds.get('truong_nhom_sales_a') });
  await updateRecord('teams', teamIds.backend, { leaderId: userIds.get('truong_nhom_backend') });
  console.log('Linked department managers and team leaders.');

  const productGroupIds = {
    core: await createRecord('product_groups', {
      name: 'Nhóm sản phẩm Core',
      ownerId: userIds.get('truong_phong_kd'),
      usp: '<p>Giải pháp lõi, khách hàng doanh nghiệp vừa và nhỏ.</p>',
      description: 'Sản phẩm chủ lực, đóng góp phần lớn doanh thu.',
    }),
    growth: await createRecord('product_groups', {
      name: 'Nhóm sản phẩm Growth',
      ownerId: userIds.get('giam_doc'),
      usp: '<p>Dòng sản phẩm tăng trưởng, thử nghiệm thị trường mới.</p>',
      description: 'Sản phẩm mới, đang trong giai đoạn mở rộng thị trường.',
    }),
  };
  console.log('Created product groups:', productGroupIds);

  console.log('\nDone. Demo user password for all seeded accounts:', DEMO_PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
