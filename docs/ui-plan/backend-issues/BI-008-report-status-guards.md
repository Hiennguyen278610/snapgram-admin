# BI-008: Report Status Guards Missing / Wrong Error Code

- **Priority:** `P2` (Important for UX)
- **Status:** `Fixed` (2026-10-16)
- **Module ảnh hưởng:** `content-service` (`AdminReportController`, `ReportService`, `GlobalExceptionHandler`)
- **Ngày phát hiện:** 2026-10-08
- **Phát hiện tại:** Sprint 2.5 (Content Moderation)

---

## 1. Mô Tả Vấn Đề

Đọc source `ReportService.java`, phát hiện 2 bất đối xứng giữa `resolveReport()` và `dismissReport()`.

### 1a. Resolve report đã DISMISSED → 500 (đáng lẽ 400/409)

`ReportService.java#L112-L114`:

```java
if (report.getStatus() == ReportStatus.DISMISSED) {
    throw new IllegalArgumentException("Dismissed report cannot be resolved");
}
```

`GlobalExceptionHandler` **không có** handler riêng cho `IllegalArgumentException`. Các handler hiện có chỉ gồm: `ContentNotFoundException` → 404, `AccessDeniedException` → 403, `UnauthorizedException` → 401, `DuplicateResourceException` → 409, `MethodArgumentNotValidException` → 400, và catch-all `Exception.class` → **500**.

⇒ `IllegalArgumentException` rơi vào catch-all → **HTTP 500** `{"error":"Internal Server Error","message":"An unexpected error occurred"}`.

Cùng nguyên nhân này cũng làm `adminId == null` (`ReportService.java#L115-L117`) trả 500 thay vì 400.

### 1b. Dismiss report đã RESOLVED → OK (không guard)

`ReportService.java#L157-L167` — `dismissReport()` **không kiểm tra status** trước khi set `DISMISSED`:

```java
public ReportResponse dismissReport(UUID id, UUID adminId) {
    Report report = reportRepository.findById(id)
            .orElseThrow(() -> new ContentNotFoundException("Report not found: " + id));

    report.setStatus(ReportStatus.DISMISSED);   // ← không guard
    ...
}
```

Bất đối xứng với `resolveReport()` (có guard `DISMISSED`, và idempotent với `RESOLVED`).

---

## 2. Ảnh Hưởng FE

- User double-click "Resolve" trên report đã dismissed → **500** → `error.server.internalError` + Retry (lệch intent: đây là xung đột trạng thái, không phải lỗi hệ thống).
- FE **không phân biệt được** "conflict do status" với "lỗi hệ thống" vì cả hai đều là 500.
- Ngược lại, `dismiss` một report đã resolved vẫn trả 200 và **âm thầm đổi** `RESOLVED` → `DISMISSED`, phá vỡ tính bất biến của lịch sử kiểm duyệt.
- Trên UI queue: nếu tab đang xem là `RESOLVED` mà user bấm Dismiss, item biến mất khỏi tab mà không có cảnh báo nào.

---

## 3. Đề Xuất BE

1. Tạo `InvalidStatusTransitionException` → handler trả **409 Conflict** (hoặc 422) với body `{status:409, error:"Conflict", message:"..."}`.
2. Thêm guard tương tự cho `dismissReport()`: chặn `RESOLVED` (và giữ idempotent cho `DISMISSED`), hoặc chủ đích cho phép nhưng phải ghi rõ trong tài liệu API.
3. Bổ sung `@ExceptionHandler(IllegalArgumentException.class)` → **400** để không rơi vào catch-all 500.
4. Thêm test cho cả 2 chiều chuyển trạng thái.

---

## 4. Workaround FE

- FE **disable** nút Resolve/Dismiss khi status không phù hợp: chỉ `PENDING`/`REVIEWED` mới cho phép hành động; `RESOLVED`/`DISMISSED` chỉ xem.
- **Không** hack parse 500 → conflict.
- Không cho phép dismiss một report đã `RESOLVED` ở tầng UI (dù backend vẫn cho phép) để tránh phá vỡ lịch sử.

---

## 5. Evidence

- Source: `content-service/src/main/java/com/example/content/service/ReportService.java` (`resolveReport` L105-L155, `dismissReport` L157-L167).
- `content-service/src/main/java/com/example/content/exception/GlobalExceptionHandler.java` — danh sách `@ExceptionHandler` không có `IllegalArgumentException`.
- ⚠️ **Chưa tái hiện được bằng curl** vì DB content rỗng tại thời điểm điều tra (0 report). Sau khi seed (`scripts/dev-seed-reports.sh`) có thể tái hiện: `PATCH /api/admin/reports/{dismissed-id}/resolve` → kỳ vọng quan sát 500.

---

## 6. Verification (Sau Khi BE Fix — 2026-10-16)

**Backend change:** `content-service` — thêm `InvalidStatusTransitionException` → **409 Conflict**, và thêm guard `RESOLVED` cho `dismissReport()`, commit `d4ece81`.

**Runtime verify** (12 report seed: 3 PENDING / 3 REVIEWED / 3 RESOLVED / 3 DISMISSED):

```
PATCH /api/admin/reports/{RESOLVED}/dismiss   → 409   (lỗi 1b — trước đây 200, âm thầm đổi trạng thái)
PATCH /api/admin/reports/{DISMISSED}/resolve  → 409   (lỗi 1a — trước đây 500)
PATCH /api/admin/reports/{RESOLVED}/resolve   → 200   (idempotent — ĐÚNG thiết kế, xem §1b dòng 45)
```

Body `409`:

```json
{"code":"INVALID_STATUS_TRANSITION","error":"Conflict","message":"Resolved report cannot be dismissed","status":409}
```

Đối chứng: sau các lệnh `409`, trạng thái report **không đổi** (vẫn `RESOLVED` / `DISMISSED`).

**⚠️ Đính chính kỳ vọng:** kỳ vọng "resolve trên report đã `RESOLVED` → 409" là **SAI**. Chính tài liệu này (§1b, dòng 45) ghi `resolveReport()` **idempotent với `RESOLVED`**. Kết quả `200` là hành vi đúng, không phải bug.

**Kết luận:** BI-008 đã fix — cả 2 lỗi (1a và 1b) đều được xử lý.

---

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
