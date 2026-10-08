# BI-009: `targetType` Filter Bị Bỏ Qua Khi Không Kèm `status` + Enum Sai Trả 500

- **Priority:** `P1` (Important)
- **Status:** `Open`
- **Module ảnh hưởng:** `content-service` (`ReportService.getReports`, `GlobalExceptionHandler`)
- **Ngày phát hiện:** 2026-10-08
- **Phát hiện tại:** Sprint 2.5 (Content Moderation) — verify trước khi dispatch

---

## 1. Mô Tả Vấn Đề

### 1a. `targetType` bị bỏ qua khi request không kèm `status`

`GET /api/admin/reports?targetType=USER` **trả về toàn bộ** report (12/12) thay vì chỉ 4 report có `targetType = USER`.

Nguyên nhân nằm ở `ReportService.getReports()` — **thiếu nhánh `targetType != null && status == null`**:

```java
public Page<ReportResponse> getReports(ReportStatus status, ReportTargetType targetType, Pageable pageable) {
    Page<Report> page;
    if (status != null && targetType != null) {
        page = reportRepository.findByStatusAndTargetType(status, targetType, pageable);
    } else if (status != null) {
        page = reportRepository.findByStatus(status, pageable);
    } else {
        page = reportRepository.findAll(pageable);   // ← targetType bị NUỐT ở đây
    }
    return page.map(this::toResponse);
}
```

Repository **đã có** method cần thiết nhưng không được dùng tới: `Page<Report> findByTargetType(ReportTargetType targetType, Pageable pageable)` chưa tồn tại — chỉ có `findByStatus` và `findByStatusAndTargetType`.

Controller thì **đúng**: `AdminReportController.getReports(...)` có `@RequestParam(required = false) ReportTargetType targetType` và truyền xuống service. Swagger cũng quảng cáo param này là hợp lệ.

⇒ **API contract nói có filter, nhưng filter hoạt động nửa vời**: chỉ đúng khi user vừa chọn tab trạng thái vừa chọn targetType.

### 1b. Giá trị enum không hợp lệ → `500` thay vì `400`

Mọi giá trị không map được sang enum (`targetType=user`, `targetType=BOGUS`, `status=BOGUS`) đều trả:

```http
HTTP/1.1 500 Internal Server Error
{"error":"Internal Server Error","message":"An unexpected error occurred","status":500,...}
```

Đúng phải là **400 Bad Request** kèm mô tả giá trị hợp lệ. Nguyên nhân: `MethodArgumentTypeMismatchException` (do Spring ném khi convert query param → enum) **không có** handler trong `GlobalExceptionHandler`, nên rơi vào catch-all `Exception.class` → 500. Đây cùng lớp lỗi với [BI-008](BI-008-report-status-guards.md).

---

## 2. Bằng Chứng (curl thật, 12 report seed, 2026-10-08)

Seed: `scripts/dev-seed-reports.sh` → 3 report cho mỗi status × 3 targetType = 12 (mỗi targetType có **4** report).

| Request | `totalElements` quan sát | Kỳ vọng |
| :------ | :----------------------: | :-----: |
| `?page=0&size=20` | 12 | 12 ✅ |
| `?targetType=USER` | **12** | 4 ❌ |
| `?targetType=POST` | **12** | 4 ❌ |
| `?targetType=COMMENT` | **12** | 4 ❌ |
| `?status=PENDING` | 3 | 3 ✅ |
| `?status=PENDING&targetType=USER` | **1** | 1 ✅ |
| `?status=REVIEWED&targetType=USER` | **1** | 1 ✅ |

⇒ Chỉ **thiếu nhánh khi `status` vắng mặt**; tổ hợp `status + targetType` chạy đúng.

```http
$ curl -H 'Cookie: admin_access_token=...' \
    'http://localhost:8080/api/admin/reports?targetType=USER'   # → totalElements 12 (SAI)

$ curl -H 'Cookie: admin_access_token=...' \
    'http://localhost:8080/api/admin/reports?targetType=user'   # → HTTP 500 (SAI, phải 400)
```

---

## 3. Ảnh Hưởng Tới Phía Frontend (Impact)

- Màn hình `/[locale]/admin/moderation/reports` có bộ lọc **Target type** (POST/COMMENT/USER). Ở tab **"All"**, bộ lọc này **không có tác dụng** — người dùng chọn "User" mà vẫn thấy đủ 12 dòng ⇒ trông như UI lỗi.
- Ở các tab trạng thái cụ thể thì lọc **hoạt động đúng**, nên hành vi không nhất quán giữa các tab → khó đoán, dễ bị báo nhầm là lỗi FE.
- Nếu FE gửi sai chữ hoa/thường (ví dụ `user`) → **500** thay vì 400 ⇒ người dùng thấy "Internal server error" cho một lỗi input.
- FE không thể workaround mà vẫn giữ đúng contract: muốn lọc theo targetType luôn phải kèm một `status`, nhưng tab "All" theo định nghĩa là không có status.

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)

1. Bổ sung nhánh còn thiếu trong `ReportService.getReports()`:
   ```java
   } else if (targetType != null) {
       page = reportRepository.findByTargetType(targetType, pageable);
   } else {
       page = reportRepository.findAll(pageable);
   }
   ```
   và thêm `Page<Report> findByTargetType(ReportTargetType targetType, Pageable pageable);` vào `ReportRepository`.
2. Thêm `@ExceptionHandler(MethodArgumentTypeMismatchException.class)` → **400** với message nêu rõ param và giá trị hợp lệ (enum), thay vì để rơi vào catch-all 500.
3. Bổ sung test cho **cả 4 tổ hợp** của `(status, targetType)`: `(null,null)`, `(x,null)`, `(null,y)`, `(x,y)`.
4. Xem xét hỗ trợ `sort` (hiện `PageReportResponse` không có param `sort`, FE không thể đổi thứ tự — mặc định hiện tại là `createdAt` tăng dần theo DB, không phải mới nhất trước).

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)

Theo quyết định của Tech Lead tại Sprint 2.5 (2026-10-08) — nhất quán với tiền lệ [BI-005](BI-005-missing-user-search-param.md):

1. **Vẫn triển khai đúng spec**: gửi `targetType` (chữ HOA đúng enum) trong request tới `/api/admin/reports` ⇒ khi backend sửa xong, tính năng hoạt động **không cần sửa FE**.
2. MSW mock **tự lọc đúng** theo `targetType` để test và demo phản ánh hành vi mong đợi.
3. Thêm comment `// TODO(BI-009)` tại service để truy vết.
4. Chỉ gửi giá trị enum **chữ HOA** (`POST`/`COMMENT`/`USER`) — không bao giờ gửi chữ thường, tránh 500.
5. **Không** hack kiểu "luôn kèm status mặc định" để lách — sẽ làm sai nghĩa của tab "All".

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
