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
  `direct_manager`, `start_date`, `status`). Khi `db.import()`/`importCollections()`
  gặp một collection đã tồn tại, các field mới được merge vào collection gốc
  thay vì tạo bảng mới — đây là cách chuẩn để plugin mở rộng `users` mà không
  đụng vào core.
- `tasks.json` — nhóm "Task" (`../../../docs/thiet-ke-he-thong-quan-ly-cong-viec-nocobase.md`
  B.4), collection `11. tasks`. `blocking_task` tự tham chiếu (`tasks`);
  `assignees`/`result_image` là `belongsToMany` (m2m/attachment) qua bảng
  trung gian riêng (`tasks_assignees`, `tasks_result_image`); `created_by`
  dùng interface `createdBy` (tự điền người tạo, read-only trên UI).
- `task_checkins.json` — collection `12. task_checkins` (lượt thực hiện của
  task định kỳ), `task` là `belongsTo` → `tasks`.

  **Lưu ý phụ thuộc `projects`:** `tasks.project` là `belongsTo` →
  `projects` (`allowNull: true`), nhưng collection `projects` (B.5) **chưa
  được tạo trong repo này** — sẽ làm ở session sau. NocoBase resolve field
  association tại thời điểm collection được đăng ký, nên nếu bật plugin và
  chạy `importCollections()` trước khi `projects` tồn tại (dù chỉ là stub
  `{ "name": "projects", "fields": [] }`), import `tasks.json` sẽ lỗi vì
  không tìm thấy target collection. Hai lựa chọn:
  1. Tạo trước một `collections/projects.json` tối thiểu (chỉ `name`) làm
     placeholder, rồi thay bằng bản đầy đủ ở session B.5; hoặc
  2. Tạm comment field `project` trong `tasks.json` cho tới khi B.5 xong.

## Cách nạp vào plugin

Các file này **không** tự động được NocoBase nạp — chúng chỉ là dữ liệu khai
báo. Sau khi scaffold plugin bằng CLI (xem
[`../README.md`](../README.md)), trong `src/server/index.ts` (hoặc file
Plugin chính), gọi trong `load()`:

```ts
import path from 'node:path';

class CompanyManagementPlugin extends Plugin {
  async load() {
    await this.importCollections(path.resolve(__dirname, '../../collections'));
    // ... đăng ký thêm logic khác, ví dụ registerCycleAutoGeneration (xem ../src/server)
  }
}
```

`this.importCollections(dir)` là helper có sẵn trên `Plugin` (tương đương
`this.db.import({ directory: dir })`), đọc mọi file `.json`/`.js`/`.ts` trong
thư mục và đăng ký/merge từng collection.

## Lưu ý khi import

- `product_groups.target_persona` dùng interface `attachment`
  (`belongsToMany` → `attachments` qua bảng trung gian
  `product_groups_target_persona`). Nếu phiên bản NocoBase bạn đang chạy sinh
  tên bảng trung gian khác khi tạo field kiểu Attachment qua UI, hãy đối chiếu
  lại tên `through` cho khớp trước khi import vào dữ liệu đã có sẵn.
- Chạy thử trên môi trường dev trước, vì `db.import()` sẽ đồng bộ (sync) bảng
  ngay khi load — nên bật trước khi có dữ liệu thật trong `departments`/`teams`/
  `product_groups`/`cycles`.
