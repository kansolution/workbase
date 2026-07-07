# Cấu hình trang "OKR Quý"

Giống [`tasks-page-setup.md`](./tasks-page-setup.md): page + block là **UI
Schema runtime** của NocoBase, sống trong DB (`uiSchemas`/`desktopRoutes`),
tạo qua Admin UI — không có file để commit vào git. Tài liệu này là hướng dẫn
từng bước theo đúng Phần B.2 + mục "Views" của
[`../../../docs/thiet-ke-he-thong-quan-ly-cong-viec-nocobase.md`](../../../docs/thiet-ke-he-thong-quan-ly-cong-viec-nocobase.md),
làm sau khi:

1. Collections `objectives` và `key_results` đã được import (xem
   [`../collections/README.md`](../collections/README.md)) — đã deploy lên
   production 2026-07-07.
2. Đã có dữ liệu demo để xem thử: chạy `scripts/seed-okr.ts` (hoặc dữ liệu đã
   được seed thẳng qua SQL cho phiên demo này — 1 Objective cấp Công ty, 2
   Objective cấp Phòng ban, 5 Key Result).

## 1. Tạo trang mới

**Admin UI → menu trái → nút "+" → "Page"**, đặt tên **"OKR Quý"**.

Dùng 3 tab trong cùng trang (khuyến nghị, giống cách đã làm ở trang "Công
việc của tôi"): **"Bảng"**, **"Kanban"**, **"Chi tiết"** — chọn **"Add tab"**
ở đầu trang cho mỗi cái.

## 2. Tab "Bảng" — Table view, lọc theo cycle/level/product_group

**"Add block" → "Table" → chọn collection `objectives`.**

- Bật cột: `title`, `level`, `cycle`, `product_group`, `owner`,
  `parent_objective`, `status`, `progress_percent`.
- Thêm **Filter action** (nút "Filter" phía trên bảng) và cấu hình sẵn 3 field
  lọc: `cycle`, `level`, `product_group` — đúng yêu cầu thiết kế (B.2 dòng
  "Danh sách theo cycle, level, product_group"). Không đặt data scope cố
  định, để quản lý tự chọn lọc.

## 3. Tab "Kanban" — group theo `status`

**"Add block" → "Kanban" → chọn collection `objectives`.**

- **Group field**: chọn `status`. Sẽ ra 4 cột: `Chưa bắt đầu` / `Đang thực
  hiện` / `Đạt` / `Không đạt`.
- Kéo-thả giữa các cột hoạt động ngay vì `objectives.json` đã có sẵn field
  `sort` (`hidden`, `scopeKey: "status"`) — không cần thêm gì, đây chính là
  điều kiện đã rút ra từ lỗi Kanban của `tasks` ở phiên trước (xem Nhật ký
  CLAUDE.md phiên 3).
- Cấu hình field hiển thị trên card: `title`, `level`, `owner`,
  `progress_percent` là đủ.

## 4. Tab "Chi tiết" — Detail/Form với sub-table `key_results`

**"Add block" → "Details" (hoặc "Form" nếu muốn cho sửa trực tiếp) → chọn
collection `objectives`.**

- Bật hiển thị đủ field chính: `title`, `description`, `level`, `cycle`,
  `owner`, `parent_objective`, `status`, `progress_percent`.
- Bên trong block Detail, thêm **sub-table cho quan hệ `key_results`**:
  block settings (hoặc nút "+" trong Detail) → **"Add block" → association
  block trỏ tới `key_results`** (NocoBase cho thêm block con hiển thị các
  bản ghi liên quan qua field `objective` bên `key_results`, hoặc thêm 1
  block Table riêng lọc theo `objective = context record` qua "Set the data
  scope" với biến "Parent record" nếu không có sẵn tuỳ chọn association
  block trực tiếp).
- Cột hiển thị cho sub-table `key_results`: `title`, `metric_type`,
  `target_value`, `current_value`, `unit`, `weight`, `progress`, `status`.
  Field `progress` (formula, xem
  [`../collections/README.md`](../collections/README.md)) tự tính %, hiển
  thị mặc định dạng số + `%` (đã set `addonAfter: "%"` trong uiSchema).

### Progress bar cho `progress` (tuỳ chọn, cần làm tay trong Admin UI)

NocoBase **không có sẵn** component "progress bar" (thanh tiến độ trực quan)
cho field formula/number — field `progress` mặc định chỉ hiện số + `%`, không
phải thanh màu. Nếu muốn thanh tiến độ thật, có 2 hướng (chưa làm trong
session này, cần thử trực tiếp trên Admin UI để chắc chắn đúng phiên bản):

1. **Đơn giản nhất**: giữ nguyên hiển thị số `%` — đủ thông tin, không cần
   thêm gì.
2. **Thanh tiến độ trực quan**: dùng block **"Markdown"** (hoặc field
   template nếu bản NocoBase này hỗ trợ "Field template có thể chèn HTML")
   trong cùng hàng của sub-table, viết HTML/CSS inline kiểu
   `<div style="background:#eee"><div style="width:{{progress}}%;background:#52c41a">​</div></div>`
   — cách này phụ thuộc việc block Markdown có đọc được biến field của dòng
   hiện tại trong 1 sub-table hay không (thường Markdown block đọc field ở
   cấp block cha, không tự động lặp theo từng dòng con) nên có thể cần thử
   nghiệm thêm hoặc chấp nhận chỉ hiện số %.

## Ghi chú

- Toàn bộ mục 2–4 là thao tác UI, không có gì để commit — xem "Ghi chú" cuối
  [`tasks-page-setup.md`](./tasks-page-setup.md) nếu muốn version-hoá UI
  Schema sau này (`uiSchemas:insertAdjacent`/`desktopRoutes:create` qua REST
  API).
- Dữ liệu demo hiện có (sau khi seed): 1 Objective "Tăng trưởng doanh thu và
  năng lực vận hành Quý 3/2026" (Công ty) → 2 Objective con ("Tăng trưởng
  doanh thu mảng Kinh doanh", "Nâng cao năng lực hệ thống kỹ thuật", đều cấp
  Phòng ban) → tổng 5 Key Result. Dùng để xem thử cả 3 tab trên.
