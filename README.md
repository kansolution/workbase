# work-nocobase

Hệ thống quản lý công việc/đội ngũ công ty (OKR, KPI, Task, Dự án, Strategy
Hub) xây trên nền [NocoBase](https://www.nocobase.com/), chạy local bằng
Docker.

## Cấu trúc thư mục

```
.
├── app/                        # NocoBase core, chạy qua docker-compose
│   ├── docker-compose.yml
│   ├── .env.example            # copy thành .env trước khi chạy
│   └── storage/                # dữ liệu Postgres + storage NocoBase (gitignored)
├── plugins/
│   └── company-management/     # custom plugin của công ty (OKR/KPI/Task/Dự án/Strategy Hub)
├── docs/                       # tài liệu thiết kế
└── scripts/                    # seed & migration scripts
```

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker
  Engine + Compose v2)

## Chạy dự án

1. Tạo file cấu hình từ mẫu:

   ```bash
   cp app/.env.example app/.env
   ```

   Sau đó mở `app/.env` và điền giá trị thật cho `APP_KEY` và `DB_PASSWORD`
   (đừng commit file này — nó đã nằm trong `.gitignore`).

2. Khởi động stack (NocoBase + PostgreSQL):

   ```bash
   cd app
   docker compose up -d
   ```

   Lần chạy đầu tiên NocoBase sẽ tự cài đặt (tạo schema DB, v.v.), có thể mất
   một vài phút. Theo dõi log bằng:

   ```bash
   docker compose logs -f app
   ```

3. Truy cập ứng dụng tại: **http://localhost:13000**

4. Dừng stack:

   ```bash
   docker compose down
   ```

   (dữ liệu vẫn giữ nguyên trong `app/storage/`, vì đó là volume mount chứ
   không bị xoá khi `down`).

## Vào bash container để chạy CLI NocoBase

```bash
cd app
docker compose exec app bash
```

Trong container, xem các lệnh CLI có sẵn:

```bash
yarn nocobase --help
```

Các lệnh CLI cụ thể (cài plugin, tạo plugin, chạy migration...) phụ thuộc vào
phiên bản NocoBase đang chạy — luôn kiểm tra `--help` hoặc tài liệu chính thức
tương ứng với version trong `docker-compose.yml`.

Plugin công ty (`company-management`) được mount vào
`/app/nocobase/storage/plugins/company-management` bên trong container, và
tương ứng với thư mục [`plugins/company-management`](plugins/company-management)
ở host — sửa file ở host, NocoBase trong container thấy ngay.

## Bước thủ công cần làm trên trình duyệt (không thể tự động qua CLI)

Sau khi `docker compose up -d` chạy xong và trang http://localhost:13000 mở
được:

1. Mở **http://localhost:13000** trên trình duyệt.
2. Vì đây là lần khởi tạo đầu tiên (database còn trống), NocoBase sẽ hiển thị
   màn hình cài đặt/khởi tạo — nhập thông tin cho **tài khoản Root/Admin đầu
   tiên**: email/username và mật khẩu.
3. Submit form để tạo tài khoản — tài khoản này tự động có quyền Root và
   dùng để đăng nhập vào trang quản trị (`/admin`).
4. Đăng nhập, vào **Plugin Manager** để bật plugin `company-management` sau
   khi đã scaffold nó (xem
   [`plugins/company-management/README.md`](plugins/company-management/README.md)).

> Giao diện chính xác của màn hình khởi tạo có thể khác nhau chút ít giữa các
> phiên bản NocoBase, nhưng luồng "nhập thông tin admin đầu tiên → submit →
> đăng nhập `/admin`" là cố định.

## Bảo mật

- `app/.env` chứa secret thật — không commit.
- Đổi `APP_KEY` và `DB_PASSWORD` trong `app/.env` thành giá trị ngẫu nhiên
  mạnh trước khi dùng, kể cả cho môi trường local.
