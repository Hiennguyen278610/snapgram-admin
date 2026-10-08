# BI-007: `description` Của Permission Là Tiếng Việt Cố Định, API Không Hỗ Trợ Bản Địa Hoá

- **Priority:** `P2` (Nice-to-have / Chuẩn hoá kỹ thuật)
- **Status:** `Open`
- **Module ảnh hưởng:** `auth-service` (`admin-controller` → `GET /api/auth/admin/permissions`, `GET /api/auth/admin/roles`)
- **Ngày phát hiện:** 2026-10-08
- **Phát hiện tại:** Sprint 2.4 (RBAC & Permissions)

> **Lý do xếp `P2` (không phải `P1`)**: đây là lỗi bản địa hoá thật, nhưng chỉ ảnh hưởng tới **trường mô tả phụ** của một màn hình quản trị, và trường định danh chính (`name`, ví dụ `USER:BAN`) là trung tính ngôn ngữ nên UI vẫn dùng được ở cả `en` và `vi`. Không ảnh hưởng chức năng.

---

## 1. Mô Tả Vấn Đề

Trường `description` của permission được **seed cứng bằng tiếng Việt** trong migration và được API trả về **nguyên văn**, không có bất kỳ cơ chế bản địa hoá nào.

`auth-service/src/main/resources/db/migration/V5__create_rbac_dynamic_roles_and_permissions.sql#L44-L62`:

```sql
INSERT INTO auth_permissions (name, category, description) VALUES
('USER:BAN',        'USER_MANAGEMENT',    'Khóa tài khoản người dùng vi phạm'),
('CONTENT:MODERATE','CONTENT_MODERATION', 'Truy cập trung tâm kiểm duyệt nội dung'),
('COMMENT:DELETE',  'CONTENT_MODERATION', 'Xóa bình luận vi phạm'),
...
```

Kiểm tra toàn bộ `auth-service/src/main/java`: **không có** `Accept-Language`, `LocaleContextHolder` hay `MessageSource` → không có đường nào để client yêu cầu ngôn ngữ khác.

---

## 2. Ảnh Hưởng Tới Phía Frontend (Impact)

- Portal có 2 locale (`en`, `vi`). Ở locale **`en`**, ma trận permission vẫn hiển thị mô tả **tiếng Việt** → trải nghiệm bản địa hoá bị phá vỡ ở màn hình RBAC.
- FE **không thể tự dịch**: `description` là văn bản tự do từ DB, không phải khoá i18n, và không có mapping ổn định nào ngoài `name`.
- Nếu FE cố dịch theo `name` thì phải bảo trì thêm 17 khoá i18n song song với DB — mỗi lần backend thêm permission mới, FE sẽ hiển thị thiếu nhãn (và không có cách nào phát hiện sớm).

---

## 3. Bằng Chứng (Swagger sống + gọi API thật, 2026-10-08)

`GET http://localhost:8080/api/auth/admin/permissions` với cookie `admin_access_token` hợp lệ → `200`:

```json
{
  "CONTENT_MODERATION": [
    { "id": "4e75686a-...", "name": "COMMENT:DELETE", "category": "CONTENT_MODERATION",
      "description": "Xóa bình luận vi phạm" },
    { "id": "a0680559-...", "name": "CONTENT:MODERATE", "category": "CONTENT_MODERATION",
      "description": "Truy cập trung tâm kiểm duyệt nội dung" }
  ],
  "USER_MANAGEMENT": [
    { "id": "...", "name": "USER:BAN", "category": "USER_MANAGEMENT",
      "description": "Khóa tài khoản người dùng vi phạm" }
  ]
}
```

`RoleDetailResponse.permissions[]` cũng mang đúng các object này (`id`, `name`, `category`, `description`), nên màn hình chi tiết role cũng bị ảnh hưởng tương tự.

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)

Chọn **một** trong các hướng sau (ưu tiên giảm dần):

1. **Tốt nhất — bỏ `description` khỏi hợp đồng API.** Permission đã có `name` (`DOMAIN:ACTION`) và `category` là đủ để FE render nhãn bản địa hoá qua i18n. Giữ `description` chỉ như metadata nội bộ cho DB/admin tooling.
2. **Hỗ trợ `Accept-Language`.** Chuyển `description` sang message bundle (`messages_vi.properties` / `messages_en.properties`) và resolve theo header, trả về theo locale yêu cầu.
3. **Bổ sung `descriptionEn`** (song song `description`) để FE tự chọn theo locale.
4. **Tối thiểu:** đổi seed sang tiếng Anh (ngôn ngữ trung lập hơn cho định danh kỹ thuật) và ghi rõ trong tài liệu API rằng trường này **không** được bản địa hoá.

Kèm theo: thêm test đảm bảo mọi permission seed đều có `name` khớp pattern `^[A-Z_]+:[A-Z_]+$` (đã đúng) để FE có thể phân tích cú pháp nhãn nếu cần.

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)

Đã chốt với Tech Lead tại Sprint 2.4 (2026-10-08):

1. Trong `PermissionMatrix`, **nhãn chính** là `permission.name` (ví dụ `USER:BAN`) — trung tính ngôn ngữ, luôn hiển thị đúng ở mọi locale, và không phụ thuộc backend.
2. `permission.description` được render như **dòng phụ** nguyên văn (không cố dịch), kèm comment trong code trỏ về issue này.
3. Tiêu đề nhóm (`category`) do **FE** bản địa hoá qua i18n (`rbac.category.*`), vì `category` là enum ổn định — đây là phần bản địa hoá thực sự nằm trong tầm kiểm soát của FE.
4. Không tạo 17 khoá i18n cho permission: sẽ lệch DB và không phát hiện được permission mới.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
