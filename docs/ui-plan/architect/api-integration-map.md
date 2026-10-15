# API Integration Map — Backend Endpoints to Admin UI Components

## 1. Context & Self-Contained Scope
Tài liệu này là đặc tả quy chuẩn độc lập (self-contained) về bản đồ đối chiếu toàn bộ các endpoint backend REST API của Snapgram (từ API Gateway, Auth Service, Content Service đến Actuator) với từng màn hình, thành phần giao diện và DTO tương ứng trên **Snapgram Admin Portal**. Tài liệu gắn kết trực tiếp với:
- [overview.md](../overview.md): Kiến trúc tổng thể và microservices.
- [frontend-architecture.md](frontend-architecture.md): Tổ chức services và TanStack Query hooks.
- [auth-and-security-flow.md](auth-and-security-flow.md): Luồng xác thực cookie và chặn login.
- [conventions.md](conventions.md): Quy ước đặt tên mutation và query keys.

---

## 2. Module Xác Thực (Admin Authentication)

| Endpoint | Method | Microservice | UI Component tương ứng | Request / Payload | DTO / Response |
|---|---|---|---|---|---|
| `/api/auth/admin/login` | `POST` | Auth (`:8081`) | Form Đăng nhập Admin (`LoginForm`) | `{ email, password }` | Set-Cookie `admin_access_token` + `AuthResponse` |
| `/api/auth/me` | `GET` | Auth (`:8081`) | Header User Profile, Route Guard | N/A (gửi Cookie) | `UserMeResponse` = `{ id, username, email, role, displayName, avatarUrl?, emailVerified, createdAt }` — **`role` số ít, KHÔNG có `roles`** (đã verify Swagger sống). ✅ Gọi được bằng cookie `admin_access_token` (BI-010 đã fix 2026-10-16) |
| `/api/auth/logout` | `POST` | Auth (`:8081`) | Nút Đăng xuất (`LogoutButton`) | N/A | **204 No Content** + clear 3 cookie (`admin_access_token`, `access_token`, `refresh_token`) với `Max-Age=0`. ✅ Gọi được bằng cookie `admin_access_token` (BI-010 đã fix 2026-10-16) |
| `/api/auth/admin/bootstrap` | `POST` | Auth (`:8081`) | Màn hình setup ban đầu (Dev only) | `{ usernameOrEmail, secretKey }` | `200 OK` (Cấp role ADMIN) |

---

## 3. Module Dashboard Tổng Quan (Dashboard Stats)

| Endpoint | Method | Microservice | UI Component tương ứng | Request / Payload | DTO / Response |
|---|---|---|---|---|---|
| `/api/auth/admin/dashboard/stats` | `GET` | Auth (`:8081`) | `StatCardGroup`, `RecentUsersTable` | N/A | `AdminDashboardResponse` (`totalUsers`, `activeUsers`, `bannedUsers`, `newUsersToday`, `recentUsers`) |

---

## 4. Module Quản Lý Người Dùng (User Management)

| Endpoint | Method | Microservice | UI Component tương ứng | Request / Payload | DTO / Response |
|---|---|---|---|---|---|
| `/api/auth/admin/users` | `GET` | Auth (`:8081`) | Bảng danh sách user (`UserTable`) | Query params: `page`, `size` | `Page<AdminUserResponse>` |
| `/api/auth/admin/users/{userId}` | `GET` | Auth (`:8081`) | Dialog chi tiết user (`UserDetailDialog`) | Path variable `userId` | `AdminUserResponse` |
| `/api/auth/admin/users/{userId}/ban` | `POST` | Auth (`:8081`) | Modal khóa tài khoản (`BanUserDialog`) | `{ reason: string }` | `AdminUserResponse` (`banned: true`) |
| `/api/auth/admin/users/{userId}/unban` | `POST` | Auth (`:8081`) | Modal mở khóa (`UnbanConfirmDialog`) | N/A | `AdminUserResponse` (`banned: false`) |
| `/api/auth/admin/users/{userId}/roles` | `POST` | Auth (`:8081`) | Dropdown cấp quyền (`RoleAssignMenu`) | `{ role: "ADMIN" \| "MODERATOR" }` | `AdminUserResponse` |
| `/api/auth/admin/users/{userId}/roles/{role}` | `DELETE` | Auth (`:8081`) | Nút xóa role khỏi user | Path variable `role` | `AdminUserResponse` |

