# Scripts

Seed & migration scripts cho dự án.

- `seed-org.ts` — seed dữ liệu mẫu nhóm "Tổ chức & Con người": 2 phòng ban,
  4 team, 8 user demo (đủ 4 `role_level`), 2 `product_group`. Gọi thẳng vào
  REST API của NocoBase (không có `@nocobase/database` cài trên host — NocoBase
  chỉ chạy trong container `app`, xem [`../app/docker-compose.yml`](../app/docker-compose.yml)).
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
