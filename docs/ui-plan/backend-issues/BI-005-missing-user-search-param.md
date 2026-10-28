# BI-005: Thiếu Tham Số Tìm Kiếm Từ Khoá (`q`) Trên Endpoint Danh Sách Người Dùng Admin

- **Priority:** `P1` (Important)
- **Status:** `Fixed` (2026-10-16)
- **Module ảnh hưởng:** `auth-service` (`admin-controller`)
- **Ngày phát hiện:** 2026-10-08
- **Phát hiện tại:** Sprint 2.3 (User Management)

---

## 1. Mô Tả Vấn Đề

Endpoint `GET /api/auth/admin/users` (operation `getUsers`) **chỉ nhận 2 tham số truy vấn là `page` và `size`**. Không có bất kỳ tham số nào cho phép lọc/tìm kiếm theo từ khoá, trạng thái (`banned`) hay vai trò (`role`) — trong khi đây là các nhu cầu lọc cơ bản của một màn hình quản trị danh sách người dùng.

Đáng chú ý: hệ thống **đã có** một endpoint tìm kiếm `GET /api/users/search?q=...` (operation `searchUsers`), nhưng endpoint này:
- Thuộc `user-controller` (phạm vi người dùng thường), **không phải** admin-scoped.
- Trả về `PageUserProfileResponse` — **thiếu hoàn toàn** các trường mà màn hình admin cần: `banned`, `bannedAt`, `banReason`, `role`, `roles`.

Vì vậy không thể tái sử dụng `searchUsers` để thay thế cho danh sách người dùng admin.

---

## 2. Ảnh Hưởng Tới Phía Frontend (Impact)

- Màn hình `/[locale]/admin/users` (`UserDataTable`) có ô tìm kiếm bắt buộc debounce 300ms theo [conventions.md §15](../architect/conventions.md). Vì backend chưa có tham số `q`, Frontend buộc phải chọn một trong các giải pháp đều không lý tưởng:
  - Gửi `q` lên nhưng backend bỏ qua → người dùng gõ từ khoá mà bảng **không lọc**, gây hiểu nhầm là hệ thống lỗi.
  - Lọc client-side trên trang hiện tại (20 bản ghi) → báo "không có kết quả" **sai** khi người dùng cần tìm nằm ở trang khác.
- Không thể lọc theo `status`/`role` ở tầng server → mọi bộ lọc trạng thái đều phải chấp nhận sai số hoặc không triển khai được.
- Với quy mô lớn, việc tải toàn bộ danh sách về client để tự lọc là phương án không khả thi (`totalElements` có thể lên hàng chục nghìn).

---

## 3. Bằng Chứng Tài Liệu API (Evidence)

> ✅ **Đã xác minh trên Swagger sống** (`http://localhost:8081/v3/api-docs`, 2026-10-08). Trích xuất trực tiếp từ `components.schemas` + `paths`:
>
> ```
> GET /api/auth/admin/users | params: page:query, size:query
> ```
>
> Backend thật cũng xác nhận `AdminUserResponse` có đúng 15 trường (khớp schema FE) và **không có** tham số lọc nào khác. Vấn đề này không phải lỗi của tài liệu markdown mà là giới hạn thực tế của API.

- Danh sách tham số của `getUsers` trong [`api-docs/auth-apidocs.md`](../api-docs/auth-apidocs.md) (mục `admin-controller`):

  | Tên    | Vị trí  | Kiểu               | Bắt buộc | Mặc định |
  | :----- | :-----: | :----------------- | :------: | :------- |
  | `page` | `query` | `integer (int32)`  |  Không   | `0`      |
  | `size` | `query` | `integer (int32)`  |  Không   | `20`     |

- Tham số của `searchUsers` (`GET /api/users/search`) — có `q` nhưng trả sai DTO:

  | Tên    | Vị trí  | Kiểu              | Bắt buộc | Mặc định |
  | :----- | :-----: | :---------------- | :------: | :------- |
  | `q`    | `query` | `string`          | **Có**   | -        |
  | `page` | `query` | `integer (int32)` |  Không   | `0`      |
  | `size` | `query` | `integer (int32)` |  Không   | `20`     |

- Schema `UserProfileResponse` (response của `searchUsers`) — **không có** `banned` / `bannedAt` / `banReason` / `role` / `roles`.
- `AdminUserResponse` (response admin cần) — **có đủ** các trường trên.

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)

Bổ sung tham số lọc cho `GET /api/auth/admin/users` (giữ nguyên shape `PageAdminUserResponse`):

| Tham số  | Vị trí  | Kiểu      | Bắt buộc | Mô tả                                                             |
| :------- | :-----: | :-------- | :------: | :----------------------------------------------------------------- |
| `q`      | `query` | `string`  |  Không   | Tìm tương đối (case-insensitive) trên `username`, `email`, `displayName` |
| `status` | `query` | `enum`    |  Không   | `ACTIVE` \| `BANNED` \| `PENDING`                                    |
| `role`   | `query` | `string`  |  Không   | Lọc theo vai trò, ví dụ `ADMIN`, `MODERATOR`                         |
| `sort`   | `query` | `string`  |  Không   | Ví dụ `createdAt,desc` (mặc định)                                    |

Kèm theo:
- Giới hạn `q` tối thiểu 2 ký tự để tránh full-table scan.
- Trả về `totalElements` **sau khi lọc** (để phân trang phía FE chính xác).
- Cân nhắc bổ sung `q` cho `GET /api/auth/admin/roles` và các endpoint danh sách admin khác để nhất quán.

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)

Theo quyết định đã chốt với Tech Lead tại Sprint 2.3 (2026-10-08):

1. **Vẫn triển khai đúng chuẩn** theo [conventions.md §15](../architect/conventions.md): ô tìm kiếm debounce 300ms (`useDebounce`), chỉ gọi API khi từ khoá ≥ 2 ký tự, từ khoá đã debounce được đưa vào query key.
2. Tham số `q` **vẫn được gửi** trong request tới `/api/auth/admin/users` → khi backend bổ sung tham số, tính năng hoạt động ngay **không cần sửa Frontend**.
3. Trong lúc chờ backend, MSW mock (`src/mocks/handlers/users.handlers.ts`) tự thực hiện lọc theo `q` để test và demo phản ánh đúng hành vi mong đợi.
4. Đánh dấu `// TODO(BI-005)` ngay tại service để dễ truy vết.
5. **Bộ lọc `status`/`role` bị hoãn** cho tới khi backend có tham số tương ứng — không triển khai lọc client-side để tránh hiển thị sai.

---

## 6. Verification (Sau Khi BE Fix — 2026-10-16)

**Backend change:** `auth-service` — `AdminController`/`UserService` nay bind `q` (search động + filter status/role + whitelist sort), commit `d4ece81`.

**Runtime verify** (`GET /api/auth/admin/users`, cookie `admin_access_token`):

```
?q=admin&page=0&size=20        → totalElements = 1
?q=zzzznomatch&page=0&size=20  → totalElements = 0   ← KHÁC với q=admin ⇒ filter chạy thật
(không có q)&page=0&size=20    → totalElements = 1
```

**Kết luận:** BI-005 đã fix. Nếu chưa fix, `q=zzzznomatch` cũng sẽ trả `1` (tham số `q` bị bỏ qua).

---

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
