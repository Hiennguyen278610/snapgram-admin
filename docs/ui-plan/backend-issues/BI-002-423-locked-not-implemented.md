# BI-002: HTTP Status 423 Locked Not Implemented

- **Priority:** `P0` (Blocker / High Criticality)
- **Status:** `Open`
- **Module ảnh hưởng:** `auth-service`
- **Ngày phát hiện:** 2026-10-07

---

## 1. Mô Tả Vấn Đề
Theo thiết kế nghiệp vụ an ninh của hệ thống, khi người dùng hoặc Quản trị viên nhập sai mật khẩu quá 3 lần liên tiếp, tài khoản phải bị tạm khóa trong vòng 15 phút.
Tuy nhiên, trong source code `AuthService.java`:
- Dịch vụ có gọi `accountLockService.isLocked(user.getId())` và `accountLockService.recordFailedAttempt(user.getId())`.
- Nhưng khi tài khoản bị khóa hoặc nhập sai pass, mã nguồn đều ném chung một exception: `throw new InvalidCredentialsException("Invalid email or password");`.
- `GlobalExceptionHandler.java` bắt `InvalidCredentialsException` và trả về mã **`401 Unauthorized`**. Backend chưa định nghĩa `AccountLockedException` và chưa có handler trả về mã chuẩn **`423 Locked`**.

---

## 2. Ảnh Hưởng Tới Phía Frontend (Impact)
- Phía giao diện đăng nhập Admin (`AdminLoginForm`) không thể phân biệt được giữa:
  1. Người dùng vừa gõ nhầm mật khẩu lần 1 hoặc lần 2.
  2. Người dùng đã bị khóa hoàn toàn 15 phút.
- Giao diện không thể kích hoạt đồng hồ đếm ngược 15 phút (`CountdownTimer`) và khóa form theo đúng yêu cầu bảo mật cấp cao nếu chỉ nhận mã `401 Unauthorized`.

---

## 3. Bằng Chứng Mã Nguồn (Evidence)
- Đoạn xử lý ném lỗi tại `auth-service/src/main/java/com/example/auth/service/AuthService.java#L47-L65`:
```java
if (accountLockService.isLocked(user.getId())) {
    throw new InvalidCredentialsException("Invalid email or password"); // <-- Đang ném 401 thay vì 423
}
if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
    accountLockService.recordFailedAttempt(user.getId());
    throw new InvalidCredentialsException("Invalid email or password");
}
```
- Handler tại `auth-service/src/main/java/com/example/auth/exception/GlobalExceptionHandler.java#L58-L66`:
```java
@ExceptionHandler(InvalidCredentialsException.class)
public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized", ex.getMessage()));
}
```

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)
1. Tạo custom exception `AccountLockedException`:
```java
public class AccountLockedException extends RuntimeException {
    private final long retryAfterSeconds;
    public AccountLockedException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
```
2. Thêm `@ExceptionHandler(AccountLockedException.class)` trong `GlobalExceptionHandler.java` trả về HTTP status `423 LOCKED` kèm header `Retry-After`:
```java
@ExceptionHandler(AccountLockedException.class)
public ResponseEntity<ErrorResponse> handleAccountLocked(AccountLockedException ex) {
    return ResponseEntity.status(HttpStatus.LOCKED)
            .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
            .body(ErrorResponse.of(423, "Locked", ex.getMessage()));
}
```

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)
- Trong bộ phân giải lỗi `error-parser.ts`:
  - Khi nhận `401 Unauthorized` từ API login: kiểm tra nếu chuỗi `message` có chứa các từ khóa như `"locked"`, `"too many attempts"`, hoặc `"try again later"` → coi như `kind: 'locked'`.
  - Nếu không có từ khóa trên → coi là sai thông tin đăng nhập thông thường (`kind: 'auth'`).
- Khi backend cập nhật trả mã 423 thực tế, logic parser sẽ tự động bắt theo mã `423` mà không cần phụ thuộc vào regex chuỗi `message`.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
