# CLAUDE.md

Bối cảnh dự án cho Claude Code — đọc file này đầu mỗi phiên làm việc để nắm
tiến độ, bất kể đang ở máy nào.

## Dự án là gì

Hệ thống quản lý công việc/đội ngũ công ty (OKR, KPI, Task, Dự án, Strategy
Hub) xây trên nền [NocoBase](https://www.nocobase.com/) (low-code platform).

- `app/` — NocoBase core, chạy qua `docker-compose.yml` (services: `app` +
  `postgres`)
- `plugins/company-management/` — plugin custom cho các module OKR/KPI/Task/
  Dự án/Strategy Hub. **Chưa được scaffold** — hiện chỉ có README mô tả kế
  hoạch, chưa có code plugin thật.
- `docs/` — tài liệu thiết kế (data model, workflows, ui-flows — chưa viết,
  mới có README gợi ý cấu trúc)
- `scripts/` — seed & migration scripts (chưa có nội dung)

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
- ⚠️ **Tài khoản Root mặc định của NocoBase trên VPS** (`username: nocobase`,
  `password: admin123` — mặc định của NocoBase, không phải do dự án đặt)
  **chưa được đổi mật khẩu**. Đây là rủi ro bảo mật cao vì site public qua
  HTTPS. Cần đổi ngay khi có thể.
- Tài khoản `admin` (do user tạo qua UI) đã được gán role `admin` thủ công
  qua DB (bảng `rolesUsers`), vì role mặc định `member` không có quyền UI
  Editor.

## Nhật ký tiến độ

(mới nhất ở trên)

- **2026-07-06**: Deploy NocoBase + Postgres (Docker) lên VPS, domain
  `workbase.kanbox.vn`, HTTPS hoạt động qua Let's Encrypt. Tạo GitHub repo
  `kansolution/workbase`, thiết lập git 2 chiều VPS ↔ GitHub ↔ máy local để
  làm việc nhiều máy. Plugin `company-management` **chưa scaffold** — mới có
  kế hoạch trong README/docs. Chưa có bảng dữ liệu (collection) nào được tạo
  trong NocoBase ngoài các bảng hệ thống mặc định.

## Việc tiếp theo (TODO)

- [ ] **Ưu tiên cao**: đổi mật khẩu tài khoản root mặc định của NocoBase
      (`nocobase` / `admin123`) trên VPS
- [ ] Viết `docs/data-model.md` — mô hình dữ liệu (collections/fields/quan
      hệ) cho OKR, KPI, Task, Dự án, Strategy Hub
- [ ] Scaffold plugin `company-management` (`docker compose exec app yarn
      nocobase --help` để tìm lệnh tạo plugin, xem
      `plugins/company-management/README.md`)
- [ ] Xây các bảng dữ liệu (collection) và trang UI tương ứng trong NocoBase
