# Layout System & Viewport Architecture — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này là đặc tả quy chuẩn độc lập (self-contained) về cấu trúc khung nhìn (viewport), hệ thống lưới (layout grid), phân chia không gian và cách tổ chức các khung chứa (containers) của **Snapgram Admin Portal**. Tài liệu liên kết mật thiết với:
- [overview.md](../overview.md): Kiến trúc tổng quan hệ thống phân hệ Admin.
- [absolute-rules.md](../absolute-rules.md): Các điều luật bất biến về emoji, gradient và CLI.
- [design-system.md](design-system.md): Bảng màu, typography và semantic tokens.
- [component-inventory.md](component-inventory.md): Danh mục chi tiết các component đặt trong layout.
- [layouts-and-navigation.md](layouts-and-navigation.md): Sơ đồ sidebar, topbar và thanh điều hướng.

## 2. Hệ Thống Khung Nhìn Tổng Thể (Shell Viewport Architecture)

### 2.1. Viewport Outer Canvas
- **Background:** `bg-[#e6ebf5]` (Dark: `bg-[#09090b]`).
- **Padding ngoài:** `p-2 sm:p-5 lg:p-8`.
- **Display:** `min-h-screen flex items-center justify-center`.
- **Mục tiêu:** Tạo trải nghiệm SaaS desktop đóng gói trong một ứng dụng trung tâm gọn gàng, cách ly hoàn toàn khỏi màn hình người dùng thông thường.

### 2.2. Master App Container (Main Frame)
- **Kích thước tối đa:** `w-full max-w-[1440px] min-h-[920px]`.
- **Background:** `bg-white` (Dark: `bg-[#18181b]`).
- **Bo góc chuẩn:** `rounded-[32px] sm:rounded-[40px]`.
- **Viền ngoài:** `border border-white/60` (Dark: `border-zinc-800`).
- **Đổ bóng mềm:** `shadow-[0_20px_45px_-15px_rgba(26,42,70,0.12)]`.
- **Padding trong:** `p-5 sm:p-7 lg:p-9`.
- **Bố cục Flex:** `flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden`.

---

## 3. Phân Khu Chức Năng (Layout Zones)

### 3.1. Left Zone — Sidebar Cố Định (Fixed Navigation Panel)
- **Độ rộng:** `w-full lg:w-[260px] xl:w-[280px] flex-shrink-0`.
- **Đường phân cách:** `border-b lg:border-b-0 lg:border-r border-gray-100/80 pr-0 lg:pr-7 pb-6 lg:pb-0` (Dark: `border-zinc-800`).
- **Cấu trúc trục dọc (Vertical Axis):**
  1. **Top Brand Header:** Logo Snapgram Wordmark (font `Grand Hotel`, kích thước `text-3xl`).
  2. **Admin Profile Center Widget:** Avatar tròn viền ring, Tên, Username, Role badge, bảng dải 3 thông số cá nhân (`Audits`, `Actions`, `Pending`).
  3. **Nav Items Menu:** Dải nút điều hướng dọc (`Dashboard`, `User Management`, `Moderation`, `RBAC Roles`, `System Health`).
  4. **Bottom Footer Action:** Nút `Logout` đặt sát đáy có viền ngăn cách `border-t border-gray-100 pt-4`.

### 3.2. Right Zone — Main Working Canvas (Main Content Panel)
- **Độ rộng:** `flex-1 flex flex-col min-w-0`.
- **Cấu trúc 3 tầng (3-Tier Layout):**
  1. **Tầng 1 — Top Header Bar:**
     - Search Bar bo tròn pill (`max-w-[390px]`, `rounded-full`).
     - Action Tools: Icon Chuông thông báo (kèm unread dot), Icon Tin nhắn, Nút CTA `brand-action-gradient` (*Tạo thông báo toàn hệ thống*).
  2. **Tầng 2 — Highlight / Quick Stats Bar:**
     - Dải thanh cuộn ngang `overflow-x-auto no-scrollbar` hiển thị Quick Status, phiên trực Admin, cảnh báo server tải cao hoặc số lượng report chờ xử lý cấp bách.
  3. **Tầng 3 — Dynamic Working Grid (Content Area):**
     - Dashboard mode: 3-Column Responsive Grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`).
     - Data Table mode: Bảng dữ liệu toàn màn hình phẳng kèm bộ lọc và pagination.

---

## 4. Quy Chuẩn Responsive & Breakpoints

| Breakpoint | Chiều rộng màn hình | Hành vi bố cục |
|---|---|---|
| `< 640px` (Mobile) | Dưới 640px | Sidebar thu gọn lên trên đỉnh dạng accordion hoặc ẩn trong Drawer; Container bỏ bớt padding còn `p-3`. |
| `640px - 1023px` (Tablet) | 640px đến 1023px | Sidebar dạng horizontal stack hoặc icon rail thu nhỏ; Grid làm việc chuyển về 1-2 cột. |
| `>= 1024px` (Desktop) | Trên 1024px | Bố cục chuẩn mực 2 cột lớn (Sidebar 280px + Main Canvas 1100px+), cố định chiều cao tối thiểu 920px. |
