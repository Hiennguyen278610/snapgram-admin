# Frontend Error Handling Strategy & Adapter Layer — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này xác lập quy chuẩn kỹ thuật độc lập (self-contained) về chiến lược tiếp nhận, chuẩn hóa và xử lý lỗi tại tầng Frontend cho **Snapgram Admin Portal**. Tài liệu hoạt động dựa trên hiện trạng thực tế của backend, kết nối trực tiếp với:
- [error-contract.md](error-contract.md): Sự thật hiện trạng error response từ backend.
- [../backend-issues/README.md](../backend-issues/README.md): Danh mục các bất cập backend đang theo dõi.
- [i18n.md](i18n.md): Bản đồ từ điển đa ngôn ngữ cho thông báo lỗi.
- [auth-and-security-flow.md](auth-and-security-flow.md): Luồng chuyển hướng và bảo vệ đăng nhập.

---

## 2. Chiến Lược Thích Ứng (Adapter Pattern Strategy)
Do backend hiện tại tồn tại 2 shape phản hồi khác nhau và chưa có mã lỗi `code` dạng enum, Frontend áp dụng nguyên tắc thiết kế: **"FE thích ứng linh hoạt - Cách ly bất ổn bằng lớp Adapter"**.

```
Backend Response (Shape A hoặc Shape B)
                  │
                  ▼
┌────────────────────────────────────────────────────────┐
│  Adapter Layer (src/lib/api/error-parser.ts)           │
│  - Phát hiện Shape A / Shape B                         │
│  - Heuristic detection (banned, locked, validation)    │
│  - Trích xuất retryAfterSeconds từ cả 2 headers        │
└────────────────────────────────────────────────────────┘
                  │
                  ▼
         Internal ApiError Object (Chuẩn hóa duy nhất)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
  UI Components       Toast / Boundary
 (Inline Form Error)   (Redirect / Alert)
```

> **LỢI ÍCH CỐT LÕI:** Toàn bộ component UI (Form, Modal, Table) chỉ biết và làm việc với duy nhất đối tượng `ApiError`. Khi phía backend nâng cấp hoặc sửa đổi các issue (`BI-001` đến `BI-004`), lập trình viên **CHỈ CẦN SỬA ĐÚNG 1 FILE ADAPTER**, 100% component UI không phải thay đổi bất kỳ dòng code nào.

---

## 3. Kiểu Dữ Liệu Lỗi Nội Bộ Frontend (`ApiError`)
Được định nghĩa tại `src/lib/api/types.ts`:

```typescript
export type ErrorKind =
  | 'validation'  // Lỗi form field validation (400)
  | 'auth'        // Sai mật khẩu, sai 2FA, token không hợp lệ (401)
  | 'forbidden'   // Thiếu quyền Admin hoặc tài khoản bị ban (403)
  | 'notFound'    // Bản ghi không tồn tại (404)
  | 'conflict'    // Trùng username, email hoặc trạng thái xung đột (409)
  | 'locked'      // Tài khoản bị tạm khóa 15 phút do thử sai nhiều lần (423 / 401 heuristic)
  | 'rateLimit'   // Chạm trần giới hạn request (429)
  | 'server'      // Lỗi hệ thống nội bộ (500, 502, 503)
  | 'network'     // Mất kết nối internet, timeout
  | 'unknown';    // Lỗi không xác định khác

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  httpStatus: number;
  kind: ErrorKind;
  message: string;
  fieldErrors?: ApiFieldError[];
  retryAfterSeconds?: number;
  rawResponse?: unknown;
}
```

---

## 4. Thuật Toán Phân Giải Lỗi (Parser Pseudo-code)
Triển khai tại `src/lib/api/error-parser.ts`:

> *Lưu ý: Trong code thật bắt buộc dùng `unknown`, kiểm tra và cast sau khi validate shape.*

