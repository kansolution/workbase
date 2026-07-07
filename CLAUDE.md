# CLAUDE.md

Bối cảnh dự án cho Claude Code — đọc file này đầu mỗi phiên làm việc để nắm
tiến độ, bất kể đang ở máy nào.

## Dự án là gì

Hệ thống quản lý công việc/đội ngũ công ty (OKR, KPI, Task, Dự án, Strategy
Hub) xây trên nền [NocoBase](https://www.nocobase.com/) (low-code platform).

- `app/` — NocoBase core, chạy qua `docker-compose.yml` (services: `app` +
  `postgres`)
- `plugins/company-management/` — plugin custom cho các module OKR/KPI/Task/
  Dự án/Strategy Hub. **Đã scaffold và enable**, đã có nhóm collection "Tổ
  chức & Con người" + "Task" (xem `collections/README.md` và mục Nhật ký bên
  dưới). Plugin viết bằng TypeScript (`src/`) nhưng container production
  **không có TypeScript toolchain** → `dist/` được build tay và commit thẳng
  vào git (xem `.gitignore` và hướng dẫn "Sửa code plugin" bên dưới).
- `docs/thiet-ke-he-thong-quan-ly-cong-viec-nocobase.md` — tài liệu thiết kế
  đầy đủ (data model 20 collections, workflow engine, views, dashboard, phân
  quyền, thứ tự triển khai đề xuất ở Phần G).
- `scripts/` — `seed-org.ts` (seed dữ liệu mẫu nhóm Tổ chức & Con người qua
  REST API), xem `scripts/README.md`.

## Chạy local

```bash
cp app/.env.example app/.env   # rồi điền APP_KEY, DB_PASSWORD thật
cd app && docker compose up -d
```
Truy cập http://localhost:13000

## Production (đang chạy thật)

- **URL**: https://workbase.kanbox.vn
- **VPS**: `103.72.96.115`, SSH port `24700`, user `root`, Ubuntu 22.04, quản
  lý bằng **aaPanel**
- **Code trên VPS**: `/www/wwwroot/workbase.kanbox.vn` (là một git working
  copy, remote trỏ về repo này)
- Docker compose stack chạy tại `/www/wwwroot/workbase.kanbox.vn/app`, cổng
  NocoBase bind `127.0.0.1:13000` (không public trực tiếp — chỉ Nginx gọi
  vào)
- **Nginx vhost**: `/www/server/panel/vhost/nginx/workbase.kanbox.vn.conf` —
  reverse proxy sang `127.0.0.1:13000`, tự viết tay (không qua UI aaPanel)
- **SSL**: Let's Encrypt qua `certbot` (không dùng cơ chế SSL riêng của
  aaPanel), cert tại `/etc/letsencrypt/live/workbase.kanbox.vn/`, tự gia hạn
  qua certbot systemd timer + deploy-hook reload nginx
- ⚠️ VPS này **dùng chung** với các site production khác (`dify.kanbox.vn`,
  `n8n.kanbox.vn`, `shop.kanbox.vn`, `work.kanbox.vn`, đều là Docker/PHP
  riêng). RAM khá eo hẹp (~1GB khả dụng khi tải cao) — cẩn thận khi thêm
  service nặng.

### Deploy code mới lên VPS
SSH vào VPS, vào `/www/wwwroot/workbase.kanbox.vn`:
```bash
git pull
cd app && docker compose restart app   # đủ vì plugin là volume mount
# nếu đổi docker-compose.yml/thêm service: docker compose up -d
```

### Sửa code plugin `company-management` (không có TS toolchain trong container)

Container production **không có `typescript`/`tsc`** cài sẵn (image chỉ có
runtime deps). Sau khi sửa file trong `plugins/company-management/src/`,
phải build tay rồi commit cả `dist/`:
```bash
cd /www/wwwroot/workbase.kanbox.vn/app
docker compose exec -T -w /app/nocobase/storage/plugins/company-management app \
  sh -c 'npm install --no-save typescript && npx tsc && rm -rf node_modules'
docker compose restart app   # để plugin load() chạy lại với dist/ mới
```
Rồi `git add plugins/company-management/dist ... && git commit && git push`
như bình thường. `.gitignore` có exception riêng cho
`plugins/company-management/dist/` (bị `dist/` global ignore chặn nếu không
có dòng `!...`).

