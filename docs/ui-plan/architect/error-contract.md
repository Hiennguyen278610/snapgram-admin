# Error Contract (Backend Truth) — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này xác lập sự thật khách quan (ground truth) về toàn bộ cấu trúc phản hồi lỗi (Error Response Shapes) từ hệ thống backend Spring Boot Microservices và API Gateway của Snapgram. Tài liệu ghi lại chính xác hiện trạng mã nguồn backend đang có, không suy đoán hay thêm bớt. Tài liệu liên kết mật thiết với:
- [error-handling.md](error-handling.md): Chiến lược thích ứng và lớp Adapter của Frontend.
- [../backend-issues/README.md](../backend-issues/README.md): Danh mục các bất cập backend cần chuẩn hóa.
- [i18n.md](i18n.md): Quy chuẩn ánh xạ thông báo lỗi sang đa ngôn ngữ.

---

## 2. Tổng Quan Hiện Trạng Backend (Backend Error Shapes Reality)
Trong kiến trúc Snapgram Backend, khi có lỗi xảy ra (lỗi xác thực, validation, tài khoản bị khóa, hoặc rate limit), có **2 Shape phản hồi khác biệt** được trả về tùy theo tầng xử lý:
1. **Shape A — Microservice ErrorResponse (DTO Chuẩn):** Được trả về bởi `@RestControllerAdvice` của các downstream service (`auth-service`, `content-service`, `media-service`, `recommender-service`).
2. **Shape B — Gateway ErrorResponse (Chuỗi Rút Gọn):** Được trả về trực tiếp bởi WebFilter của Spring Cloud Gateway (`api-gateway`) khi request bị chặn trước khi tới downstream microservice (chặn vì thiếu token hoặc chạm ngưỡng rate limit).

> **SỰ THẬT QUAN TRỌNG:** Backend hiện tại **CHƯA CÓ trường mã lỗi dạng máy đọc (Error Code Enum)** như `code` hay `errorCode` trong bất kỳ class `ErrorResponse` nào. Phản hồi chỉ chứa `status` (mã số HTTP), `error` (chuỗi text HTTP status hoặc custom text) và `message` (chuỗi tiếng Anh tự do).

---

## 3. Shape A — Microservice ErrorResponse

### 3.1. Đặc Tả Thuộc Tính (Field Specification)
Class nguồn: `com.example.auth.dto.ErrorResponse`, `com.example.content.exception.ErrorResponse`, `com.example.media.dto.ErrorResponse`, `com.example.recommender.exception.ErrorResponse`.

| Tên Field | Kiểu Dữ Liệu | Nullable | Mô Tả & Ý Nghĩa | Ví Dụ |
|---|---|:---:|---|---|
| `status` | `number` (int) | Không | Mã trạng thái HTTP chuẩn. | `400`, `401`, `403`, `404`, `409`, `429`, `500` |
| `error` | `string` | Không | Tên trạng thái HTTP hoặc nhãn tóm tắt lỗi. **Lưu ý:** Không nhất quán (có lúc là HTTP status reason như `"Unauthorized"`, có lúc là custom text như `"Validation Failed"`). | `"Validation Failed"`, `"Unauthorized"`, `"Forbidden"` |
| `message` | `string` | Không | Thông điệp mô tả chi tiết lỗi bằng tiếng Anh do Exception ném ra. | `"Invalid email or password"`, `"User not found"` |
| `timestamp` | `string` (ISO-8601) | Không | Dấu thời gian hệ thống tại thời điểm phát sinh lỗi (`Instant.now()`). | `"2026-10-07T10:15:30.123Z"` |
| `errors` | `Array<FieldError>` | Có | Danh sách chi tiết lỗi của từng trường dữ liệu. **Chỉ xuất hiện khi HTTP 400 Validation Failed** (được cấu hình `@JsonInclude(NON_NULL)`). | `[{"field": "email", "message": "Email is required"}]` |