```typescript
export function parseApiError(error: unknown): ApiError {
  // 1. Lỗi mạng (Network Error / Offline)
  const err = error as any;
  if (!err?.response) {
    return {
      httpStatus: 0,
      kind: 'network',
      message: 'Network connection failure or timeout',
    };
  }

  const { status, data, headers } = err.response;

  // 2. Trích xuất thời gian chờ Rate Limit (Hỗ trợ cả 2 chuẩn Header)
  let retryAfterSeconds: number | undefined;
  if (headers['retry-after']) {
    retryAfterSeconds = parseInt(headers['retry-after'], 10);
  } else if (headers['x-rate-limit-reset']) {
    const resetTime = parseInt(headers['x-rate-limit-reset'], 10);
    const now = Math.floor(Date.now() / 1000);
    retryAfterSeconds = Math.max(0, resetTime - now);
  }

  // 3. Chuẩn hóa message & field errors
  let extractedMessage = 'An unexpected error occurred';
  let fieldErrors: ApiFieldError[] | undefined;

  if (data) {
    if (typeof data.status === 'number') {
      // Nhận diện SHAPE A (Microservice ErrorResponse)
      extractedMessage = data.message || data.error || extractedMessage;
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        fieldErrors = data.errors;
      }
    } else if (typeof data.error === 'string') {
      // Nhận diện SHAPE B (API Gateway ErrorResponse)
      extractedMessage = data.error;
    }
  }

  // 4. Phân loại ErrorKind
  let kind: ErrorKind = 'unknown';

  switch (status) {
    case 400:
      kind = fieldErrors ? 'validation' : 'unknown';
      break;

    case 401:
      // Heuristic cho BI-002: Kiểm tra từ khóa lockout trong message
      if (
        extractedMessage.toLowerCase().includes('lock') ||
        extractedMessage.toLowerCase().includes('attempt')
      ) {
        kind = 'locked';
        if (!retryAfterSeconds) retryAfterSeconds = 900; // 15 phút mặc định
      } else {
        kind = 'auth';
      }
      break;

    case 403:
      kind = 'forbidden';
      break;

    case 404:
      kind = 'notFound';
      break;

    case 409:
      kind = 'conflict';
      break;

    case 423:
      kind = 'locked';
      if (!retryAfterSeconds) retryAfterSeconds = 900;
      break;

    case 429:
      kind = 'rateLimit';
      if (!retryAfterSeconds) retryAfterSeconds = 60;
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      kind = 'server';
      break;

    default:
      kind = 'unknown';
  }

  return {
    httpStatus: status,
    kind,
    message: extractedMessage,
    fieldErrors,
    retryAfterSeconds,
    rawResponse: data,
  };
}
```

---

## 5. Ánh Xạ Thông Báo Lỗi Sang i18n (`error-mapper.ts`)
Do backend chưa có mã lỗi `code`, Frontend sử dụng bộ quy tắc ánh xạ theo thứ tự ưu tiên:
1. Nếu backend tương lai có trả về `code` → Ưu tiên dùng `error.<code.toLowerCase()>`.
2. Nếu có `kind` chuyên biệt → Dùng `error.<kind>`.
3. Fallback theo HTTP Status → `error.http.<status>`.
4. Fallback cuối cùng → `error.unknown`.

| Trạng Thái / Phân Loại | Khóa Từ Điển i18n | Hành Vi Hiển Thị Trên UI |
|---|---|---|
| `kind === 'validation'` | `error.validation.invalidFields` | Hiển thị inline dưới từng ô nhập liệu tương ứng trong form. |
| `kind === 'auth'` | `error.auth.invalidCredentials` | Hiển thị alert cảnh báo màu đỏ ngay trên form đăng nhập. |
| `kind === 'locked'` | `error.auth.accountLocked` | Vô hiệu hóa form đăng nhập, hiển thị bộ đếm ngược `CountdownTimer`. |
| `kind === 'forbidden'` | `error.forbidden.accessDenied` | Hiển thị Toast thông báo hoặc chuyển hướng tới trang cấm truy cập. |
| `kind === 'notFound'` | `error.notFound.resource` | Hiển thị trạng thái rỗng (`EmptyState`) hoặc trang 404. |
| `kind === 'conflict'` | `error.conflict.duplicateData` | Hiển thị Toast cảnh báo trùng lặp thông tin. |
| `kind === 'rateLimit'` | `error.rateLimit.exceeded` | Hiển thị Toast cảnh báo kèm số giây chờ hồi phục. |
| `kind === 'server'` | `error.server.internalError` | Kích hoạt màn hình phục hồi lỗi (`ErrorBoundary`). |
| `kind === 'network'` | `error.network.disconnected` | Banner cảnh báo mất kết nối mạng ở đầu trang. |

---

## 6. Tổ Chức Tệp Tin Adapter Phía Frontend
Khi triển khai mã nguồn Frontend Admin, toàn bộ logic trên được gói gọn trong thư mục `src/lib/api/`:
- `src/lib/api/types.ts`: Chứa type definitions `ApiError`, `ErrorKind`, `ApiFieldError`.
- `src/lib/api/error-parser.ts`: Chứa hàm `parseApiError` bóc tách an toàn từ Axios/Ky error.
- `src/lib/api/error-mapper.ts`: Chứa hàm lấy `i18nKey` từ đối tượng `ApiError`.

---

## 7. Chiến Lược Kiểm Thử Tự Động (Test Strategy)
1. **Unit Test cho `error-parser.ts`:**
   - Test case giả lập Shape A với đầy đủ `errors[]` (400 validation).
   - Test case giả lập Shape B từ Gateway (`{ "error": "Rate limit exceeded" }`).
   - Test case trích xuất header `Retry-After` và `X-Rate-Limit-Reset`.
   - Test case heuristic phát hiện lockout khi backend trả 401 chứa từ khóa `"locked"`.
2. **Unit Test cho `error-mapper.ts`:**
   - Đảm bảo 100% các giá trị `ErrorKind` đều phân giải ra một translation key hợp lệ.
3. **E2E Integration Test:**
   - Kiểm thử luồng đăng nhập sai thông tin (hiển thị alert lỗi).
   - Kiểm thử chạm ngưỡng rate limit (hiển thị toast đếm ngược).

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
