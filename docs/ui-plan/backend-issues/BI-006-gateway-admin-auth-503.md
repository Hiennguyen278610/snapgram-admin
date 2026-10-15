# BI-006: Gateway Trả Sai `503 Authentication service unavailable` Khi Token Không Hợp Lệ (Đúng Phải Là `401`)

- **Priority:** `P1` (Important) — *(đính chính: bản đầu tiên của issue này xếp `P0` với giả định "chặn toàn bộ Phase 2"; đã kiểm chứng lại bằng phiên admin thật và **hạ xuống `P1`** — xem §6)*
- **Status:** `Fixed` (2026-10-16)
- **Module ảnh hưởng:** `api-gateway` (`JwtAuthenticationFilter`), liên quan `auth-service` (`SecurityConfig`, `/api/auth/verify`)
- **Ngày phát hiện:** 2026-10-08 (Sprint 2.3) — cập nhật chẩn đoán 2026-10-08
- **Mức độ thực tế:** KHÔNG chặn phiên đăng nhập hợp lệ. Gây ra (a) thông báo lỗi sai lệch khi token hết hiệu lực và (b) FE không bao giờ nhận được `401` để tự chuyển về trang đăng nhập.

---

## 1. Mô Tả Vấn Đề

Khi một request tới `/api/auth/admin/**` (hoặc bất kỳ path được bảo vệ) qua API Gateway mang **token không hợp lệ / hết hạn / bị thu hồi**, Gateway trả về:

```http
HTTP/1.1 503 Service Unavailable
{"error": "Authentication service unavailable"}
```

Đúng phải là **`401 Unauthorized`**. Việc trả `503` khiến token hết hạn bị hiển thị như *"dịch vụ xác thực đang chết"*, trong khi `auth-service` vẫn hoàn toàn khoẻ mạnh.

---

## 2. Kiến Trúc Thật (đã xác minh — "admin tách luồng, KHÔNG tách port")

> Giả định ban đầu "admin chạy port riêng khác user flow" là **không đúng**. Admin là một **luồng logic tách biệt** trên cùng hạ tầng.

| Thành phần | Port | Ghi chú |
| :--------- | :--: | :------ |
| `snapgram-api-gateway` | `8080` | Cổng vào duy nhất; route `/api/auth/**` → `lb://auth-service` |
| `snapgram-auth-service` | `8081` | **Chỉ có MỘT** auth-service, phục vụ cả user flow và admin flow |
| `snapgram-mailpit` | `1025` / `8025` | SMTP + UI mail |
| `snapgram-redis` / `snapgram-kafka` / `snapgram-postgres-auth` | `6379` / `9092` / `5432` | Hạ tầng |
| *(các port `8045`, `3336`)* | — | `antigravity-manager` và `base-setup-mysql-dev`, **không liên quan Snapgram** |

**Admin tách biệt ở 3 điểm logic, không phải ở port:**

1. **Cookie riêng:** `admin_access_token` (TTL 30 phút, `Path=/`, `HttpOnly`, `SameSite=Strict`) vs `access_token` (user thường) và `refresh_token` (`Path=/api/auth`, `SameSite=Lax`). Xem `auth-service/.../security/CookieUtils.java#L25-L51`.
2. **Endpoint đăng nhập riêng:** `POST /api/auth/admin/login`, có kiểm tra `user.getRole() == Role.ADMIN` và bộ đếm lockout riêng (`ADMIN_MAX_FAILED_ATTEMPTS`).
3. **Nhánh filter riêng ở Gateway:** `JwtAuthenticationFilter.java#L85-L92` — chỉ với path `/api/auth/admin/**` hoặc `/api/admin/**` thì Gateway mới đọc cookie `admin_access_token` (fallback `access_token`); các path khác chỉ đọc `access_token`.

---

## 3. Root Cause (đọc code + tái hiện)

Chuỗi nguyên nhân nằm ở `api-gateway/src/main/java/com/example/gateway/filter/JwtAuthenticationFilter.java`:

```java
// L107-116
return authWebClient.post()
        .uri("/api/auth/verify")
        .header(HttpHeaders.AUTHORIZATION, bearerHeader)
        .retrieve()                       // (1) 4xx/5xx → NÉM WebClientResponseException
        .bodyToMono(Boolean.class)
        .onErrorResume(ex -> {
            log.error("Auth service unavailable: {}", ex.getMessage());
            return Mono.empty();          // (2) MỌI lỗi HTTP bị nuốt thành "empty"
        })
        .switchIfEmpty(Mono.defer(() -> serviceUnavailable(exchange).then(Mono.empty())));
                                          // (3) empty → 503
```

Và `auth-service/.../config/SecurityConfig.java#L43-L64`: `/api/auth/verify` **không** nằm trong danh sách `permitAll()`; `anyRequest().authenticated()` được áp dụng. Vì vậy với token không hợp lệ, chính `JwtAuthenticationFilter` của auth-service (`.../security/JwtAuthenticationFilter.java#L57`) chặn trước khi tới controller và trả `401 {"status":401,"error":"Unauthorized","message":"Invalid token type"}`.

