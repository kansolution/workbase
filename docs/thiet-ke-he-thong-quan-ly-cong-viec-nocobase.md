# THIẾT KẾ HỆ THỐNG QUẢN LÝ CÔNG VIỆC & ĐỘI NGŨ TRÊN NOCOBASE

## PHẦN A. ĐÁNH GIÁ & BỔ SUNG

### A.1. Điểm mạnh của thiết kế hiện tại
- Đã có đủ 6 khối chức năng cốt lõi: OKR, KPI, Task, Dự án/Chiến dịch, Strategy Hub, Quy trình làm việc.
- Đã phân biệt KPI hiệu quả (kết quả) và KPI nỗ lực (quá trình) — đây là điểm rất tốt, ít doanh nghiệp làm rõ được.
- Đã có phân cấp thành viên 3 bậc.

### A.2. Các lỗ hổng cần bổ sung

| # | Vấn đề còn thiếu | Vì sao cần |
|---|---|---|
| 1 | **Cơ cấu tổ chức** (Phòng ban/Nhóm) chưa có bảng riêng | OKR/KPI/quyền truy cập đều cần phân bổ theo phòng ban – nhóm, không thể gắn thẳng vào User |
| 2 | **Chu kỳ thời gian chuẩn hóa** (Cycle: Tuần/Tháng/Quý/Năm) | KPI đăng ký theo tuần nhưng phải cộng dồn lên tháng/năm — nếu không chuẩn hóa chu kỳ thành 1 bảng dùng chung, việc rollup sẽ rất khó và sai lệch ngày |
| 3 | **Liên kết OKR → KPI → Task** chưa tường minh | Nếu không có khóa ngoại nối 3 tầng này, không thể trả lời câu hỏi "task này đóng góp vào KPI/OKR nào" |
| 4 | **Trọng số (weight)** cho Key Result, KPI, tiêu chí đánh giá | Cần để tính điểm tổng hợp có ý nghĩa, không phải trung bình cộng đơn thuần |
| 5 | **Task định kỳ cần bảng "lượt thực hiện" (Checkin) riêng** | 1 Task định kỳ tồn tại nhiều tuần nhưng mỗi ngày/tuần có 1 kết quả khác nhau — nếu dùng chung 1 record Task sẽ ghi đè dữ liệu lịch sử |
| 6 | **Bảng Cuộc họp (Meeting)** tách khỏi Strategy Hub dạng ghi chú tự do | Cần participants, action items có thể sinh Task tự động |
| 7 | **Notification/nhắc việc** | Task định kỳ, task sắp quá hạn, KPI chưa đăng ký, quá hạn duyệt... đều cần nhắc tự động |
| 8 | **Approval flow (phê duyệt)** cho: đăng ký KPI, chấm điểm KPI, ban hành tài liệu quy trình | Hiện tại mô tả "cấp trên đánh giá" nhưng chưa có cơ chế duyệt/trả lại |
| 9 | **Phân quyền theo phạm vi dữ liệu (Data scope)** | "Quản lý team" chỉ được thấy dữ liệu team mình, "Quản lý bộ phận" thấy cả phòng ban — cần thiết kế Role + Scope trong NocoBase, không chỉ phân cấp trên giấy |
| 10 | **Nhóm sản phẩm (Product Group)** cần là 1 bảng chính thức | Vì OKR, KPI, Dự án, Strategy Hub đều "phân bổ theo nhóm sản phẩm" |
| 11 | **Đánh giá năng lực định kỳ (Performance Review)** | Khác với KPI theo số liệu — đây là đánh giá tổng hợp cuối quý/năm, kết hợp KPI + nhận xét định tính, phục vụ xét lương/thưởng |
| 12 | **Version + hiệu lực cho tài liệu quy trình** | Quy trình thay đổi theo thời gian, cần biết đang áp dụng bản nào |
| 13 | **Tiêu chí đánh giá (Evaluation Criteria)** tách bảng riêng, không nhúng cứng trong text | Để có thể chấm điểm theo từng tiêu chí, tổng hợp lên biểu đồ |
| 14 | **Khách hàng & Sản phẩm (mở rộng sau)** | Nên dựng khung quan hệ ngay từ đầu (đặt chỗ) để không phải phá vỡ mô hình dữ liệu khi mở rộng |
| 15 | **Audit log / lịch sử thay đổi trạng thái Task** | Cần biết task bị "Đang dừng" từ khi nào, ai đổi trạng thái — dùng plugin Audit Log có sẵn của NocoBase |
| 16 | **Escalation (leo thang)** khi task "Đang dừng" quá lâu hoặc quá hạn nhiều lần | Tự động báo cấp cao hơn nếu nhân viên/quản lý không xử lý |

