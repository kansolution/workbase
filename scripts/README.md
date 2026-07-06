# Scripts

Seed & migration scripts cho dự án.

- `seed/` — dữ liệu mẫu ban đầu (phòng ban, nhân sự mẫu, mẫu OKR/KPI...),
  thường chạy qua NocoBase CLI hoặc REST API sau khi plugin
  `company-management` đã có collections.
- `migrations/` — script hỗ trợ thay đổi dữ liệu/schema khi nâng cấp plugin.

Chưa có script nào vì collections của plugin `company-management` chưa được
định nghĩa. Xem [`../plugins/company-management`](../plugins/company-management)
và [`../docs`](../docs).
