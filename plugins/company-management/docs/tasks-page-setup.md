# Cấu hình trang "Công việc của tôi"

Không giống `collections/*.json` (schema, nạp bằng `importCollections()`),
**page + block là UI Schema runtime** của NocoBase — nó sống trong DB của
app đang chạy (`uiSchemas`/`desktopRoutes`), được tạo qua Admin UI (hoặc qua
API `uiSchemas:insertAdjacent` / `desktopRoutes:create` nếu muốn script hoá
sau này). Tài liệu này là hướng dẫn từng bước để dựng đúng những gì Phần B.4
yêu cầu, làm qua Admin UI sau khi:

1. Plugin `company-management` đã được scaffold + bật (xem
   [`../README.md`](../README.md)).
2. `collections/tasks.json` và `collections/task_checkins.json` đã được
   import (tức là đã tồn tại field `project → projects` — xem lưu ý phụ
   thuộc trong [`../collections/README.md`](../collections/README.md); nếu
   `projects` chưa có, tạm bỏ field `project` ra khỏi `tasks.json` trước khi
   import, rồi thêm lại ở session B.5).

## 1. Tạo trang mới

**Admin UI → menu trái → nút "+" → "Page"** (hoặc "Group" rồi "Page" bên
trong nếu muốn xếp cùng nhóm với các trang Task khác) → đặt tên
**"Công việc của tôi"**.

Trang này sẽ có nhiều tab/block theo thứ tự dưới đây. Có thể dùng 1 trang có
nhiều block xếp dọc, hoặc tách thành nhiều **Tabs** trong cùng page (khuyến
nghị: 1 tab cho mỗi loại view để đỡ rối) — chọn **"Add tab"** ở đầu trang nếu
muốn tách.

## 2. Block Kanban — group theo `status`, filter mặc định `assignees = currentUser`

Trong trang/tab, **"Add block" → "Kanban" → chọn collection `tasks`**.

- Khi được hỏi **"Group field"**: chọn `status`. NocoBase sẽ tự tạo 1 cột cho
  mỗi giá trị enum (`Mới`, `Đang làm`, `Hoàn thành`, `Quá hạn`, `Đang dừng`).
- Mở **block settings (icon bánh răng góc trên bên phải block) → "Set the
  data scope"** (Đặt phạm vi dữ liệu / filter mặc định): thêm điều kiện
  `assignees` **contains** biến hệ thống **"Current user"** (`{{ currentUser
  }}`) — vì `assignees` là m2m nên toán tử filter đúng cho quan hệ nhiều-nhiều
  là "contains"/"is" tuỳ phiên bản NocoBase, chọn cái filter trên field quan
  hệ NocoBase hiển thị mặc định.
- Cấu hình field hiển thị trên card: bật `title`, `priority`, `due_date`,
  `project` là đủ dùng; các field khác để trong Detail popup.

## 3. Block Calendar (tasks) — theo `due_date`, chỉ hiện `task_type = Riêng`

**"Add block" → "Calendar" → chọn collection `tasks`.**

- **Date field**: chọn `due_date`.
- **Title field**: chọn `title` (hoặc field hiển thị bạn muốn thấy trên ô
  lịch).
- Mở **block settings → "Set the data scope"**: thêm điều kiện cố định
  `task_type` **=** `Riêng` (giá trị tĩnh, không phải biến) — đúng như thiết
  kế, vì Task Định kỳ dùng `task_checkins` để theo dõi lịch, không phải
  `tasks.due_date`.

## 4. Block Table (đầy đủ filter) — cho quản lý

**"Add block" → "Table" → chọn collection `tasks`.**

- Bật đủ cột cần cho quản lý: `title`, `assignees`, `project`, `status`,
  `priority`, `due_date`, `task_type`.
- Thêm **"Filter" action** (nút "Filter" phía trên bảng, có sẵn khi thêm
  block Table, hoặc thêm 1 **"Filter block"/"Filter form"** liên kết
  (associate) với block Table qua **block linkage** ở block settings) và cấu
  hình các field lọc: `assignees`, `project`, `status`. Khác Kanban/Calendar
  ở trên, block Table **không** đặt data scope cố định — quản lý cần tự chọn
  filter theo người/dự án/trạng thái nên để trống mặc định, chỉ thêm sẵn các
  field đó vào form Filter.

## 5. Block Form/Detail — ẩn/hiện `pause_reason` theo `status` (linkage rule)

Có thể làm trên block **Form** (tạo/sửa) hoặc **Details** (xem chi tiết) của
`tasks` — mở block đó, bấm vào field `pause_reason` trên form → menu field
(icon 3 chấm/"..." trên field) → **"Field component"** hoặc trực tiếp
**"Linkage rules"** (tuỳ phiên bản NocoBase, mục này có thể nằm ở
**block settings → "Linkage rules"** áp dụng cho cả block thay vì từng
field):

- **Condition**: `status` **=** `Đang dừng`
- **Then**: field `pause_reason` → **Visible** (hiện)
- **Else** (mặc định khi rule không khớp): field `pause_reason` → **Hidden**
  (ẩn) — chọn "Hidden" chứ không phải "Read only", vì yêu cầu là **chỉ hiện
  khi** `status = Đang dừng`, không phải hiện nhưng khoá sửa.

Đây chính là "field-level condition" NocoBase gọi là **Linkage rule** (điều
kiện liên động) — khai báo tại block, áp dụng lại được cho các block khác
nếu tạo thêm form/detail cho `tasks` sau này (mỗi block cấu hình linkage
riêng, không dùng chung với block khác).

## 6. Block Calendar + Kanban cho `task_checkins`

Trên cùng trang "Công việc của tôi" (thêm tab mới, ví dụ "Lượt thực hiện") hoặc
trang riêng:

- **Calendar**: **"Add block" → "Calendar" → collection `task_checkins`**,
  **Date field** = `checkin_date`, **Title field** = liên kết tới `task.title`
  (NocoBase cho chọn field từ association khi set title field) hoặc `status`
  nếu không chọn được field xuyên quan hệ.
- **Kanban**: **"Add block" → "Kanban" → collection `task_checkins`**,
  **Group field** = `status` (3 cột: `Hoàn thành` / `Chưa làm` / `Bỏ qua`).

Không cần data scope mặc định cho 2 block này theo yêu cầu — nếu sau này cần
"chỉ xem lượt thực hiện của tôi", thêm data scope `task.assignees contains
currentUser` tương tự block Kanban ở mục 2.

## Ghi chú

- Toàn bộ mục 2–6 là thao tác UI, không có file để commit vào git (UI Schema
  nằm trong DB của app). Nếu muốn version-hoá, cách làm chuẩn là export page
  qua **Admin UI → Plugin "UI Schema Storage" → Export**, hoặc viết script
  gọi thẳng `uiSchemas:insertAdjacent`/`desktopRoutes:create` qua REST API
  giống cách [`../../../scripts/seed-org.ts`](../../../scripts/seed-org.ts)
  seed dữ liệu — chưa làm trong session này vì cần chạy thử trực tiếp trên
  Admin UI để chắc chắn đúng ý trước khi đóng băng thành schema JSON.
- Lịch tạo `task_checkins` tự động hàng ngày (00:05) đã được viết ở
  [`../src/server/task-checkin-schedule.ts`](../src/server/task-checkin-schedule.ts),
  không phụ thuộc vào page này — page chỉ là nơi xem/thao tác dữ liệu.