---

## PHẦN B. MÔ HÌNH DỮ LIỆU (COLLECTIONS) TRONG NOCOBASE

> Quy ước: **m2o** = nhiều-1 (Many to one), **o2m** = 1-nhiều, **m2m** = nhiều-nhiều, **o2o** = 1-1.
> Trong NocoBase, quan hệ được tạo bằng field loại "Association" (Link to / Sub-table / Many to many...).

### B.1. Nhóm "Tổ chức & Con người"

**1. `departments` (Phòng ban)**
| Field | Loại | Ghi chú |
|---|---|---|
| name | Single line text | |
| parent_department | m2o → departments | tự tham chiếu, cho phép phòng ban con |
| manager | m2o → users | |
| description | Textarea | |

**2. `teams` (Nhóm/Team)**
| Field | Loại | Ghi chú |
|---|---|---|
| name | Single line text | |
| department | m2o → departments | |
| leader | m2o → users | |

**3. `users` (mở rộng bảng Users có sẵn của NocoBase)**
| Field | Loại | Ghi chú |
|---|---|---|
| role_level | Select | Nhân viên / Quản lý team / Quản lý bộ phận / Admin-Giám đốc |
| department | m2o → departments | |
| team | m2o → teams | |
| position_title | Single line text | Chức danh |
| direct_manager | m2o → users | tự tham chiếu |
| start_date | Date | |
| status | Select | Đang làm việc / Đã nghỉ |

**4. `product_groups` (Nhóm sản phẩm)**
| Field | Loại | Ghi chú |
|---|---|---|
| name | Single line text | |
| owner | m2o → users | |
| usp | Rich text | |
| target_persona | Rich text / Attachment | Chân dung khách hàng |
| description | Textarea | |

**5. `cycles` (Chu kỳ thời gian – bảng dùng chung, sinh tự động bằng workflow đầu năm)**
| Field | Loại | Ghi chú |
|---|---|---|
| type | Select | Tuần / Tháng / Quý / Năm |
| year | Number | |
| quarter_no | Number | 1–4, null nếu không áp dụng |
| month_no | Number | 1–12, null nếu không áp dụng |
| week_no | Number | 1–53, null nếu không áp dụng |
| start_date | Date | |
| end_date | Date | |
| parent_cycle | m2o → cycles | Tuần thuộc Tháng, Tháng thuộc Quý, Quý thuộc Năm |

> Đây là bảng **xương sống** để rollup KPI tuần → tháng → năm chính xác theo lịch, không lệch do "tuần giao quý".

### B.2. Nhóm "OKR"

**6. `objectives` (Mục tiêu – O)**
| Field | Loại | Ghi chú |
|---|---|---|
| title | Single line text | |
| description | Textarea | |
| level | Select | Công ty / Phòng ban / Team |
| cycle | m2o → cycles (Quý hoặc Tháng) | |
| product_group | m2o → product_groups | optional |
| owner | m2o → users | Lãnh đạo phụ trách |
| parent_objective | m2o → objectives | phân rã mục tiêu công ty → phòng ban |
| status | Select | Chưa bắt đầu / Đang thực hiện / Đạt / Không đạt |
| progress_percent | Formula/Number | tính từ Key Results (rollup có trọng số) |

