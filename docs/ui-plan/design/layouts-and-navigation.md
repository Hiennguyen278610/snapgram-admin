# Layouts & Navigation Specification — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này xác lập quy chuẩn độc lập (self-contained) về cấu trúc khung nhìn (Shell Layout), thanh điều hướng Sidebar, Header, Breadcrumbs và hộp lệnh tìm kiếm toàn cục (Command Palette) của **Snapgram Admin Portal**. Tài liệu gắn kết trực tiếp với:
- [overview.md](../overview.md): Mục tiêu và cấu trúc toàn bộ phân hệ UI.
- [design-system.md](design-system.md): Bảng màu, typography và tokens hiển thị.
- [../absolute-rules.md](../absolute-rules.md): Ràng buộc cấm emoji, hạn chế gradient và lệnh kéo shadcn.
- [../architect/auth-and-security-flow.md](../architect/auth-and-security-flow.md): Luồng chặn trang trước khi login và bảo vệ quyền RBAC.

---

## 2. Cấu Trúc Khung Nhìn (Shell Layout)

Khung nhìn tổng thể sử dụng cấu trúc **Collapsible Sidebar + Fixed Topbar + Scrollable Main Content**:

```
+-----------------------------------------------------------------------------------+
|  [Logo Snapgram Admin]  |  [Breadcrumbs]      [Cmd+K Search]   [Health Status] [Profile] |
+-------------------------+---------------------------------------------------------+
| [Dashboard]             |                                                         |
| [Users Management]      |                                                         |
| [Content Moderation]    |               PAGE CONTENT AREA                         |
|   - Reports             |            (Scrollable, max-w-7xl)                      |
| [RBAC & Permissions]    |                                                         |
| [System & Health]       |                                                         |
|                         |                                                         |
| ----------------------- |                                                         |
| [Admin info / Logout]   |                                                         |
+-------------------------+---------------------------------------------------------+
```

---

## 2. Các Thành Phần Khung (Layout Components)

### 2.1. Sidebar Navigation
- **Kích thước:** Chiều rộng chuẩn 260px, có thể thu gọn (collapse) về 72px chỉ hiện icon khi click nút thu nhỏ.
- **Nhóm menu:**
  - **TỔNG QUAN (Overview):**
    - `Dashboard` (Icon `LayoutDashboard`) -> `/admin/dashboard`
  - **VẬN HÀNH NGƯỜI DÙNG (User Ops):**
    - `Người dùng` (Icon `Users`) -> `/admin/users`
    - `Vai trò & Quyền` (Icon `ShieldAlert`) -> `/admin/rbac`
  - **KIỂM DUYỆT (Moderation):**
    - `Báo cáo vi phạm` (Icon `Flag`) -> `/admin/moderation/reports` *(Có badge số lượng PENDING đỏ nhấp nháy)*
  - **HẠ TẦNG & HỆ THỐNG (Infrastructure):**
    - `Health Check` (Icon `Activity`) -> `/admin/system-health`
    - `Kafka UI` (External Link icon `ExternalLink`) -> Mở tab mới port 8089
    - `MinIO S3` (External Link) -> Mở tab mới port 9001
- **Phần chân Sidebar (Footer):**
  - Avatar Admin, Email hiện tại, Role badge (`ADMIN`).
  - Nút Đăng xuất (`LogOut`) với confirmation popup.

### 2.2. Top Navigation Bar
- **Sticky top:** Cao 60px, border-b với `border-subtle`, backdrop-blur.
- **Breadcrumbs:** Hiển thị vị trí điều hướng phân cấp (vd: `Admin > Người dùng > hoang_dev`).
- **Global Search / Command Palette (`Cmd + K` hoặc `Ctrl + K`):**
  - Cho phép gõ nhanh tìm người dùng theo username/email, hoặc nhảy nhanh đến trang cấu hình.
- **Service Status Pill:** Đèn xanh nhỏ báo hiệu kết nối API Gateway (`Gateway: Online`).
- **Theme toggle:** DropdownMenu 3 lựa chọn (Sáng / Tối / Theo hệ thống), dùng `next-themes`, icon Lucide (`Sun`/`Moon`/`Monitor`), mặc định `system`. Chi tiết tại [theme-mode.md](theme-mode.md).

---

## 3. Quản Lý Ngăn Chứa Nội Dung (Content Area)

- **Độ rộng khung:** Tối đa `max-w-7xl` căn giữa hoặc trải rộng `w-full px-6 py-6`.
- **Page Header đồng bộ:**
  - Tiêu đề màn hình (`h1` - Display 1)
  - Mô tả phụ một dòng giải thích tính năng
  - Nhóm nút thao tác chính bên góc phải (vd: Nút "Tải lại", "Xuất CSV", "Tạo quyền mới").