⇒ `retrieve()` thấy `401` → ném exception → `onErrorResume` trả `Mono.empty()` → `switchIfEmpty` biến thành **`503`**. Code **không phân biệt được** "token sai" với "auth-service chết".

**Hệ quả kèm theo:** `Boolean` trả về `false` (token hợp lệ về format nhưng bị từ chối) sẽ đi nhánh `unauthorized(...)` → `401` đúng. Chỉ nhánh **lỗi HTTP** mới bị map sai thành `503`.

---

## 4. Bằng Chứng (curl thật, 2026-10-08)

**(a) Token SAI → Gateway 503, nhưng auth-service trả 401 đúng:**

```http
$ curl -H 'Cookie: admin_access_token=not-a-jwt' http://localhost:8080/api/auth/admin/users
HTTP/1.1 503
{"error": "Authentication service unavailable"}

$ curl -H 'Authorization: Bearer not-a-jwt' http://localhost:8080/api/auth/admin/users
HTTP/1.1 503
{"error": "Authentication service unavailable"}

$ curl -X POST -H 'Authorization: Bearer not-a-jwt' http://localhost:8081/api/auth/verify
HTTP/1.1 401
{"status":401,"error":"Unauthorized","message":"Invalid token type"}
```

**(b) Token HỢP LỆ → luồng admin chạy đúng (HTTP 200):**

```http
$ curl -X POST http://localhost:8080/api/auth/admin/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"<ADMIN_INITIAL_EMAIL>","password":"<ADMIN_INITIAL_PASSWORD>"}'
HTTP/1.1 200
Set-Cookie: admin_access_token=eyJ...; Path=/; Max-Age=1800; HttpOnly; SameSite=Strict

$ curl -H 'Cookie: admin_access_token=eyJ...' \
    'http://localhost:8080/api/auth/admin/users?page=0&size=20'
HTTP/1.1 200
{"totalElements":1,"totalPages":1,"size":20,"number":0,"numberOfElements":1,
 "first":true,"last":true,"content":[{"id":"56030fa2-...","username":"admin", ...}]}

$ curl -H 'Cookie: admin_access_token=eyJ...' \
    http://localhost:8080/api/auth/admin/dashboard/stats
HTTP/1.1 200
{"activeUsers":1,"bannedUsers":0, ...}
```

**(c) Các port đã quét (`GET /api/auth/admin/users`) — không có port admin riêng:**

| Port | Kết quả | Là gì |
| :--: | :-----: | :---- |
| 8080 | `401` (không credential) | Gateway |
| 8081 | `403` (không credential) | auth-service |
| 8025 | `404` | Mailpit UI |
| 8045 | `200` (mọi path) | antigravity-manager (không liên quan) |
| 3336 | — | MySQL của project khác |
| 8082–8090 | connection refused | content/chat/chatbot/media/notification/recommender **chưa chạy** |

> ⚠️ Nhiều service khác trong `application.yml` của Gateway (`content-service` 8084, `chat-service` 8083, `media-service` 8085, `notification-service` 8086, `chatbot-service` 8082, `recommender-service` 8090) **hiện không chạy** → các route đó sẽ lỗi. Không ảnh hưởng Sprint 2.3 (chỉ dùng auth-service).

---

## 5. Ảnh Hưởng Tới Phía Frontend (Impact)

1. **Phiên admin hết hạn (sau 30 phút) → FE nhận `503`, không phải `401`.** `error-parser.ts` map `503` → `kind: 'server'` → UI hiển thị `error.server.internalError` kèm nút Retry. Người dùng thấy *"Internal server error"* thay vì được đưa về trang đăng nhập. Logic xử lý `401` của FE **không bao giờ được kích hoạt** trong tình huống này.
2. **Nhiễu observability:** log/metric của Gateway ghi nhận "Authentication service unavailable" cho các token hết hạn — dễ che mất sự cố hạ tầng thật.
3. **Không chặn phiên hợp lệ.** Dashboard (2.2) và Users (2.3) tải được dữ liệu thật khi đã đăng nhập.
4. **Lưu ý production:** `admin_access_token` đặt `SameSite=Strict`. Ở dev, FE (`localhost:3000`) và Gateway (`localhost:8080`) là **cùng site** (port không tính vào "site") nên cookie vẫn được gửi. Nhưng nếu triển khai FE và Gateway ở **hai domain khác nhau**, `SameSite=Strict` sẽ chặn cookie ⇒ cần cân nhắc `SameSite=None; Secure` hoặc cùng domain.

---

## 6. Đính Chính So Với Báo Cáo Ban Đầu

Bản đầu của BI-006 kết luận `P0` và cho rằng mọi request admin đều hỏng, dựa trên phép thử với token **giả**. Kiểm chứng lại bằng **phiên admin thật** (đăng nhập bằng seed admin trong `.env` của server repo):

| Kịch bản | Kết quả thật | Kết luận |
| :------- | :----------- | :------- |
| Token hợp lệ → `/admin/users`, `/admin/dashboard/stats` | **200 + dữ liệu thật** | Luồng admin **hoạt động** |
| Token sai/hết hạn → cùng endpoint | **503** (đúng phải 401) | **Bug thật, mức P1** |