**7. `key_results` (Kết quả chủ chốt – KR)**
| Field | Loại | Ghi chú |
|---|---|---|
| objective | m2o → objectives | |
| title | Single line text | |
| metric_type | Select | Doanh thu / Ngân sách / Dự án chiến lược / Chiến dịch chiến lược |
| target_value | Number | |
| current_value | Number | cập nhật thủ công hoặc qua workflow từ Projects/KPI |
| unit | Select | VNĐ / % / Số lượng... |
| weight | Number (%) | tổng các KR trong 1 Objective = 100% |
| linked_project | m2o → projects | optional |
| status | Select | Đang theo dõi / Đạt / Rủi ro / Không đạt |

### B.3. Nhóm "KPI"

**8. `kpi_registrations` (Đăng ký & theo dõi KPI tuần)**
| Field | Loại | Ghi chú |
|---|---|---|
| user | m2o → users | |
| cycle | m2o → cycles (loại Tuần) | |
| kpi_group | Select | Hiệu quả / Nỗ lực |
| category | Select | Doanh số / Ngân sách / Traffic / Lượt xem bài viết / Tương tác / Khối lượng công việc / Mức hoàn thành / Chất lượng công việc |
| key_result | m2o → key_results | optional – liên kết lên OKR |
| target_value | Number | |
| actual_value | Number | |
| weight | Number (%) | |
| self_score | Number (1–5 hoặc %) | nhân viên tự chấm (áp dụng cho nhóm Nỗ lực) |
| manager_score | Number | cấp trên chấm |
| final_score | Formula | vd: hiệu quả = actual/target; nỗ lực = trung bình(self, manager) |
| approval_status | Select | Nháp / Chờ duyệt / Đã duyệt / Yêu cầu chỉnh sửa |
| notes | Textarea | |

**9. `kpi_summaries` (Tổng hợp KPI tháng/năm – do workflow tạo, không nhập tay)**
| Field | Loại | Ghi chú |
|---|---|---|
| user | m2o → users | |
| period_type | Select | Tháng / Năm |
| cycle | m2o → cycles | |
| total_efficiency_score | Number | tổng hợp KPI Hiệu quả có trọng số |
| total_effort_score | Number | tổng hợp KPI Nỗ lực có trọng số |
| overall_score | Formula | vd 60% hiệu quả + 40% nỗ lực (tỉ lệ cấu hình được) |
| rank_in_team | Number | optional, xếp hạng nội bộ |

**10. `performance_reviews` (Đánh giá năng lực định kỳ – quý/năm)**
| Field | Loại | Ghi chú |
|---|---|---|
| user | m2o → users | |
| cycle | m2o → cycles (Quý/Năm) | |
| kpi_summary | m2o → kpi_summaries | |
| criteria_scores | o2m → evaluation_scores | chi tiết theo từng tiêu chí |
| manager_comment | Rich text | |
| final_rating | Select | Xuất sắc / Tốt / Đạt / Cần cải thiện |
| approval_status | Select | Chờ duyệt / Đã duyệt |

### B.4. Nhóm "Task"

**11. `tasks`**
| Field | Loại | Ghi chú |
|---|---|---|
| title | Single line text | |
| task_type | Select | Định kỳ / Riêng |
| description | Rich text | |
| assignees | m2m → users | hỗ trợ giao nhiều người |
| project | m2o → projects | optional |
| key_result | m2o → key_results | optional – liên kết OKR |
| recurrence_unit | Select | Ngày / Tuần (chỉ áp dụng nếu task_type = Định kỳ) |
| recurrence_frequency | Number | số lần/tuần |
| due_date | Date/Datetime | chỉ áp dụng nếu task_type = Riêng |
| priority | Select | Thấp / Trung bình / Cao / Khẩn cấp |
| status | Select | Mới / Đang làm / Hoàn thành / Quá hạn / Đang dừng |
| pause_reason | Select | Chưa biết làm / Yêu cầu cấp trên dừng / Chờ task khác |
| blocking_task | m2o → tasks | tự tham chiếu, dùng khi pause_reason = Chờ task khác |
| result_link | URL | |
| result_image | Attachment | |
| notes | Textarea | |
| created_by | m2o → users | |