Lưu ý quan trọng đã rút ra khi scaffold plugin lần đầu (2026-07-06):
- `Plugin.importCollections()` là API **deprecated, thân hàm rỗng** trong
  bản NocoBase này — phải dùng `this.db.import({ directory })` rồi tự gọi
  `await this.db.sync()` ngay sau đó (framework chỉ tự `db.sync()` một lần
  lúc `pm.enable()`, *trước* khi plugin của ta kịp `load()`/register
  collection, nên cần tự sync lại).
- Muốn **mở rộng** một collection có sẵn (vd. `users`) qua `db.import()`,
  file JSON phải có shape `{ extend: true, collectionOptions: {...} }` để
  framework gọi `extendCollection()` (merge field). Dùng nhầm shape phẳng
  `{ name, fields }` sẽ gọi `db.collection()` — **thay thế toàn bộ**
  definition trong bộ nhớ, có nguy cơ xoá mất field gốc của collection đó.
- Local plugin trong `storage/plugins/` chỉ resolve được (`require()`) nếu
  biến môi trường `NODE_MODULES_PATH` được set (đã thêm vào
  `app/docker-compose.yml`) — thiếu biến này, NocoBase không tự tạo symlink
  `node_modules/<package-name>` → `storage/plugins/<dir>`, và enable plugin
  sẽ báo lỗi "Cannot find module".

## Git workflow (làm việc nhiều máy)

- **Repo trung tâm**: https://github.com/kansolution/workbase (private)
- VPS push/pull qua SSH deploy key riêng (`/root/.ssh/github_workbase_deploy`,
  đã add vào GitHub Deploy keys với quyền write)
- Máy cá nhân dùng Git Credential Manager, đăng nhập qua popup trình duyệt
  bằng tài khoản GitHub của chủ dự án

**Quy trình mỗi khi bắt đầu/kết thúc phiên làm việc, ở bất kỳ máy nào:**
1. Đầu phiên: `git pull`
2. Cuối phiên (trước khi đổi máy): cập nhật mục **Nhật ký tiến độ** bên dưới,
   rồi `git add . && git commit -m "..." && git push`

## Bảo mật

- `app/.env` chứa secret thật (APP_KEY, DB_PASSWORD) — **không commit**, đã
  gitignore. Mỗi máy/VPS tự có file `.env` riêng.
- Tài khoản Root mặc định của NocoBase (`nocobase` / `admin123`) đã được đổi
  mật khẩu (2026-07-06, phiên 3) — không còn dùng mật khẩu mặc định.
- Tài khoản `admin` (do user tạo qua UI) đã được gán role `admin` thủ công
  qua DB (bảng `rolesUsers`), vì role mặc định `member` không có quyền UI
  Editor.

## Nhật ký tiến độ

(mới nhất ở trên)

