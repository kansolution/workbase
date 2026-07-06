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
- `projects.json` — **placeholder tối thiểu** (chỉ `name` + `title`) cho
  collection `13. projects` (B.5), đủ để `tasks.project` (association) resolve
  được khi import. Sẽ thay bằng bản đầy đủ (product_group, key_result,
  manager, members, tasks o2m...) ở session dựng nhóm "Dự án / Chiến dịch".

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