**12. `task_checkins` (Lượt thực hiện của Task định kỳ)**
| Field | Loại | Ghi chú |
|---|---|---|
| task | m2o → tasks | |
| checkin_date | Date | |
| status | Select | Hoàn thành / Chưa làm / Bỏ qua |
| result_link | URL | |
| result_image | Attachment | |
| notes | Textarea | |

> Task Riêng dùng trực tiếp `tasks.status`; Task Định kỳ dùng `tasks` làm "khuôn mẫu" (template) còn `task_checkins` ghi nhận từng lần thực hiện thực tế — tránh mất lịch sử.

### B.5. Nhóm "Dự án / Chiến dịch"

**13. `projects`**
| Field | Loại | Ghi chú |
|---|---|---|
| name | Single line text | |
| project_type | Select | Dự án / Chiến dịch |
| description | Rich text | |
| product_group | m2o → product_groups | |
| key_result | m2o → key_results | optional |
| manager | m2o → users | |
| members | m2m → users | |
| start_date / end_date | Date | |
| budget | Number | |
| status | Select | Lên kế hoạch / Đang triển khai / Hoàn thành / Tạm dừng / Huỷ |
| tasks | o2m → tasks | (quan hệ ngược) |

### B.6. Nhóm "Strategy Hub"

**14. `meetings`**
| Field | Loại | Ghi chú |
|---|---|---|
| title | Single line text | |
| meeting_type | Select | Họp tuần / Họp tháng / Họp đột xuất |
| meeting_date | Datetime | |
| participants | m2m → users | |
| notes | Rich text | |
| related_objective | m2o → objectives | optional |
| related_project | m2o → projects | optional |
| action_items | o2m → tasks | sinh Task trực tiếp từ cuộc họp |

**15. `strategy_resources` (Tài nguyên chiến lược)**
| Field | Loại | Ghi chú |
|---|---|---|
| resource_type | Select | Thương hiệu / Chân dung khách hàng / USP / Khác |
| product_group | m2o → product_groups | |
| title | Single line text | |
| content | Rich text | |
| attachments | Attachment | |

### B.7. Nhóm "Quy trình làm việc"

**16. `workflow_docs`**
| Field | Loại | Ghi chú |
|---|---|---|
| title | Single line text | |
| applies_to_department | m2o → departments | optional |
| applies_to_position | Single line text | |
| content | Rich text | |
| version | Number | |
| effective_date | Date | |
| approval_status | Select | Nháp / Chờ duyệt / Đã ban hành / Hết hiệu lực |

**17. `evaluation_criteria` (Tiêu chí đánh giá – dùng chung cho performance_reviews)**
| Field | Loại | Ghi chú |
|---|---|---|
| workflow_doc | m2o → workflow_docs | optional |
| name | Single line text | |
| description | Textarea | |
| weight | Number (%) | |

**18. `evaluation_scores` (điểm chi tiết từng tiêu chí trong 1 lần đánh giá)**
| Field | Loại | Ghi chú |
|---|---|---|
| performance_review | m2o → performance_reviews | |
| criteria | m2o → evaluation_criteria | |
| score | Number | |
| comment | Textarea | |

### B.8. Đặt chỗ mở rộng (Khách hàng, Sản phẩm)

**19. `customers`** (placeholder): name, contact info, product_group (m2o), owner (m2o users), status.
**20. `products`** (placeholder): name, product_group (m2o), sku, price, status.

Việc tạo trước 2 bảng này (dù chưa dùng nhiều field) giúp không phải sửa lại các quan hệ đã gắn vào `product_groups` khi mở rộng sau.

### B.9. Sơ đồ liên kết tổng quát

```
departments ──< teams ──< users >── objectives (owner)
                              │            │
                    product_groups     key_results ──< kpi_registrations
                              │            │                  │
                          projects <───────┘            kpi_summaries
                              │                                │
                            tasks ──< task_checkins      performance_reviews ──< evaluation_scores
                              │
                          meetings (action_items → tasks)
```