> ⚠️ **CẢNH BÁO CHO FRONTEND:** Field `error` trong Shape A không theo một bộ từ điển cố định (ví dụ lúc thì `"Validation Failed"`, lúc thì `"Bad Request"`). **Frontend TUYỆT ĐỐI KHÔNG parse chuỗi `error` này để suy diễn nghiệp vụ** mà phải căn cứ vào `status` và `errors[]`.

### 3.2. Ví Dụ JSON Thực Tế Cho Từng Status Code (Shape A)

#### 1. HTTP 400 — Validation Failed
- **Trigger:** `@Valid` fail trên Request Body (`MethodArgumentNotValidException`).
- **Bằng chứng:** `auth-service/src/main/java/com/example/auth/exception/GlobalExceptionHandler.java#L23-L41`
```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Validation failed for one or more fields",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

#### 2. HTTP 400 — Bad Request (Generic Argument Violation)
- **Trigger:** Ném `IllegalArgumentException` hoặc `IllegalStateException`.
- **Bằng chứng:** `auth-service/.../GlobalExceptionHandler.java#L98-L106`, `content-service/.../GlobalExceptionHandler.java#L47-L55`
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Cannot follow yourself",
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

#### 3. HTTP 401 — Unauthorized (Sai mật khẩu / Sai mã 2FA)
- **Trigger:** Ném `InvalidCredentialsException` hoặc `TwoFaException`.
- **Bằng chứng:** `auth-service/.../GlobalExceptionHandler.java#L58-L66`
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

#### 4. HTTP 403 — Forbidden (Tài khoản bị Ban)
- **Trigger:** Ném `AccountBannedException`.
- **Bằng chứng:** `auth-service/.../GlobalExceptionHandler.java#L78-L86`
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Your account has been banned: Spamming violations",
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

#### 5. HTTP 403 — Forbidden (Thiếu quyền Admin)
- **Trigger:** Ném `SecurityException` hoặc `AccessDeniedException`.
- **Bằng chứng:** `content-service/.../GlobalExceptionHandler.java#L39-L45`
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Admin privileges required",
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

#### 6. HTTP 404 — Not Found
- **Trigger:** Ném `UserNotFoundException` hoặc `ResourceNotFoundException`.
- **Bằng chứng:** `auth-service/.../GlobalExceptionHandler.java#L68-L76`, `content-service/.../GlobalExceptionHandler.java#L30-L37`
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "User not found with id: 11111111-2222-3333-4444-555555555555",
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

#### 7. HTTP 409 — Conflict
- **Trigger:** Trùng lặp dữ liệu (`DuplicateUserException`, `UsernameAlreadyExistsException`).
- **Bằng chứng:** `auth-service/.../GlobalExceptionHandler.java#L88-L96`
```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Username already exists: hoang_dev",
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

#### 8. HTTP 429 — Too Many Requests (Auth Service Interceptor)
- **Trigger:** Chặn bởi `RateLimitInterceptor` khi vượt quá giới hạn gọi vào endpoint auth.
- **Header đi kèm:** `Retry-After: 60`, `X-Rate-Limit-Limit: 10`, `X-Rate-Limit-Remaining: 0`, `X-Rate-Limit-Reset: 1791370000`.
- **Bằng chứng:** `auth-service/src/main/java/com/example/auth/config/RateLimitInterceptor.java#L45-L65`
```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds",
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

#### 9. HTTP 500 — Internal Server Error
- **Trigger:** Bắt exception chung (`Exception.class`).
- **Bằng chứng:** `auth-service/.../GlobalExceptionHandler.java#L108-L117`
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2026-10-07T10:00:00.000Z"
}
```

---

## 4. Shape B — Gateway ErrorResponse (API Gateway WebFilter)

Khi client gọi qua API Gateway (`:8080`), các filter tại Gateway có thể từ chối request ngay lập tức mà không chuyển tiếp vào các downstream services. Các filter này sử dụng WebFlux `DataBuffer` ghi trực tiếp JSON thô.

### 4.1. Đặc Tả Thuộc Tính (Field Specification)
| Tên Field | Kiểu Dữ Liệu | Nullable | Mô Tả | Ví Dụ |
|---|---|:---:|---|---|
| `error` | `string` | Không | Chuỗi mô tả lỗi duy nhất của Gateway. | `"Rate limit exceeded. Please try again later."` |

### 4.2. Các Trường Hợp Áp Dụng Thực Tế

#### 1. HTTP 401 — Unauthorized từ Gateway
- **Trigger:** Header `Authorization` bị thiếu, sai format hoặc JWT không hợp lệ/hết hạn.
- **Bằng chứng:** `api-gateway/src/main/java/com/example/gateway/filter/JwtAuthenticationFilter.java#L159-L167`
```json
{
  "error": "Missing or invalid Authorization header"
}
```
*(hoặc `{"error": "Invalid or expired token"}`)*

