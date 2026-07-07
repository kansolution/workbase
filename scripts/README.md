# Scripts

Seed & migration scripts cho dự án.

- `seed-org.ts` — seed dữ liệu mẫu nhóm "Tổ chức & Con người": 2 phòng ban,
  4 team, 8 user demo (đủ 4 `role_level`), 2 `product_group`. Gọi thẳng vào
  REST API của NocoBase (không có `@nocobase/database` cài trên host — NocoBase
  chỉ chạy trong container `app`, xem [`../app/docker-compose.yml`](../app/docker-compose.yml)).
- `seed-okr.ts` — seed 1 cây OKR demo cho quý hiện tại: 1 `objectives` cấp
  Công ty (1 `key_results` `is_manual_input: true`), phân rã xuống 2
  `objectives` cấp Phòng ban (Kinh doanh / Kỹ thuật), mỗi cái 2 `key_results`.
  Độc lập với `seed-org.ts` (chưa chạy trên instance này) — tự tạo 3 tài
  khoản chủ sở hữu tối thiểu, dùng chung key/email với `DEMO_USERS` của
  `seed-org.ts` và kiểm tra tồn tại theo email trước khi tạo, nên chạy trước
  hay sau `seed-org.ts` đều không tạo trùng.
- `migrations/` — script hỗ trợ thay đổi dữ liệu/schema khi nâng cấp plugin
  (chưa có).

## Chạy `seed-org.ts`

Yêu cầu: đã `docker compose up -d` (xem [`../README.md`](../README.md)) và đã
tạo tài khoản admin đầu tiên qua trình duyệt, và plugin `company-management`
đã được scaffold + bật (collections `departments`/`teams`/`product_groups`
đã tồn tại).

```bash
cd scripts
npm install
NOCOBASE_ADMIN_EMAIL=you@example.com NOCOBASE_ADMIN_PASSWORD=your-password \
  npm run seed:org
```

Mặc định gọi `http://127.0.0.1:13000` (đúng port map trong
`docker-compose.yml`); đổi bằng biến môi trường `NOCOBASE_URL` nếu cần.

> `auth:signIn` là action đăng nhập chuẩn của NocoBase bản gần đây; nếu
> instance của bạn dùng version cũ hơn với action đăng nhập khác, sửa hàm
> `signIn()` trong `seed-org.ts` cho khớp.

## Chạy `seed-okr.ts`

Yêu cầu: collections `objectives`/`key_results` đã tồn tại (đã import), và
`cycles` đã có sẵn record `Quý` cho năm/quý hiện tại (được sinh tự động khi
plugin load — xem `registerCycleAutoGeneration`).

```bash
cd scripts
npm install
NOCOBASE_ADMIN_EMAIL=you@example.com NOCOBASE_ADMIN_PASSWORD=your-password \
  npm run seed:okr
```