---

## PHẦN C. WORKFLOW (NocoBase Workflow Engine)

NocoBase hỗ trợ các loại trigger: **Collection event** (after create/update/delete), **Schedule** (cron), **Approval**, **Custom action event** (gọi từ nút bấm). Các node phổ biến: Condition (nhánh rẽ), Calculation, Query, Create/Update/Delete record, Loop, HTTP request, Sub-workflow, Notification/Email.

| # | Tên Workflow | Trigger | Các bước chính | Kết quả |
|---|---|---|---|---|
| WF01 | Sinh chu kỳ (cycles) đầu năm | Schedule (1/1 hàng năm) | Tạo record Năm → 4 Quý → 12 Tháng → 52 Tuần, gán parent_cycle | Bảng `cycles` luôn có sẵn, không cần nhập tay |
| WF02 | Nhắc đăng ký KPI tuần | Schedule (Thứ 2 mỗi tuần, 8h) | Query `users` đang hoạt động → Loop → tạo `kpi_registrations` (status=Nháp) cho tuần hiện tại → gửi thông báo | Nhân viên không quên đăng ký KPI |
| WF03 | Duyệt KPI (Approval) | Approval trigger khi user submit self_score | Route đến `direct_manager` → Manager nhập manager_score → Condition: đồng ý → approval_status=Đã duyệt; từ chối → Yêu cầu chỉnh sửa (quay lại nhân viên) | Kiểm soát chất lượng chấm điểm |
| WF04 | Tổng hợp KPI tháng | Schedule (ngày cuối tháng, 23h) | Query `kpi_registrations` theo `user` + tuần thuộc tháng (qua `parent_cycle`) → Calculation tổng có trọng số → Create/Update `kpi_summaries` (period_type=Tháng) | Có số liệu tháng mà không cần nhập tay |
| WF05 | Tổng hợp KPI năm | Schedule (31/12 hoặc đầu tháng 1) | Tương tự WF04 nhưng gộp theo `kpi_summaries` loại Tháng | Có số liệu năm |
| WF06 | Sinh lượt thực hiện Task định kỳ | Schedule (hàng ngày, 00:05) | Query `tasks` có task_type=Định kỳ & đang active → Condition theo `recurrence_unit`/`recurrence_frequency` → Create `task_checkins` mới cho hôm nay/tuần này | Nhân viên luôn có việc "hôm nay cần làm" |
| WF07 | Đánh dấu Quá hạn | Schedule (hàng ngày, 00:10) | Query `tasks` (Riêng) có due_date < hôm nay và status ≠ Hoàn thành, hoặc `task_checkins` chưa cập nhật trong ngày quy định → Update status = Quá hạn → Notify assignee + direct_manager | Không cần theo dõi thủ công |
| WF08 | Cập nhật tiến độ Key Result | After update trên `projects.status` hoặc `kpi_registrations.final_score` | Tính lại `current_value` của `key_results` liên quan (rollup/sum theo weight) → Update `objectives.progress_percent` | OKR luôn phản ánh dữ liệu mới nhất, không cần lãnh đạo tự tính |
| WF09 | Thông báo lịch họp | After create `meetings` | Loop qua `participants` → gửi thông báo/email kèm link cuộc họp | |
| WF10 | Escalation Task "Đang dừng" | Schedule (hàng ngày) | Query `tasks` có status=Đang dừng và thời gian dừng > X ngày (so với updatedAt) → Notify cấp quản lý cao hơn (`direct_manager.direct_manager`) | Tránh task bị "ngâm" quá lâu không ai xử lý |
| WF11 | Ban hành tài liệu quy trình | Approval trigger khi tạo/sửa `workflow_docs` | Route đến quản lý bộ phận liên quan → duyệt → approval_status=Đã ban hành, version+1 | Kiểm soát version tài liệu |
| WF12 | Sinh Performance Review cuối quý | Schedule (cuối mỗi quý) | Query `users` → Loop → Tạo `performance_reviews` (status=Chờ duyệt) kèm `kpi_summary` tương ứng và `evaluation_scores` rỗng theo `evaluation_criteria` áp dụng | Chuẩn hoá quy trình đánh giá cuối kỳ |