- **2026-07-07 (phiên 4)**: Dựng nhóm "OKR" (Phần B.2) trên production qua
  SSH trực tiếp (không có TS toolchain/docker cục bộ, dùng script Python +
  paramiko để chạy lệnh qua SSH vì máy này không có `sshpass`/`plink`).
  Thêm `collections/objectives.json` (tự tham chiếu qua `parent_objective`
  để phân rã Công ty → Phòng ban → Team; có field `sort` hidden +
  `scopeKey: "status"` ngay từ đầu để Kanban kéo-thả hoạt động, tránh lặp lại
  lỗi đã gặp với `tasks` ở phiên 3) và `collections/key_results.json` (có
  field ẩn `is_manual_input` để đánh dấu KR được phép nhập tay, phục vụ ràng
  buộc UI ở session sau). Build `dist/` tay trong container VPS theo đúng quy
  trình đã tài liệu hoá, verify bảng + metadata `collections`/`fields` tạo
  đúng qua `psql`, không có lỗi khi restart app.

  Phát hiện thêm 1 field type mới hữu ích: `key_results.progress` dùng
  **field kiểu `formula` thật** của NocoBase (`@nocobase/plugin-field-formula`,
  engine math.js) — khác với `objectives.progress_percent` (chỉ là field số
  thường, "tạm để 0", vì rollup có trọng số cần đọc dữ liệu từ collection
  khác nên phải chờ workflow ở Session 7). `progress` tính được ngay trong
  1 record (`current_value`/`target_value` cùng bảng) nên dùng formula thật
  luôn, không cần đợi workflow. Lưu ý quan trọng rút ra: field `formula` chỉ
  tự tính khi ghi qua Sequelize model (`beforeSave` hook) — record tạo bằng
  `INSERT` SQL thẳng thì `progress` bị `NULL`, phải `UPDATE` lại thủ công 1
  lần cho dữ liệu demo (đã làm); dữ liệu tạo qua Admin UI/REST API sau này tự
  tính đúng, không bị vấn đề này.

  Viết `scripts/seed-okr.ts` (qua REST API, theo mẫu `seed-org.ts`, độc lập
  với script đó — tự tạo 3 user chủ sở hữu tối thiểu, dùng chung
  email/nickname với `DEMO_USERS` của `seed-org.ts` và kiểm tra tồn tại theo
  email trước khi tạo nên chạy trước/sau `seed-org.ts` đều không trùng), commit
  vào git để dùng sau. Nhưng **không dùng script này để seed** — chưa có
  credentials tài khoản admin của production (chỉ có SSH root + DB root, không
  có mật khẩu admin app), nên theo lựa chọn của user, đã seed demo trực tiếp
  qua `INSERT` SQL tương đương (1 Objective Công ty "Tăng trưởng doanh thu và
  năng lực vận hành Quý 3/2026" → 2 Objective Phòng ban Kinh doanh/Kỹ thuật →
  5 Key Result), xoá file SQL tạm sau khi chạy xong.

  Viết `plugins/company-management/docs/okr-page-setup.md` hướng dẫn dựng
  trang "OKR Quý" (Table lọc cycle/level/product_group + Kanban group theo
  status + Detail có sub-table `key_results`) — **chưa thực sự tạo trang**,
  vì page/block là UI Schema runtime phải thao tác qua Admin UI trong trình
  duyệt (giống page "Công việc của tôi" ở phiên 3), mà phiên này chỉ có SSH,
  không có trình duyệt. Cũng ghi chú rõ: NocoBase không có sẵn component
  "progress bar" trực quan cho field formula — mục "chi tiết" trong hướng dẫn
  chỉ hiện số `%`, muốn thanh tiến độ thật cần thử nghiệm thêm (Markdown block
  + CSS, chưa xác nhận hoạt động với sub-table).

- **2026-07-06 (phiên 3)**: Bật plugin lên production lần đầu làm sập cả
  admin app ("Script error" RequireJS) vì plugin chỉ có code server, thiếu
  hẳn `dist/client/index.js` — client admin cố tải bundle này cho MỌI plugin
  đang enable và crash cứng nếu thiếu. Đã tắt plugin ngay để cứu app, viết
  tay 1 UMD module tối thiểu (`src/client/index.js` + `dist/client/index.js`
  + `client.js` shim ở root, xem code — không có bundler nên viết tay UMD
  thay vì build) export `{ default: class extends clientLib.Plugin {} }`,
  bật lại plugin, ổn định trở lại.

  Sau đó phát hiện thêm: dù bảng đã tạo trong Postgres, chúng **không hiện**
  trong Settings > Data sources > Collections UI — vì `db.import()` không tự
  ghi vào bảng metadata `collections`/`fields` mà UI đó đọc; phải set
  `"uiManageable": true` trên từng collection JSON **và** tự gọi
  `db.getRepository('collections').db2cmCollections([...])` trong `load()`
  (nút "Sync from database" trên UI **không** bắt được, vì nó chỉ dò bảng SQL
  chưa có Sequelize collection tương ứng — collection của ta thì có rồi nên
  bị bỏ qua). Quan trọng hơn: `db2cm()` là **no-op nếu collection đã có sẵn
  trong metadata** — nghĩa là field thêm sau (như `sort` bên dưới) sẽ không
  tự động được đồng bộ; đã thêm logic backfill field thiếu vào `load()` để
  tự xử lý việc này ở mọi lần khởi động, tránh phải vá tay SQL lần sau.

  Dựng xong trang "Công việc của tôi" qua Admin UI (Kanban + Calendar + Bảng
  quản lý cho `tasks`, Calendar + Kanban cho `task_checkins`), theo
  `plugins/company-management/docs/tasks-page-setup.md`. Vướng thêm 1 vấn đề
  kéo-thả Kanban không hoạt động: NocoBase Kanban cần 1 field kiểu `sort`
  trên collection, và field đó phải có `scopeKey` khớp đúng tên group field
  (ở đây `"scopeKey": "status"`) thì mới hiện trong dropdown "Drag and drop
  sorting field" — thiếu 1 trong 2 điều kiện này thì kéo thả im lặng không
  hoạt động (không báo lỗi gì, chỉ bôi đen chữ như khi bấm chọn text bình
  thường). Đã thêm field `sort` (`hidden: true`, `interface: "sort"`,
  `scopeKey: "status"`) vào `collections/tasks.json`.

  Bỏ qua 1 yêu cầu nhỏ trong design doc: ẩn/hiện field `pause_reason` theo
  điều kiện `status` qua "Linkage rules" — bản NocoBase này chỉ cho ẩn/hiện
  **cả block** qua linkage rule ở block level, không có sẵn action ẩn/hiện
  từng field riêng (phải viết JS tùy chỉnh qua "Execute JavaScript", chưa
  làm). Field `pause_reason` hiện luôn hiện trên form, không gây hại gì (để
  trống khi task không bị dừng).

  Seed dữ liệu demo cho `tasks` (8 task) và `task_checkins` (9 lượt) qua SQL
  trực tiếp để test UI (không phải qua `scripts/seed-org.ts`, script đó vẫn
  chưa test — xem TODO). Cũng đổi mật khẩu tài khoản root NocoBase mặc định
  (`nocobase`/`admin123`) — xong, xem mục Bảo mật.