#### 2. HTTP 429 — Too Many Requests từ Gateway
- **Trigger:** `RateLimitFilter` của Gateway kích hoạt chặn theo IP/User.
- **Header đi kèm:** `X-Rate-Limit-Reset: 1791370060`.
- **Bằng chứng:** `api-gateway/src/main/java/com/example/gateway/filter/RateLimitFilter.java#L95-L106`
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

---

## 5. Bảng Phủ Trạng Thái (HTTP Status Coverage)

| HTTP Status | Định Dạng Shape | Trigger Nguyên Nhân | Headers Phụ Kèm Theo | Trạng Thái Backend Hiện Tại |
|---|---|---|---|---|
| **`400`** | Shape A | Validation Bean fail hoặc sai tham số nghiệp vụ | N/A | Hoạt động đầy đủ |
| **`401`** | Shape A (Service) / Shape B (Gateway) | Sai mật khẩu, sai 2FA hoặc JWT hết hạn | N/A | Hoạt động đầy đủ |
| **`403`** | Shape A | User bị ban hoặc thiếu quyền Admin | N/A | Hoạt động đầy đủ |
| **`404`** | Shape A | Entity không tồn tại trong Database | N/A | Hoạt động đầy đủ |
| **`405`** | N/A | Sai HTTP Method (VD: POST vào GET) | N/A | **Không có custom handler** (Spring Boot trả default HTML/JSON) |
| **`409`** | Shape A | Xung đột tài nguyên / Trùng username, email | N/A | Hoạt động đầy đủ |
| **`415`** | N/A | Sai Content-Type (VD: gửi text thay vì JSON) | N/A | **Không có custom handler** |
| **`422`** | N/A | Unprocessable Entity | N/A | **Không áp dụng** (BE dùng 400 cho validation) |
| **`423`** | N/A | Khóa tài khoản sau 3 lần đăng nhập sai | N/A | **Chưa implement** (Hiện tại BE đang ném nhầm thành 401) |
| **`429`** | Shape B (Gateway) / Shape A (Auth Service) | Vượt quá giới hạn tần suất gọi API | `X-Rate-Limit-Reset` (Gateway)<br>`Retry-After` (Auth Service) | Hoạt động đầy đủ |
| **`500`** | Shape A | Lỗi runtime không mong muốn tại service | N/A | Hoạt động đầy đủ |
| **`502/503/504`** | Shape B (Gateway) | Downstream service bị sập hoặc quá tải | N/A | `JwtAuthenticationFilter.java#L169` (trả 503 khi Reactive Jwt Decoder lỗi) |

---

## 6. So Sánh Tính Nhất Quán Giữa Các Microservices

| Tiêu Chí So Sánh | `auth-service` | `content-service` | `media-service` | `recommender-service` | `api-gateway` |
|---|:---:|:---:|:---:|:---:|:---:|
| **Class DTO Sử Dụng** | `ErrorResponse` | `ErrorResponse` | `ErrorResponse` | `ErrorResponse` | Raw DataBuffer |
| **Field `status`** | Có | Có | Có | Có | **Không** |
| **Field `error`** | Có | Có | Có | Có | Có |
| **Field `message`** | Có | Có | Có | Có | **Không** |
| **Field `timestamp`** | Có | Có | Có | Có | **Không** |
| **Field `errors` (Validation)**| Có | Có | Có | Không | **Không** |
| **Header Rate Limit** | `Retry-After` | N/A | N/A | N/A | `X-Rate-Limit-Reset` |

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