---

## PHẦN D. THIẾT KẾ VIEW (Blocks) TRONG NOCOBASE

Mỗi block dưới đây tương ứng 1 block dữ liệu (Table/Kanban/Calendar/Form) gắn vào 1 trang (page) trong NocoBase.

| Bảng | Table view | Kanban view (group by) | Calendar view (date field) | Detail/Form view |
|---|---|---|---|---|
| `objectives` | Danh sách theo cycle, level, product_group | Group theo `status` (Chưa bắt đầu/Đang thực hiện/Đạt/Không đạt) | — | Form hiển thị Key Results liên quan dạng sub-table |
| `key_results` | Lọc theo objective | Group theo `status` (Đang theo dõi/Rủi ro/Đạt/Không đạt) | — | Form: target vs current, % hoàn thành (progress bar bằng Formula field hiển thị dạng %) |
| `kpi_registrations` | Lọc theo user, cycle, kpi_group | Group theo `approval_status` (Nháp/Chờ duyệt/Đã duyệt/Yêu cầu chỉnh sửa) | Theo `cycle.start_date` (xem theo tuần) | Form: self_score, manager_score cạnh nhau |
| `kpi_summaries` | Bảng pivot theo user × tháng | — | — | Form chi tiết 1 user/1 kỳ |
| `performance_reviews` | Danh sách theo cycle | Group theo `approval_status` | — | Form kèm sub-table `evaluation_scores` |
| `tasks` | Bảng đầy đủ filter theo assignee/project/status | **Group theo `status`** (Mới/Đang làm/Hoàn thành/Quá hạn/Đang dừng) — đây là view chính cho nhân viên | Theo `due_date` (chỉ Task Riêng) | Form: result_link, result_image, notes, pause_reason (hiện field này conditional khi status=Đang dừng) |
| `task_checkins` | Lọc theo task, ngày | Group theo `status` (Hoàn thành/Chưa làm/Bỏ qua) | Theo `checkin_date` — nhìn lịch làm việc hàng ngày | Form nhanh (popup) để cập nhật kết quả |
| `projects` | Danh sách theo product_group, manager | Group theo `status` (Lên kế hoạch/Đang triển khai/Hoàn thành/Tạm dừng/Huỷ) | Theo start_date–end_date (Gantt-like nếu dùng plugin Gantt, hoặc Calendar cơ bản) | Form kèm Tasks liên quan (sub-table), Members |
| `meetings` | Danh sách theo type | — | Theo `meeting_date` — lịch họp tháng | Form: notes rich text + action_items sub-table |
| `strategy_resources` | Danh sách theo product_group, resource_type | Group theo resource_type | — | Form nội dung dài (rich text + attachment gallery) |
| `workflow_docs` | Danh sách theo department | Group theo `approval_status` | — | Form + lịch sử version (liên kết các bản trước) |
| `departments` / `teams` | Bảng cây (Tree view nếu bật) | — | — | Form đơn giản |

> Gợi ý: với `tasks`, nên đặt **Kanban làm trang chủ (Home) của mỗi nhân viên** — filter mặc định `assignee = currentUser`, để nhân viên tự kéo-thả cập nhật trạng thái công việc hàng ngày.

---

## PHẦN E. DASHBOARD (dùng plugin Data Visualization / Chart blocks của NocoBase)

### E.1. Dashboard OKR tổng quan (dành cho Ban lãnh đạo)
- Chart: % hoàn thành từng Objective theo cấp Công ty/Phòng ban (Bar chart, nguồn `objectives.progress_percent`)
- Chart: Tiến độ Key Results theo nhóm sản phẩm (Bar/Progress theo `product_group`)
- Bảng: Objective có status = Rủi ro/Không đạt, cần can thiệp