- **2026-07-06 (phiên 2)**: Phát hiện và cứu một phiên làm việc trước đó bị bỏ
  dở trực tiếp trên VPS (chưa commit): tài liệu thiết kế đầy đủ
  (`docs/thiet-ke-he-thong-quan-ly-cong-viec-nocobase.md`), JSON collection
  cho nhóm "Tổ chức & Con người" + "Task", logic sinh `cycles`/`task_checkins`
  tự động. Đã commit+push. Sau đó **scaffold plugin `company-management`
  thật sự** (trước đó chỉ có file rời rạc, chưa phải plugin NocoBase hoạt
  động): viết `package.json`/`tsconfig.json`/`src/server/index.ts`, build
  bằng `tsc` cài tạm trong container (production image không có TS
  toolchain — xem hướng dẫn "Sửa code plugin" ở trên), enable plugin, và xác
  minh **đã tạo thành công** các bảng `departments`/`teams`/`product_groups`/
  `cycles`/`tasks`/`task_checkins`/`projects` (projects mới là stub) trong
  Postgres, mở rộng `users` với 7 field mới mà không mất field gốc, và 70
  record `cycles` (1 năm + 4 quý + 12 tháng + 53 tuần) được sinh tự động
  đúng như thiết kế. Phải sửa 2 lỗi phát sinh: (1) `Plugin.importCollections`
  deprecated/no-op → đổi sang `db.import()` + `db.sync()` tự gọi; (2) local
  plugin không resolve được vì thiếu `NODE_MODULES_PATH` trong
  `docker-compose.yml` → đã thêm. Xem chi tiết ở mục trên.

- **2026-07-06 (phiên 1)**: Deploy NocoBase + Postgres (Docker) lên VPS,
  domain `workbase.kanbox.vn`, HTTPS hoạt động qua Let's Encrypt. Tạo GitHub
  repo `kansolution/workbase`, thiết lập git 2 chiều VPS ↔ GitHub ↔ máy local
  để làm việc nhiều máy.

## Việc tiếp theo (TODO)

- [ ] (Tuỳ chọn) Ẩn/hiện field `pause_reason` theo `status` trên form task —
      cần viết JS tuỳ chỉnh qua "Execute JavaScript" trong Block linkage
      rules (bản NocoBase này không có action ẩn/hiện field riêng lẻ có sẵn)
- [ ] Tạo trang "OKR Quý" qua Admin UI (Table + Kanban + Detail/sub-table
      `key_results`) theo hướng dẫn từng bước ở
      `plugins/company-management/docs/okr-page-setup.md` — collections
      `objectives`/`key_results` đã deploy xong (phiên 4) nhưng trang chưa
      dựng vì cần thao tác trong trình duyệt (phiên 4 chỉ có SSH)
- [ ] Dựng nhóm KPI (`kpi_registrations`, `kpi_summaries`) + workflow duyệt
      KPI — bước 4
- [ ] Thay `projects.json` stub bằng bản đầy đủ (product_group, key_result,
      manager, members, tasks o2m) — bước 5, xem note trong
      `collections/README.md`
- [ ] Test thử `scripts/seed-org.ts` để seed dữ liệu mẫu cho nhóm Tổ chức &
      Con người (hiện đang seed tasks/task_checkins demo bằng SQL tay, xem
      nhật ký phiên 3)
