# Component Inventory & Design Constraints — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này là đặc tả danh mục quy chuẩn độc lập (self-contained) liệt kê toàn bộ các component giao diện của **Snapgram Admin Portal**, ánh xạ trực tiếp từ các endpoints trong API Docs (Auth, Content, Media Services), đồng thời áp đặt các ràng buộc thiết kế bắt buộc từ:
- [design-system.md](design-system.md): Bảng màu, typography và semantic tokens.
- [absolute-rules.md](../absolute-rules.md): 5 điều luật cấm emoji, hạn chế gradient, lệnh CLI shadcn, CLI-First bootstrap và theme mode không hardcode màu.
- [layout-system.md](layout-system.md): Khung nhìn container và lưới bố cục.
- [architect/api-integration-map.md](../architect/api-integration-map.md): Ánh xạ chi tiết API sang UI.

> **RÀNG BUỘC THIẾT KẾ BẮT BUỘC (MAPPING TỪ DESIGN-SYSTEM.MD):**
> 1. **Cấm tuyệt đối Emoji Icon** trong toàn bộ tiêu đề, nhãn hoặc nội dung tĩnh của component. Biểu tượng thị giác bắt buộc dùng Lucide React (`lucide-react`).
> 2. **Cấm nền Gradient** trên tất cả component (Card, Table, Dialog, Sheet, Badge, Input).
> 3. **Ngoại lệ Gradient duy nhất:**
>    - `PrimaryActionButton`: `bg-gradient-to-r from-[#ff6a00] to-[#ee0979]` + `shadow-[0_8px_20px_-3px_rgba(247,119,55,0.45)]`.
>    - `FeedActiveRing` / `LiveRing`: Viền highlight `.insta-ring` (`linear-gradient(45deg, #f09433, #dc2743, #bc1888)`).
> 4. **Mọi component mở rộng từ shadcn/ui** phải cài đặt qua lệnh CLI chính quy: `pnpm dlx shadcn@latest add <component>`.
> 5. **Quy chuẩn Loading & Skeleton** (áp dụng cho mọi bảng/danh sách/card): dùng component `Skeleton` của shadcn với hiệu ứng `animate-pulse`; mặc định render **5 hàng skeleton** cho table/list khi tải dữ liệu. **CẤM** dùng spinner chặn toàn trang khi chỉ tải một vùng dữ liệu; **CẤM** gây layout shift (skeleton phải khớp kích thước nội dung thật).
>
> 6. **Form stack:** shadcn v4 bỏ component `form` (wrapper RHF). Thay bằng
>    `field` + `label` + `separator` cho form layout; `input-group` + `textarea`
>    cho input group; tích hợp react-hook-form qua Controller.

---

## 2. Danh Mục Các Component Giao Diện (Component Inventory)

### 2.1. Nhóm Điều Hướng & Khung Bố Cục (Navigation & Shell)

| Tên Component | Cài Đặt (shadcn) | Ràng Buộc Styling (Từ design-system.md) | Chức Năng & Ánh Xạ API | Các Trạng Thái Giao Diện (States Coverage) |
|---|---|---|---|---|
| **`MasterShell`** | Tự code | `bg-card rounded-[32px] sm:rounded-[40px] shadow-[0_20px_45px_-15px_rgba(26,42,70,0.12)] border border-border` | Khung nhìn master bọc toàn bộ phân hệ Admin. | Normal, Collapsed Sidebar, Mobile Drawer |
| **`SidebarNavigation`** | Tự code | Nền phẳng, viền phải `border-border`. Item active dùng nền `bg-accent text-accent-foreground font-bold`. | Điều hướng giữa các phân hệ quản trị. | Default, Hover, Active, Role-filtered (Admin vs Mod) |
| **`AdminProfileCard`** | Tự code | Avatar viền ring mảnh `p-[3px] rounded-full border-2 border-border`. Dải 3 thông số có viền `border-y border-border py-2.5 px-3`. | Hiển thị admin hiện tại từ `GET /api/auth/me`. | Skeleton Loading, Loaded, Error/Unauthorized |
| **`TopSearchBar`** | `input` | Bo tròn pill `rounded-full bg-muted pl-11 pr-4 py-2.5`. Icon Lucide `Search`. CẤM dùng emoji. | Tìm kiếm nhanh user, bài viết hoặc ticket. | Default, Focus Ring, Searching/Debouncing, Has Value |
| **`ThemeToggle`** | `dropdown-menu`, `button` | Nút trigger `variant="ghost" size="icon"`, hiển thị icon Lucide theo mode hiện tại (`Sun`/`Moon`/`Monitor`), size `size-5`. Dropdown 3 item phẳng, icon `size-4`. CẤM emoji. | Đổi chế độ hiển thị Light/Dark/System qua `next-themes` (localStorage key `theme`). Không gọi API. | Idle (theo theme), Open, Item Focus, Item Selected |
| **`PrimaryActionButton`**| `button` | **GRADIENT DUY NHẤT:** `bg-gradient-to-r from-[#ff6a00] to-[#ee0979] text-white rounded-full shadow-[0_8px_20px_-3px_rgba(247,119,55,0.45)]`. | Nút tạo thông báo toàn hệ thống hoặc tạo tài khoản Admin. | Idle, Hover, Active/Pressed, Disabled, Submitting |