### E.2. Dashboard KPI & Hiệu suất (dành cho Quản lý & HR)
- Chart cột so sánh: Target vs Actual theo từng nhân viên/tháng (nguồn `kpi_summaries`)
- Chart line: Xu hướng `overall_score` theo tháng (theo user hoặc theo team, dùng aggregate query group by cycle)
- Bảng xếp hạng: `kpi_summaries` sort theo `overall_score` desc, filter theo team/phòng ban (áp data scope)
- Pie/Donut: tỉ trọng điểm Hiệu quả vs Nỗ lực trung bình toàn team

### E.3. Dashboard Workload (khối lượng công việc)
- Chart cột chồng (stacked bar): Số lượng task theo `status` theo từng nhân viên (nguồn `tasks` group by assignee, status)
- Heatmap/Calendar: mật độ `task_checkins` hoàn thành theo ngày trong tuần (phát hiện ai đang quá tải hoặc quá rảnh)
- Chart: Số lượng task "Đang dừng" theo `pause_reason` — phát hiện nút thắt cổ chai (bottleneck) trong quy trình
- KPI card: % task hoàn thành đúng hạn / tổng task (toàn công ty, theo team)

### E.4. Dashboard cá nhân (mỗi nhân viên tự xem)
- Card: KPI tuần này (target vs actual)
- Kanban: Task của tôi
- Card: Điểm KPI tháng hiện tại (`kpi_summaries` filter user=currentUser)
- Lịch: Task/Checkin sắp đến hạn 7 ngày tới

> Lưu ý kỹ thuật: các Chart block trong NocoBase truy vấn trực tiếp dữ liệu qua "Data source" + hỗ trợ filter theo `currentUser`, nên dashboard cá nhân chỉ cần 1 template, filter tự áp dụng theo người đăng nhập.

---

## PHẦN F. PHÂN QUYỀN (Roles & Data Scope)

| Role | Phạm vi xem/sửa | Cách cấu hình trong NocoBase |
|---|---|---|
| Nhân viên | Chỉ dữ liệu của bản thân (tasks, kpi_registrations, performance_reviews) | Role permission + Data scope: `user = currentUser` |
| Quản lý team | Dữ liệu của team mình quản lý | Data scope: `team = currentUser.team` (dùng filter theo quan hệ) |
| Quản lý bộ phận | Dữ liệu toàn phòng ban, duyệt KPI/tài liệu | Data scope: `department = currentUser.department` |
| Admin/Giám đốc | Toàn quyền, mọi bảng, cấu hình workflow | Root role, không giới hạn scope |

Nên bật thêm **Audit Log plugin** để lưu lịch sử thay đổi trên `tasks.status`, `kpi_registrations.final_score`, `workflow_docs.approval_status` — phục vụ giải trình khi có tranh chấp đánh giá.

---

## PHẦN G. THỨ TỰ TRIỂN KHAI ĐỀ XUẤT
1. Dựng nhóm bảng Tổ chức (departments, teams, users mở rộng, product_groups, cycles) + WF01 sinh cycles.
2. Dựng Task + Task Checkin + view Kanban/Calendar (giá trị dùng ngay được sớm nhất, dễ thấy hiệu quả).
3. Dựng OKR (objectives, key_results).
4. Dựng KPI (kpi_registrations, kpi_summaries) + WF02–WF05, approval flow.
5. Dựng Projects/Meetings, nối vào Tasks & OKR.
6. Dựng Strategy Hub, Workflow Docs, Evaluation Criteria, Performance Review.
7. Dựng Dashboard theo thứ tự: Workload → KPI → OKR (từ vận hành hàng ngày đến chiến lược).
8. Cấu hình Role & Data scope, Audit log sau cùng khi cấu trúc bảng đã ổn định.

---

Nếu bạn muốn, tôi có thể triển khai chi tiết hơn cho từng phần — ví dụ: viết cụ thể công thức Formula field cho `progress_percent`/`final_score`, hoặc vẽ sơ đồ workflow dạng flowchart trực quan cho WF03/WF06/WF08.
