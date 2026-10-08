# Route Map & Access Control Matrix — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này là đặc tả quy chuẩn độc lập (self-contained) về bản đồ định tuyến (Route Map), sơ đồ phân trang Next.js 15 App Router, ma trận phân quyền hành động (Action-level RBAC Matrix) và các tầng bảo vệ cho **Snapgram Admin Portal**. Tài liệu liên kết mật thiết với:
- [auth-and-security-flow.md](auth-and-security-flow.md): Cơ chế xác thực cookie httpOnly và Next.js middleware.
- [api-integration-map.md](api-integration-map.md): Danh mục API REST endpoints ánh xạ.
- [../design/layouts-and-navigation.md](../design/layouts-and-navigation.md): Cấu trúc điều hướng thanh Sidebar và Topbar.

---

## 2. Bảng Định Tuyến Trang Quản Trị (Route Table)

Toàn bộ ứng dụng sử dụng cấu trúc route Next.js 15 lồng slug ngôn ngữ `[locale]` (`en` | `vi`).

| Route URL | Tên Trang (Page Component) | Layout Bọc | Loại Truy Cập | Roles Cho Phép | Data Fetching API Chính | Vị Trí File Mã Nguồn |
|---|---|---|---|---|---|---|
| `/[locale]/admin/login` | `AdminLoginForm` | `AuthLayout` (Standalone) | **Public** | Mọi người dùng | `POST /api/auth/admin/login` | `src/app/[locale]/(auth)/admin/login/page.tsx` |
| `/[locale]/admin/dashboard` | `DashboardPage` | `DashboardLayout` (Shell) | **Protected** | `ADMIN`, `MODERATOR` | `GET /api/auth/admin/dashboard/stats` | `src/app/[locale]/(dashboard)/admin/dashboard/page.tsx` |
| `/[locale]/admin/users` | `UserListPage` | `DashboardLayout` (Shell) | **Protected** | `ADMIN` | `GET /api/auth/admin/users` | `src/app/[locale]/(dashboard)/admin/users/page.tsx` |
| `/[locale]/admin/users/[id]` | `UserDetailPage` | — | **Protected** | `ADMIN` | `GET /api/auth/admin/users/{id}` | **Chưa triển khai** — Sprint 2.3 chọn phương án `UserDetailDrawer` (Sheet) mở ngay trong trang danh sách thay vì route riêng. Route này chỉ tạo nếu sau này cần deep-link tới chi tiết user. |
| `/[locale]/admin/moderation/reports` | `ReportQueuePage` | `DashboardLayout` (Shell) | **Protected** | `ADMIN`, `MODERATOR` | `GET /api/admin/reports` | `src/app/[locale]/(dashboard)/admin/moderation/reports/page.tsx` |
| `/[locale]/admin/moderation/reports/[id]` | `ReportDetailPage` | — | **Protected** | `ADMIN`, `MODERATOR` | `GET /api/admin/reports/{id}` | **Chưa triển khai** — Sprint 2.5 dùng `ReportDetailSheet` (Sheet) mở trong trang danh sách thay vì route riêng. Route này chỉ tạo nếu sau này cần deep-link tới chi tiết report. |
| `/[locale]/admin/rbac` | `RBACManagerPage` | `DashboardLayout` (Shell) | **Protected** | `ADMIN` | `GET /api/auth/admin/roles`, `GET /permissions` | `src/app/[locale]/(dashboard)/admin/rbac/page.tsx` |
| `/[locale]/admin/system-health` | `SystemHealthPage` | `DashboardLayout` (Shell) | **Protected** | `ADMIN` | `GET /actuator/health` | `src/app/[locale]/(dashboard)/admin/system-health/page.tsx` |

### Quy Tắc Chuyển Hướng Gốc (Root Redirects):
- Truy cập `/` → Redirect về `/[locale]/admin/dashboard` (nếu đã đăng nhập) hoặc `/[locale]/admin/login` (nếu chưa đăng nhập).
- Truy cập `/admin` → Redirect về `/[locale]/admin/dashboard`.
- Phân nhóm thư mục `(auth)` và `(dashboard)` là Route Groups, giúp tách biệt hoàn toàn Shell Layout (Sidebar/Topbar) khỏi trang Login.

---

## 3. Ma Trận Phân Quyền Theo Hành Động (Action-Level RBAC Matrix)