### 2.2. Nhóm Thống Kê & Báo Cáo (Metrics & Analytics)

| Tên Component | Cài Đặt (shadcn) | Ràng Buộc Styling (Từ design-system.md) | Chức Năng & Ánh Xạ API | Các Trạng Thái Giao Diện (States Coverage) |
|---|---|---|---|---|
| **`StatMetricCard`** | `card` | Nền trắng phẳng `bg-card border border-border rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]`. CẤM gradient card. | Hiển thị tổng user, bài viết, số report từ `GET /api/auth/admin/dashboard/stats`. | Skeleton Loading, Data Loaded, Refreshing, Error |
| **`ModerationQuickBar`** | Tự code | Thanh cuộn ngang `overflow-x-auto no-scrollbar`. Avatar có viền `.insta-ring` cho các mục cần duyệt gấp. | Dải highlight trạng thái phiên trực và các vụ việc vi phạm nóng. | Loading, Empty (No hot items), Active Ring, Scrollable |
| **`ActivityFeedCard`** | `card`, `avatar` | Card nền phẳng bo góc `rounded-2xl border border-border`. Ảnh tỷ lệ `aspect-[4/3]` hoặc `aspect-[16/10]`. | Hiển thị log bài viết mới tạo từ `GET /api/content/posts`. | Loading, Image Loaded, Image Fallback Error |

### 2.3. Nhóm Quản Trị Người Dùng & Phân Quyền (User Management & RBAC)

| Tên Component | Cài Đặt (shadcn) | Ràng Buộc Styling (Từ design-system.md) | Chức Năng & Ánh Xạ API | Các Trạng Thái Giao Diện (States Coverage) |
|---|---|---|---|---|
| **`UserDataTable`** | `table`, `pagination` | Bảng phẳng `border border-border`. Header xám nhẹ `bg-muted`. | Danh sách tài khoản từ `GET /api/auth/admin/users`. | Loading Skeleton (5 hàng), Empty Data, Populated, Error State |
| **`UserStatusBadge`** | `badge` | Nền phẳng không gradient: Active (`bg-emerald-50 text-emerald-700`), Banned (`bg-rose-50 text-rose-700`), Pending (`bg-amber-50 text-amber-700`). | Hiển thị trạng thái tài khoản. | Active, Banned, Pending Verification, Locked |
| **`UserActionMenu`** | `dropdown-menu` | Menu popover bo góc `rounded-xl shadow-lg border border-border`. | Thao tác Lock, Unlock, Assign Role. | Closed, Open, Item Focus, Item Disabled |
| **`DestructiveConfirmModal`** | `dialog`, `alert-dialog` | Modal xác nhận kép, nút Confirm dùng `bg-rose-600 hover:bg-rose-700 text-white` (Solid phẳng, KHÔNG gradient). | Gọi `POST /api/auth/admin/users/{id}/lock` hoặc `unlock`. | Closed, Open, Submitting (Loading), Field Error |
| **`RoleAssignSheet`** | `sheet` | Drawer trượt từ cạnh phải, nền phẳng `bg-card`. | Gọi `PUT /api/auth/admin/users/{id}/roles`. | Closed, Open, Fetching Roles, Saving, Error |

