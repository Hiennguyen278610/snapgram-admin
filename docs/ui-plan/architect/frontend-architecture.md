# Frontend Architecture & Technical Plan — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này xác lập quy chuẩn kỹ thuật độc lập (self-contained) về kiến trúc hệ thống, tổ chức thư mục mã nguồn Next.js 15, phân tầng dữ liệu và tích hợp Server State của **Snapgram Admin Portal**. Tài liệu gắn kết trực tiếp với:
- [overview.md](../overview.md): Mục tiêu và lộ trình toàn bộ dự án.
- [conventions.md](conventions.md): Quy ước đặt tên file, component và phong cách viết mã.
- [auth-and-security-flow.md](auth-and-security-flow.md): Luồng bảo vệ token, middleware và route guards.
- [api-integration-map.md](api-integration-map.md): Danh mục API REST endpoint tích hợp.
- [../absolute-rules.md](../absolute-rules.md): Các điều luật bất biến về emoji, gradient và CLI shadcn.

---

## 2. Môi Trường & Công Nghệ Cốt Lõi (Core Environment)

Toàn bộ ứng dụng Admin Portal được xây dựng và chuẩn hóa trên nền tảng:
- **Node Runtime:** `Node.js >= 22.0.0`
- **Package Manager:** `pnpm v10+` (sử dụng pnpm workspace hoặc standalone pnpm, nghiêm cấm dùng npm/yarn)
- **Framework:** **Next.js 15 (App Router)** với TypeScript strict mode, tối ưu Server Components (RSC) kết hợp Client Components cho tương tác dashboard.

```
Client Admin (Next.js 15 App Router - Node 22, pnpm 10)
       │ (Requests with httpOnly Cookies)
       ▼
   API Gateway (Spring Cloud Gateway :8080)
       │ - Kiểm tra JWT Cookie / Bearer
       │ - Trích xuất claims (X-User-Id, X-User-Roles)
       ├─────────────────────────────────┐
       ▼                                 ▼
Auth Service (:8081)             Content Service (:8084)
- /api/auth/admin/**             - /api/admin/reports/**
- hasRole("ADMIN")               - UserContext.requireAdmin()
```

> **Lưu ý routing:** Toàn bộ request từ Admin FE đi qua Gateway (`:8080`). Gateway đọc cookie `admin_access_token` và inject `X-User-Id` cho các downstream service (Content :8084, Media :8085). FE KHÔNG tự gửi `X-User-Id`.

---

## 3. Cấu Trúc Thư Mục Source Code Dự Kiến

```
admin-client/
├── package.json                  # "packageManager": "pnpm@10.x", "engines": { "node": ">=22" }
├── pnpm-lock.yaml
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── (auth)/login/
│   │   └── (dashboard)/
│   │       ├── layout.tsx        # Shell layout (Sidebar + Header + Server Guard)
│   │       ├── dashboard/
│   │       ├── users/
│   │       │   └── [id]/
│   │       ├── reports/
│   │       └── system/
│   ├── components/
│   │   ├── ui/                   # Primitive components (Button, Input, Dialog từ shadcn via pnpm dlx)
│   │   ├── shared/               # PageHeader, DataTable, StatCard, ConfirmDialog
│   │   └── modules/              # UserTable, BanUserModal, ReportPreviewCard
│   ├── hooks/                    # useAdminAuth, useDebounce, useMediaQuery
│   ├── services/                 # Axios instance hoặc Ky/Fetch wrapper
│   │   ├── api-client.ts         # Base client cấu hình withCredentials: true
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   └── reports.service.ts
│   ├── types/                    # TypeScript interfaces đối chiếu chính xác với DTO backend
│   └── stores/                   # Zustand (lưu UI state, sidebar collapsed, theme)
```

---

## 4. Quản Lý Trạng Thái & Data Fetching

### 4.1. TanStack Query (React Query v5)
- Quản lý toàn bộ server state (Cache, Polling, Invalidation).
- **Stale Time cấu hình:**
  - `Dashboard Stats`: 30 giây (hoặc có nút manual refresh).
  - `User List`: 1 phút.
  - `Reports List`: 15 giây (hoặc WebSocket event cập nhật real-time).
- **Optimistic Updates:** Khi Admin bấm Ban User hoặc Resolve Report, UI cập nhật badge ngay lập tức trước khi server phản hồi để trải nghiệm mượt mà nhất.

### 4.2. Zustand Store (Client State)
- Chỉ quản lý state của giao diện:
  - `sidebarCollapsed: boolean`
  - `theme: 'dark' | 'light' | 'system'`
  - `activeModals: { banUserId: string | null, resolveReportId: string | null }`

---

## 5. Xử Lý Lỗi Tập Trung & Toast Notifications

- Tích hợp thư viện `sonner` cho notification.
- Toàn bộ HTTP errors từ backend (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `429 Too Many Requests`) được interceptor tự động bắt và hiện toast tương ứng:
  - `401`: Token hết hạn -> Xóa local state và redirect về `/admin/login`.
  - `403`: Hiển thị cảnh báo "Bạn không có quyền hạn Admin để thực hiện tác vụ này".
  - `429`: Hiển thị "Vượt quá giới hạn request, vui lòng thử lại sau X giây".
