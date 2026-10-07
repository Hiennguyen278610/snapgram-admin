# Backend Issues Tracker (Frontend Integration Impediments)

Tài liệu này theo dõi các vấn đề và điểm bất cập từ phía Backend (Spring Boot Microservices & Spring Cloud Gateway) gây cản trở hoặc làm phức tạp hóa tầng tích hợp Frontend.

## Phân Cấp Mức Độ Ưu Tiên (Priority)
- **`P0` (Blocker):** Chặn luồng nghiệp vụ hoặc sai lệch nghiêm trọng chuẩn HTTP/UI, bắt buộc FE phải dùng regex hoặc đoán mò.
- **`P1` (Important):** Ảnh hưởng lớn đến kiến trúc code, khả năng bản địa hóa (i18n) hoặc tạo ra sự thiếu nhất quán giữa các service.
- **`P2` (Nice-to-have):** Chuẩn hóa kỹ thuật, không ảnh hưởng trực tiếp đến người dùng cuối.

---

## Bảng Danh Mục Vấn Đề (Issues Index)

| Mã Issue | Tiêu Đề Vấn Đề | Độ Ưu Tiên | Trạng Thái | Ngày Phát Hiện | Tệp Chi Tiết |
|---|---|:---:|:---:|:---:|---|
| **`BI-001`** | Thiếu mã lỗi máy đọc (Missing Error Code Enum) trong `ErrorResponse` | **P1** | **Open** | 2026-10-07 | [BI-001-missing-error-code-enum.md](BI-001-missing-error-code-enum.md) |
| **`BI-002`** | Chưa có HTTP Status 423 Locked khi vượt quá số lần thử đăng nhập | **P0** | **Open** | 2026-10-07 | [BI-002-423-locked-not-implemented.md](BI-002-423-locked-not-implemented.md) |
| **`BI-003`** | Không nhất quán cấu trúc lỗi giữa API Gateway (Shape B) và Microservices (Shape A) | **P1** | **Open** | 2026-10-07 | [BI-003-gateway-shape-inconsistent.md](BI-003-gateway-shape-inconsistent.md) |
| **`BI-004`** | Không nhất quán Response Header giới hạn tần suất (`X-Rate-Limit-Reset` vs `Retry-After`) | **P2** | **Open** | 2026-10-07 | [BI-004-response-headers-inconsistent.md](BI-004-response-headers-inconsistent.md) |

---
*Quy ước trạng thái:* `Open` (Mới tạo) | `In Progress` (Đang sửa) | `Fixed` (Đã sửa xong) | `Wontfix` (Từ chối sửa).

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
