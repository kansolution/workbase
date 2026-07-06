# Collection definitions

Mỗi file `.json` trong thư mục này là một object theo đúng shape
`CollectionOptions` của `@nocobase/database` (`{ name, title?, fields: [...] }`),
tương ứng với nhóm "Tổ chức & Con người" trong
[`../../../docs/thiet-ke-he-thong-quan-ly-cong-viec-nocobase.md`](../../../docs/thiet-ke-he-thong-quan-ly-cong-viec-nocobase.md):

- `departments.json` — Phòng ban (tự tham chiếu qua `parent_department`)
- `teams.json` — Nhóm/Team
- `product_groups.json` — Nhóm sản phẩm
- `cycles.json` — Chu kỳ thời gian (tự tham chiếu qua `parent_cycle`)
- `users.json` — **mở rộng** collection `users` có sẵn của NocoBase, chỉ khai
  báo các field mới (`role_level`, `department`, `team`, `position_title`,
  `direct_manager`, `start_date`, `status`). Dùng shape
  `{ extend: true, collectionOptions: { name: "users", fields: [...] } }` —
  đây là điều kiện `db.import()` dùng để gọi `extendCollection()` (merge field
  vào collection đã tồn tại) thay vì `db.collection()` (tạo/ghi đè collection
  mới). **Không** dùng shape phẳng `{ name, fields }` cho collection đã tồn
  tại: `db.collection()` thay thế toàn bộ definition trong bộ nhớ, có thể xoá
  mất các field gốc của `users` (username, password, nickname...).
- `tasks.json` — nhóm "Task" (`../../../docs/thiet-ke-he-thong-quan-ly-cong-viec-nocobase.md`
  B.4), collection `11. tasks`. `blocking_task` tự tham chiếu (`tasks`);
  `assignees`/`result_image` là `belongsToMany` (m2m/attachment) qua bảng
  trung gian riêng (`tasks_assignees`, `tasks_result_image`); `created_by`
  dùng interface `createdBy` (tự điền người tạo, read-only trên UI).
- `task_checkins.json` — collection `12. task_checkins` (lượt thực hiện của
  task định kỳ), `task` là `belongsTo` → `tasks`.
- `projects.json` — **placeholder tối thiểu** (chỉ `name` + `title`) cho
  collection `13. projects` (B.5), đủ để `tasks.project` (association) resolve
  được khi import. Sẽ thay bằng bản đầy đủ (product_group, key_result,
  manager, members, tasks o2m...) ở session dựng nhóm "Dự án / Chiến dịch".
- `objectives.json` — nhóm "OKR" (B.2), collection `6. objectives`.
  `parent_objective` tự tham chiếu (`objectives`) để phân rã Công ty → Phòng
  ban → Team. `progress_percent` là field số thường (không phải Formula field
  thật của NocoBase — rollup có trọng số cần đọc dữ liệu từ collection khác
  `key_results` nên phải do workflow ghi đè ở Session 7, không phải công thức
  tính trong-record), mặc định `0`, đánh dấu `x-read-pretty` vì không cho nhập
  tay. Có field `sort` (`hidden`, `scopeKey: "status"`) giống `tasks.json` để
  Kanban group theo `status` kéo-thả được — xem lưu ý về `scopeKey` trong
  Nhật ký CLAUDE.md phiên 3.
- `key_results.json` — collection `7. key_results` (B.2), `objective` là
  `belongsTo` → `objectives`, `linked_project` là `belongsTo` → `projects`
  (nullable, vì chưa chắc mỗi KR đều gắn dự án). Có field ẩn
  `is_manual_input` (`checkbox`, mặc định `false`) — KR nào được phép nhập
  tay `current_value` (thường chỉ áp dụng cấp Công ty); KR cấp Team/Phòng ban
  sẽ luôn bị rollup tự động ghi đè ở Session 7, field này chỉ đánh dấu để
  ràng buộc UI (linkage rule) làm ở session sau, chưa áp dụng ràng buộc thật
  trong session này.

## Cách nạp vào plugin

Các file này **không** tự động được NocoBase nạp — chúng chỉ là dữ liệu khai
báo. Sau khi scaffold plugin bằng CLI (xem
[`../README.md`](../README.md)), trong `src/server/index.ts` (hoặc file
Plugin chính), gọi trong `load()`:

```ts
import path from 'node:path';

class CompanyManagementPlugin extends Plugin {
  async load() {
    await this.db.import({ directory: path.resolve(__dirname, '../../collections') });
    await this.db.sync();
    // ... đăng ký thêm logic khác, ví dụ registerCycleAutoGeneration (xem ../src/server)
  }
}
```

`Plugin.importCollections(dir)` **là API deprecated và là no-op** trong bản
NocoBase đang chạy trên VPS (thân hàm rỗng) — dùng thẳng
`this.db.import({ directory: dir })`. Framework tự chạy `db.sync()` một lần
lúc `pm.enable()`, nhưng lúc đó plugin của ta *chưa load* nên chưa có gì để
sync; phải tự gọi `this.db.sync()` sau `db.import()` trong `load()` để bảng
thật sự được tạo (áp dụng ở mọi lần app khởi động, không chỉ lúc enable —
gọi lại vẫn an toàn/idempotent).

## Lưu ý khi import

- `product_groups.target_persona` dùng interface `attachment`
  (`belongsToMany` → `attachments` qua bảng trung gian
  `product_groups_target_persona`). Nếu phiên bản NocoBase bạn đang chạy sinh
  tên bảng trung gian khác khi tạo field kiểu Attachment qua UI, hãy đối chiếu
  lại tên `through` cho khớp trước khi import vào dữ liệu đã có sẵn.
- Chạy thử trên môi trường dev trước, vì `db.import()` sẽ đồng bộ (sync) bảng
  ngay khi load — nên bật trước khi có dữ liệu thật trong `departments`/`teams`/
  `product_groups`/`cycles`.
