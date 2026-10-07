# BI-001: Missing Error Code Enum in ErrorResponse

- **Priority:** `P1` (Important)
- **Status:** `Open`
- **Module ảnh hưởng:** `auth-service`, `content-service`, `media-service`, `recommender-service`
- **Ngày phát hiện:** 2026-10-07

---

## 1. Mô Tả Vấn Đề
Hiện tại, class `ErrorResponse` trên toàn bộ các service backend chỉ trả về các trường:
- `status` (int)
- `error` (string, ví dụ: `"Validation Failed"`, `"Unauthorized"`)
- `message` (string, chuỗi tiếng Anh ném ra từ Exception)
- `timestamp` (ISO-8601 string)

Backend **hoàn toàn không có trường mã lỗi máy đọc** (Error Code Enum) như `code` hay `errorCode` (ví dụ: `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `USER_NOT_FOUND`, `DUPLICATE_USERNAME`).

---

## 2. Ảnh Hưởng Tới Phía Frontend (Impact)
- Phía Frontend không thể ánh xạ thông điệp lỗi sang đa ngôn ngữ (i18n) theo từ điển `error.<CODE>` như đã thiết kế tại [i18n.md](../architect/i18n.md).
- Frontend buộc phải dùng HTTP `status` chung chung kết hợp với việc so khớp chuỗi (heuristic/regex) trên trường `message` tiếng Anh của backend để phân biệt các loại lỗi khác nhau trong cùng một mã status (ví dụ: cùng là 400 nhưng do vi phạm ràng buộc hay do thiếu dữ liệu; cùng là 401 nhưng do sai pass hay token hết hạn).
- Nếu backend thay đổi câu chữ trong `message`, logic bắt lỗi của frontend sẽ bị phá vỡ âm thầm.

---

## 3. Bằng Chứng Mã Nguồn (Evidence)
- File DTO: `auth-service/src/main/java/com/example/auth/dto/ErrorResponse.java#L13-L20`
- File DTO: `content-service/src/main/java/com/example/content/exception/ErrorResponse.java#L11-L17`
- File DTO: `media-service/src/main/java/com/example/media/dto/ErrorResponse.java#L13-L20`

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)
Thêm trường `code: String` vào `ErrorResponse` và định nghĩa một Enum tập trung (hoặc theo domain):
```java
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private int status;
    private String code;     // Ví dụ: "INVALID_CREDENTIALS", "USER_BANNED"
    private String error;
    private String message;
    private List<FieldError> errors;
    private Instant timestamp;
}
```

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)
- Xây dựng tầng `error-parser.ts` nội bộ: trích xuất lỗi dựa trên `httpStatus` làm khóa chính.
- Bóc tách mảng `errors[]` cho lỗi form validation.
- Với các lỗi nghiệp vụ đặc thù cần hiển thị riêng, dùng regex an toàn trên `message` (ví dụ: `message.includes("banned")`).
- Khi backend bổ sung trường `code`, Frontend chỉ cần cập nhật hàm trích xuất duy nhất tại `error-parser.ts` mà không làm thay đổi các UI components.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