### 2.4. Nhóm Kiểm Duyệt Nội Dung & Quản Lý Media (Content Moderation & Media Management)

| Tên Component | Cài Đặt (shadcn) | Ràng Buộc Styling (Từ design-system.md) | Chức Năng & Ánh Xạ API | Các Trạng Thái Giao Diện (States Coverage) |
|---|---|---|---|---|
| **`ReportQueueTable`** | `table`, `tabs` | Tab lọc (Pending, Resolved, Dismissed). Bảng dữ liệu phẳng tối giản. | Quản lý danh sách tố cáo từ `GET /api/admin/reports`. | Loading, Tab Filter Change, Empty Queue, Populated |
| **`ReportDetailDrawer`** | `sheet` | Hiển thị đối tượng bị tố cáo (`targetType`: POST, COMMENT, USER) và lý do vi phạm. | Xem chi tiết nội dung bị báo cáo. | Closed, Open, Target Loading, Target Deleted Fallback |
| **`MediaPreviewDialog`** | `dialog` | Khung xem ảnh/video trực tiếp từ MinIO qua Presigned URL. | Xem tệp tin đa phương tiện từ `GET /api/media/{id}`. | Closed, Buffering/Loading, Playing, Expired URL Error |
| **`ContentPurgeModal`** | `alert-dialog` | Hộp thoại xóa cưỡng bức nội dung vi phạm. | Gọi `DELETE /api/admin/reports/{id}` hoặc cập nhật trạng thái tố cáo. | Closed, Open, Deleting, Error |
| **`MediaUploader`** | `progress`, `button` | Wrapper thực hiện quy trình Presigned Upload (3 bước). Thanh progress phẳng, nút Cancel/Retry rõ ràng. CẤM dùng emoji. | Gọi `POST /api/media/presigned` → `PUT {uploadUrl}` → `POST /api/media/{id}/confirm`. | Idle/DragOver, Requesting URL, Uploading (0-100%), Confirming, Error/Retry |
| **`MediaDirectUploader`** | `input`, `button` | Wrapper upload trực tiếp multipart đơn giản cho avatar/ảnh nhỏ. | Gọi `POST /api/media/upload`. | Idle, File Selected, Uploading Spinner, Success, Error |
| **`MediaLibraryGrid`** | `card`, `scroll-area` | Lưới hiển thị danh sách media dạng ô vuông phẳng, dùng Tailwind `aspect-square`, viền hairline `border-border`. | Hiển thị danh sách tệp từ `GET /api/media/me`. | Loading Skeleton, Empty Library, Populated, Pagination |
| **`MediaDeleteConfirm`** | `alert-dialog` | Hộp thoại xác nhận xóa tệp media khỏi MinIO. Nút xóa dùng `bg-rose-600` solid (phẳng, không gradient). | Gọi `DELETE /api/media/{id}`. | Closed, Open, Deleting, Error |

### 2.5. Nhóm Xác Thực & Bảo Vệ Cửa Ngõ (Authentication & Guards)

| Tên Component | Cài Đặt (shadcn) | Ràng Buộc Styling (Từ design-system.md) | Chức Năng & Ánh Xạ API | Các Trạng Thái Giao Diện (States Coverage) |
|---|---|---|---|---|
| **`AdminLoginForm`** | `form`, `input`, `button` | Form phẳng nằm giữa màn hình, viền hairline tinh tế. | Đăng nhập Admin qua `POST /api/auth/admin/login` (rate limit 3 lần). | Idle, Submitting, Field Errors, 401 Alert, 423 Lockout Countdown |
| **`TwoFactorVerifyModal`** | `input-otp`, `dialog` | Khung nhập mã xác thực OTP 6 số (TOTP) nếu tài khoản bật 2FA. | Xác thực bước 2 qua `POST /api/auth/login/2fa`. | Closed, Open, Incomplete (0-5 digits), Verifying, Invalid OTP Error |