⇒ Đánh giá `P0` là **sai** và đã được sửa. Không có blocker cho Sprint 2.3 / Phase 2.

---

## 7. Đề Xuất Giải Pháp Cho Backend (Recommendation)

1. **Phân biệt lỗi trong `JwtAuthenticationFilter`** (`api-gateway`): bắt riêng `WebClientResponseException`
   - `401`/`403` từ `/api/auth/verify` ⇒ **`401 Invalid or expired token`** (kèm `WWW-Authenticate`).
   - Chỉ `5xx`, timeout, `ConnectException` ⇒ `503 Service Unavailable`.
   ```java
   .onErrorResume(WebClientResponseException.class, ex ->
           unauthorized(exchange, "Invalid or expired token").then(Mono.empty()))
   .onErrorResume(ex -> { log.error(...); return Mono.empty(); })
   ```
2. **Thêm `/api/auth/verify` vào `permitAll()`** trong `SecurityConfig` của auth-service (đây là endpoint nội bộ dùng để kiểm tra token; để nó bị chặn bởi chính filter JWT là vòng lặp khó hiểu). Controller đã tự trả `false` cho token sai (`AuthController#verify`, `L181-L185`) nên chỉ cần cho phép đi qua.
3. **Bổ sung test tích hợp Gateway** cho 3 case trên nhánh `/api/auth/admin/**`: cookie hợp lệ → `200`; cookie sai → `401`; auth-service tắt hẳn → `503`.
4. *(Tối ưu, không bắt buộc)* Cân nhắc bỏ lời gọi HTTP đồng bộ `/api/auth/verify` cho mỗi request — Gateway đã có `JwtPayloadUtil` để decode payload; có thể verify chữ ký cục bộ bằng public key và chỉ gọi auth-service khi cần kiểm tra blacklist.
5. *(Liên quan)* Thống nhất shape lỗi với các service — xem [BI-003](BI-003-gateway-shape-inconsistent.md).

---

## 8. Ghi Chú Vận Hành Cho Dev (không phải bug)

- **`fetch('/api/auth/admin/users')` trong DevTools Console → `404` là ĐÚNG, không phải lỗi backend.** URL tương đối trỏ vào chính Next.js dev server (`:3000`); middleware của Next có matcher loại trừ `/api`, nên Next trả `404`. FE thật luôn gọi qua axios client với `baseURL = NEXT_PUBLIC_API_URL` (`http://localhost:8080`). Muốn thử tay phải dùng URL tuyệt đối hoặc dùng chính axios client.
- **DB dev hiện chỉ có 1 user** (`admin@snapgram.com`) ⇒ trang `/admin/users` trên browser sẽ hiển thị **1 dòng**, không phải 25. Con số 25 user chỉ tồn tại trong MSW mock dùng cho unit/E2E test.
- **Seed admin dev:** biến `ADMIN_INITIAL_EMAIL` / `ADMIN_INITIAL_PASSWORD` trong `Snapgram-Server/.env` (mặc định `admin@snapgram.com`). FE đang đặt placeholder ở ô email là `admin@snapgram.dev` (**sai domain**, đúng là `.com`) — nên sửa cho khỏi gây nhầm lẫn.

---

## 9. Tái Hiện Nhanh (Reproduction)

```bash
# 1. Xác nhận 503 cho token sai (bug)
curl -i -H 'Cookie: admin_access_token=not-a-jwt' \
  http://localhost:8080/api/auth/admin/users

# 2. Xác nhận auth-service vẫn khoẻ và trả 401 đúng
curl -i -X POST -H 'Authorization: Bearer not-a-jwt' \
  http://localhost:8081/api/auth/verify

# 3. Xác nhận luồng hợp lệ vẫn chạy (thay bằng seed admin trong .env)
curl -i -X POST http://localhost:8080/api/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<ADMIN_INITIAL_EMAIL>","password":"<ADMIN_INITIAL_PASSWORD>"}'
```

---

## 10. Verification (Sau Khi BE Fix — 2026-10-16)

**Backend change:** `api-gateway` — phân biệt lỗi verify token (`401`) với service không sẵn sàng (`503`), đồng thời chuẩn hoá Shape A `ErrorResponse`, commit `d4ece81`.

**Runtime verify** (`Authorization`/cookie admin):

```
GET  /api/auth/admin/users   Cookie: admin_access_token=not-a-jwt   → 401
GET  /api/auth/admin/users   Cookie: <JWT rác>                      → 401
POST /api/auth/logout        (revoke token)                         → 204
GET  /api/auth/me            Cookie: <token vừa revoke>             → 401
GET  /api/auth/me            Cookie: <token mới, hợp lệ>            → 200   (đối chứng)
```

Body `401` có `code` + `message` (không còn body `503`):

```json
{"status":401,"code":"UNAUTHORIZED","error":"Unauthorized","message":"Invalid or expired token"}
```

**Kết luận:** BI-006 đã fix — token không hợp lệ/hết hiệu lực trả `401`, KHÔNG còn `503`.

---

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
