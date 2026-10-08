# BI-006: API Gateway Trả 503 "Authentication service unavailable" Cho Mọi Request `/api/auth/admin/**` Có Credential

- **Priority:** `P0` (Blocker)
- **Status:** `Open`
- **Module ảnh hưởng:** `api-gateway` (admin authentication filter), gián tiếp toàn bộ `auth-service`
- **Ngày phát hiện:** 2026-10-08
- **Phát hiện tại:** Sprint 2.3 (User Management) — khi xác minh tích hợp thật

---

## 1. Mô Tả Vấn Đề

Mọi request tới các đường dẫn `/api/auth/admin/**` qua API Gateway (`:8080`) **khi có kèm credential** (cookie `admin_access_token` hoặc header `Authorization: Bearer`) đều bị trả về:

```http
HTTP/1.1 503 Service Unavailable
{"error": "Authentication service unavailable"}
```

Trong khi đó:
- **Không** kèm credential → Gateway trả `401 {"error": "Missing or invalid Authorization header"}` (đúng, do filter của Gateway).
- Gọi **trực tiếp** `auth-service` (`:8081`) cùng đường dẫn và cùng credential → trả `401 {"status":401,"error":"Unauthorized","message":"Invalid token type"}` (đúng, đủ shape).

⇒ Có một filter xác thực riêng cho nhánh `/api/auth/admin/**` ở Gateway đang **thực hiện một lời gọi downstream để kiểm tra token và lời gọi đó thất bại**, sau đó map sai thành `503` thay vì `401/403`.

Đây **không phải** vấn đề cấu trúc lỗi (đã có [BI-003](BI-003-gateway-shape-inconsistent.md)) mà là **lỗi chức năng**: nhánh xác thực admin không hoạt động.

---

## 2. Ảnh Hưởng Tới Phía Frontend (Impact)

- **Chặn toàn bộ Admin Portal ở tầng tích hợp thật.** Mọi màn hình Phase 2 đều gọi `/api/auth/admin/**`:
  - Sprint 2.2 — `GET /api/auth/admin/dashboard/stats`
  - Sprint 2.3 — `GET/POST /api/auth/admin/users*`
  - Sprint 2.4 — `GET/POST/PUT /api/auth/admin/roles*`
- Với `503`, tầng `error-parser` của FE map sang `kind: 'server'` → UI hiển thị trạng thái lỗi `error.server.internalError` kèm nút Retry. **Không thể** tải dữ liệu thật, không thể kiểm thử end-to-end bằng trình duyệt dù đã đăng nhập đúng.
- Hiện tượng này **giống hệt nhau** trên dashboard và users → rất dễ bị chẩn đoán nhầm là lỗi từng feature của FE.
- FE **không có workaround** (không thể sửa hành vi Gateway từ phía client).

---

## 3. Bằng Chứng (Evidence — Swagger sống + curl thật, 2026-10-08)

Bảng dưới đây chạy trên `localhost:8080` (Gateway) và `localhost:8081` (auth-service), cùng gửi `-H 'Cookie: admin_access_token=fake'`:

| Đường dẫn | Qua Gateway `:8080` | Trực tiếp auth-service `:8081` |
| :-------- | :-----------------: | :----------------------------: |
| `/api/auth/admin/users` | **503** | 401 |
| `/api/auth/admin/dashboard/stats` | **503** | 401 |
| `/api/auth/admin/roles` | **503** | 401 |
| `/api/auth/admin/permissions` | **503** | 401 |
| `/api/users/me` | 401 | 403 |
| `/api/auth/me` | 401 | 403 |
| `/api/auth/verify` | 401 | 403 |

Body lỗi 503 (chỉ có 1 trường, tự sinh bởi Gateway):

```json
{ "error": "Authentication service unavailable" }
```

Các đối chứng cho thấy Gateway ↔ auth-service **vẫn thông** ở các nhánh khác:

```http
$ curl -s http://localhost:8080/actuator/health
{"groups":["liveness","readiness"],"status":"UP"}

$ curl -s -X POST http://localhost:8080/api/auth/admin/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"nope@x.dev","password":"wrong"}'
HTTP/1.1 401
{"error":"Unauthorized","message":"Invalid email or password","status":401,
 "timestamp":"2026-10-08T05:03:44.994482368Z"}
```

⇒ Route `/api/auth/admin/login` (permit-all) đi qua Gateway bình thường và trả đúng JSON của auth-service ⇒ **không phải** lỗi service discovery/route tổng quát, mà đúng ở **nhánh xác thực admin**.

> ⚠️ **Giới hạn của bằng chứng:** các lần kiểm tra trên dùng token **giả** (`fake`), nên chưa loại trừ được khả năng với token **hợp lệ** nhánh này hoạt động. Tuy nhiên dù token không hợp lệ thì hành vi đúng vẫn phải là `401`, **không** phải `503`. Cần xác nhận lại bằng một phiên đăng nhập admin thật.

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)

1. Rà soát filter xác thực admin của Gateway (nhánh `/api/auth/admin/**`) và lời gọi downstream mà nó thực hiện để kiểm tra `admin_access_token`.
2. **Map đúng mã lỗi:** token thiếu/không hợp lệ/hết hạn → `401`; thiếu quyền → `403`; chỉ trả `503` khi **thực sự** không gọi được auth-service (circuit breaker), kèm log rõ nguyên nhân.
3. Log nguyên nhân thật của lời gọi thất bại (hiện đang bị che sau thông báo chung "Authentication service unavailable"), ví dụ: URL introspection sai, timeout, thiếu header lan truyền, hoặc endpoint kiểm tra không tồn tại.
4. Bổ sung test tích hợp Gateway cho 3 case: có cookie hợp lệ / cookie không hợp lệ / không có cookie trên nhánh `/api/auth/admin/**`.
5. Cân nhắc thống nhất shape lỗi với các service (liên quan [BI-003](BI-003-gateway-shape-inconsistent.md)).

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)

- **Không có workaround.** FE giữ nguyên thiết kế cookie httpOnly `admin_access_token` (`withCredentials: true`) theo `architect/auth-and-security-flow.md`.
- `error-parser.ts` đã map `503` → `kind: 'server'` → UI hiển thị `error.server.internalError` + nút Retry, nên lỗi được hiển thị an toàn (không crash, không lộ chuỗi tiếng Anh thô của backend).
- Cho tới khi BI-006 được sửa, việc kiểm thử Phase 2 **chỉ có thể dựa vào MSW mock trong unit/E2E test**, không thể xác minh bằng dữ liệu thật trên trình duyệt.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