---

## 5. Module Kiểm Duyệt Nội Dung & Báo Cáo (Content Moderation)

| Endpoint | Method | Microservice | UI Component tương ứng | Request / Payload | DTO / Response |
|---|---|---|---|---|---|
| `/api/admin/reports` | `GET` | Content (`:8084`) | Bảng kiểm duyệt (`ModerationQueueTable`) | `status`, `targetType`, `page`, `size` | `Page<ReportResponse>` |
| `/api/admin/reports/{id}` | `GET` | Content (`:8084`) | Dialog chi tiết report (`ReportDetailDialog`) | Path variable `id` | `ReportResponse` |
| `/api/admin/reports/{id}/resolve` | `PATCH` | Content (`:8084`) | Nút Duyệt vi phạm (`ResolveReportButton`) | N/A | `ReportResponse` (`status: RESOLVED`) |
| `/api/admin/reports/{id}/dismiss` | `PATCH` | Content (`:8084`) | Nút Bác bỏ report (`DismissReportButton`) | N/A | `ReportResponse` (`status: DISMISSED`) |

---

## 6. Module Quản Lý Media & Tệp Tin (Media Management)

Dịch vụ Media (`:8085`) hỗ trợ 2 luồng tải lên:
- **Presigned Upload Flow (Khuyên dùng cho video / file lớn):** 
  1. `POST /api/media/presigned` nhận `uploadUrl` và `mediaId`.
  2. Client PUT trực tiếp file binary lên MinIO qua `uploadUrl`.
  3. `POST /api/media/{id}/confirm` xác nhận upload thành công và trích xuất metadata.
- **Direct Upload Flow (Dành cho avatar / ảnh nhỏ):** 
  - `POST /api/media/upload` (multipart/form-data) gửi file trực tiếp lên server lưu trữ.

| Endpoint | Method | Microservice | UI Component tương ứng | Request / Payload | DTO / Response |
|---|---|---|---|---|---|
| `/api/media/me` | `GET` | Media (`:8085`) | Bảng thư viện media (`MediaLibraryGrid`) | Query params: `page`, `size` | `PageMediaResponse` |
| `/api/media/presigned` | `POST` | Media (`:8085`) | Bộ tải lên presigned (`MediaUploader` - Bước 1) | `PresignedUrlRequest` (`fileName`, `mimeType`, `sizeBytes`) | `PresignedUrlResponse` (`mediaId`, `uploadUrl`, `fileUrl`, `expiresInSeconds`) |
| `{uploadUrl}` (MinIO Direct) | `PUT` | MinIO Storage | Bộ tải lên presigned (`MediaUploader` - Bước 2) | File binary | `200 OK` (từ MinIO S3) |
| `/api/media/{id}/confirm` | `POST` | Media (`:8085`) | Bộ tải lên presigned (`MediaUploader` - Bước 3) | Path variable `id` | `MediaResponse` |
| `/api/media/upload` | `POST` | Media (`:8085`) | Tải lên trực tiếp (`MediaDirectUploader`) | `multipart/form-data` (`file`) | `MediaResponse` |
| `/api/media/{id}` | `GET` | Media (`:8085`) | Modal xem chi tiết media (`MediaPreviewDialog`) | Path variable `id` | `MediaResponse` |
| `/api/media/{id}` | `DELETE` | Media (`:8085`) | Hộp thoại xác nhận xóa tệp media (`MediaDeleteConfirm`) | Path variable `id` | `200 OK` (Empty body) |

---

## 7. Module Giám Sát Hạ Tầng & Sức Khỏe (Infrastructure & Health)

| Endpoint | Method | Host / Port | UI Component tương ứng | Ghi chú |
|---|---|---|---|---|
| `/actuator/health` | `GET` | Gateway / Auth / Content | `ServiceHealthIndicator` | Kiểm tra UP/DOWN, database connection, disk space |
| Direct link | N/A | `:8089` | `ExternalNavButton` | Truy cập trực tiếp **Kafka UI** |
| Direct link | N/A | `:9001` | `ExternalNavButton` | Truy cập trực tiếp **MinIO S3 Console** |
| Direct link | N/A | `:8025` | `ExternalNavButton` | Truy cập trực tiếp **Mailpit Web** |