| Hành Động Nghiệp Vụ (Action) | API Endpoint Backend Tương Ứng | SUPER_ADMIN (TBD) | ADMIN | MODERATOR |
|---|---|:---:|:---:|:---:|
| **Xem bảng thống kê Dashboard** | `GET /api/auth/admin/dashboard/stats` | ✅ | ✅ | ✅ |
| **Xem danh sách người dùng** | `GET /api/auth/admin/users` | ✅ | ✅ | ❌ |
| **Khóa tài khoản (Ban user)** | `POST /api/auth/admin/users/{id}/ban` | ✅ | ✅ | ❌ |
| **Mở khóa tài khoản (Unban user)** | `POST /api/auth/admin/users/{id}/unban` | ✅ | ✅ | ❌ |
| **Gán vai trò người dùng (Assign role)** | `POST /api/auth/admin/users/{id}/roles` | ✅ | ✅ | ❌ |
| **Thu hồi vai trò (Remove role)** | `DELETE /api/auth/admin/users/{id}/roles/{role}` | ✅ | ✅ | ❌ |
| **Xem hàng đợi tố cáo (Report queue)** | `GET /api/admin/reports` | ✅ | ✅ | ✅ |
| **Duyệt vi phạm (Resolve report)** | `PATCH /api/admin/reports/{id}/resolve` | ✅ | ✅ | ✅ |
| **Bác bỏ tố cáo (Dismiss report)** | `PATCH /api/admin/reports/{id}/dismiss` | ✅ | ✅ | ✅ |
| **Xem danh mục Roles & Permissions** | `GET /api/auth/admin/roles`, `/permissions` | ✅ | ✅ | ❌ |
| **Tạo vai trò động mới (Create role)** | `POST /api/auth/admin/roles` | ✅ | ✅ | ❌ |
| **Xóa vai trò động (Delete role)** | `DELETE /api/auth/admin/roles/{id}` | ✅ | ⚠️ **TBD** | ❌ |
| **Xem sức khỏe hệ thống (System health)** | `GET /actuator/health` | ✅ | ✅ | ❌ |

> ⚠️ **Ghi chú về SUPER_ADMIN:** Khái niệm `SUPER_ADMIN` hiện tại là **TBD** (chưa xuất hiện trong schema của backend `auth-service`, hiện tại backend chỉ mới ghi nhận role `ADMIN` và các role động). Cần xác nhận với Backend team ở Phase 2.
> ⚠️ **Ghi chú về Xóa Role:** Backend cấm xóa role hệ thống (`system: true`). Việc tài khoản `ADMIN` có được xóa role động của `ADMIN` khác tạo ra hay không là **TBD**.

---

## 4. Hiển Thị Menu Sidebar Theo Vai Trò (Sidebar Menu Visibility)
- **Role `ADMIN` / `SUPER_ADMIN`:** Hiển thị 100% các mục menu: `Dashboard`, `Người dùng`, `Kiểm duyệt`, `Vai trò & Quyền`, `Hạ tầng & Sức khỏe`.
- **Role `MODERATOR`:** Hệ thống tự động lọc và chỉ render 2 mục menu: `Dashboard` và `Kiểm duyệt` (Báo cáo vi phạm). Toàn bộ các menu liên quan đến quản lý User, RBAC và Hạ tầng bị ẩn khỏi DOM.

---

## 5. Cơ Chế Route Guard 2 Tầng (Two-Tier Route Guard)
1. **Tầng 1 — Next.js 15 Middleware (`middleware.ts` tại Edge Runtime):**
   - Chặn đứng mọi request không có cookie `admin_access_token` khi truy cập vào `/[locale]/admin/**` (ngoại trừ `/login`).
   - Tự động chuyển hướng `307 Temporary Redirect` về `/[locale]/admin/login?redirect=...`.
2. **Tầng 2 — Server Component / Layout Guard (`(dashboard)/layout.tsx`):**
   - Giải mã token hoặc đọc thông tin session từ cache.
   - Nếu role của người dùng không thỏa mãn điều kiện truy cập của trang (ví dụ: `MODERATOR` cố tình gõ trực tiếp URL `/admin/users` trên thanh địa chỉ):
     - Lập tức kích hoạt render component **`ForbiddenState` (Mã 403)** hoặc gọi hàm `notFound()` để che giấu sự tồn tại của trang nhạy cảm.

---

## 6. Xử Lý Các Trang Trạng Thái Lỗi (Error Pages)
- **`src/app/[locale]/not-found.tsx`:** Hiển thị giao diện 404 bản địa hóa khi truy cập sai đường dẫn hoặc khi gọi `notFound()`.
- **`src/app/[locale]/error.tsx`:** Error Boundary bản địa hóa cho lỗi 500 phát sinh trong quá trình render Server Component.
- **Component `ForbiddenState`:** Component hiển thị cảnh báo không đủ quyền hạn (403), đi kèm nút điều hướng quay về Dashboard.

---

## 7. Quản Lý Trạng Thái Trên URL (URL State Synchronization)
- Toàn bộ trạng thái lọc bảng, tìm kiếm, phân trang và sắp xếp **bắt buộc đồng bộ vào URL Search Parameters**:
  - Ví dụ: `/[locale]/admin/moderation/reports?page=1&size=20&status=PENDING&targetType=POST`.
  - Giúp Quản trị viên có thể copy link chia sẻ ca trực hoặc F5 tải lại trang mà không bị mất bộ lọc.
- **Trạng thái Drawer/Modal chi tiết:** Việc lưu ID mở drawer trên URL (ví dụ `?drawerId=123`) là **TBD** (Sẽ chốt tại Sprint 2.2).
- **Trạng thái triển khai (2026-10-08):** Sprint 2.3 (`/admin/users`) triển khai theo brief với `useState` cục bộ — **chưa** đồng bộ vào URL. Đã ghi nhận tại [conventions.md §16](conventions.md) và sẽ chuẩn hoá ở Sprint 3.3. Các trang 2.5 (reports), 2.6 (media) khi làm cần tuân thủ mục này ngay từ đầu.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
