# BI-010: Gateway Chọn Cookie Theo Path → Admin Portal Không Gọi Được `/api/auth/me` và `/api/auth/logout`

- **Priority:** `P1` (Important)
- **Status:** `Fixed` (2026-10-16)
- **Module ảnh hưởng:** `api-gateway` (`JwtAuthenticationFilter`)
- **Ngày phát hiện:** 2026-10-08
- **Phát hiện tại:** kiểm tra tích hợp trước Sprint 2.6

---

## 1. Mô Tả Vấn Đề

Hai endpoint xác thực mà Admin Portal cần dùng — `GET /api/auth/me` và `POST /api/auth/logout` — **không thể gọi được bằng cookie `admin_access_token`**, tức là bằng đúng cơ chế xác thực mà Portal đang dùng. Cả hai đều trả:

```http
HTTP/1.1 401 Unauthorized
{"error": "Missing or invalid Authorization header"}
```

Nguyên nhân: `JwtAuthenticationFilter` (Gateway) **chọn tên cookie theo tiền tố đường dẫn** (`JwtAuthenticationFilter.java#L85-L92`):

```java
if (path.startsWith("/api/auth/admin") || path.startsWith("/api/admin")) {
    cookie = exchange.getRequest().getCookies().getFirst("admin_access_token");
    if (cookie == null) cookie = exchange.getRequest().getCookies().getFirst("access_token");
} else {
    cookie = exchange.getRequest().getCookies().getFirst("access_token");   // ← chỉ access_token
}
```

`/api/auth/me` và `/api/auth/logout` **không** nằm trong nhánh admin ⇒ Gateway chỉ tìm `access_token`. Nhưng luồng đăng nhập admin (`POST /api/auth/admin/login`) **chỉ** set `admin_access_token` + `refresh_token`, **không bao giờ** set `access_token` (`CookieUtils.createAdminAccessTokenCookie`).

⇒ Không có cách nào để Portal gọi 2 endpoint này: FE **không đọc được** cookie httpOnly để tự dựng header `Authorization` (đúng theo thiết kế bảo mật).

**Điểm mâu thuẫn đáng chú ý:** bản thân controller `logout` **đã** hỗ trợ `admin_access_token` (`AuthController.java#L156-L157` fallback sang `ADMIN_ACCESS_TOKEN_COOKIE`) — nhưng request bị Gateway chặn **trước khi** tới controller. Vậy đây thuần là bug của Gateway, không phải của auth-service.

---

## 2. Bằng Chứng (cùng MỘT token admin hợp lệ, 2026-10-08)

### `GET /api/auth/me`

| Cách gửi credential | Kết quả |
| :------------------ | :-----: |
| `Cookie: admin_access_token=…` **(cách FE đang dùng)** | **401** ❌ |
| `Cookie: access_token=…` | 200 ✅ |
| `Authorization: Bearer …` | 200 ✅ |
| Trực tiếp `:8081` + `Bearer` | 200 ✅ |

⇒ Endpoint và token đều tốt; lỗi nằm ở nhánh chọn cookie của Gateway.

### `POST /api/auth/logout`

| Cách gửi credential | Kết quả | Set-Cookie |
| :------------------ | :-----: | :--------- |
| `Cookie: admin_access_token=…` | **401** ❌ | **không có** (không clear gì) |
| `Authorization: Bearer …` | **204** | ✅ clear cả 3 cookie (xem dưới) |

Khi request qua được Gateway, việc clear cookie hoạt động **chính xác**:

```http
Set-Cookie: access_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly
Set-Cookie: admin_access_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly
Set-Cookie: refresh_token=; Path=/api/auth; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly
```

---

## 3. Ảnh Hưởng Tới Phía Frontend (Impact)

- **Không thể đăng xuất đúng cách.** Nút Logout nếu gọi `POST /api/auth/logout` bằng cookie sẽ nhận 401 và **cookie `admin_access_token` vẫn còn nguyên** → phiên không bị huỷ ở phía trình duyệt. FE buộc phải tự xoá cookie bằng JavaScript — nhưng cookie là **httpOnly** nên **không xoá được**. Hệ quả: người dùng bấm Logout mà vẫn còn đăng nhập cho tới khi token hết hạn (30 phút), hoặc phải xoá cookie thủ công trong DevTools.
- **Không lấy được thông tin admin hiện tại.** `component-inventory.md` §2.1 có component `AdminProfileCard` hiển thị admin hiện tại từ `GET /api/auth/me` → **không triển khai được**.
- **Chặn "role-filtered sidebar"** (đã hoãn sang Sprint 3.3): muốn ẩn/hiện menu theo vai trò thì FE cần biết `role`. Hiện token là httpOnly nên `GET /api/auth/me` là nguồn duy nhất — và nó đang bị chặn.
- `auth-and-security-flow.md` (sơ đồ tuần tự đăng nhập admin) mô tả bước `UI->>GW: GET /api/auth/me` như đang hoạt động → **không đúng với thực tế**.

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)

1. **Bỏ việc chọn cookie theo path** — đây là gốc rễ. Nên thử lần lượt cho **mọi** path được bảo vệ, ví dụ:
   ```java
   cookie = exchange.getRequest().getCookies().getFirst("access_token");
   if (cookie == null) cookie = exchange.getRequest().getCookies().getFirst("admin_access_token");
   ```
   (hoặc thử `admin_access_token` trước cho các path `/api/auth/admin/**`, rồi fallback cho phần còn lại). Không có rủi ro bảo mật: cả hai token đều được auth-service xác thực qua `/api/auth/verify`.
2. **Hoặc** cho `POST /api/auth/admin/login` set **cả** `admin_access_token` **và** `access_token` (cùng giá trị) — nhưng cách này làm rò ngữ nghĩa "admin tách luồng", không khuyến nghị.
3. Bổ sung test tích hợp Gateway: gọi `/api/auth/me` và `/api/auth/logout` bằng `admin_access_token` → kỳ vọng 200/204 (hiện 401).
4. (Kèm) Sửa tài liệu cho khớp thực tế: `/api/auth/me` trả `UserMeResponse` với **`role` số ít**, không có `roles`; `logout` trả **204**, không phải 200; Swagger khai báo `avatarUrl` nhưng admin không có avatar nên field bị lược bỏ khỏi JSON.

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)

**Chưa có workaround khả thi.** FE không thể tự xoá cookie httpOnly và không thể tự dựng header `Authorization`. Trạng thái hiện tại:

1. **Không** triển khai nút Logout / `AdminProfileCard` cho tới khi BI-010 được sửa (tránh tạo control không hoạt động).
2. Route guard hiện tại của `src/middleware.ts` chỉ kiểm tra **sự tồn tại** của cookie, nên luồng đăng nhập/đăng xuất vẫn "trông" đúng dù logout không thực sự huỷ phiên — cần lưu ý khi kiểm thử.
3. Ghi nhận vào [conventions.md §17](../architect/conventions.md).


---

## 7. Mở Rộng Phạm Vi (Phát Hiện Sprint 2.6)

**Ảnh hưởng thêm:** Không chỉ `/api/auth/me` và `/api/auth/logout`, mà TOÀN BỘ `/api/media/**` cũng bị ảnh hưởng.

**Bằng chứng:**
```
GET /api/media/me    Cookie: admin_access_token=<hợp lệ>  → 401
GET /api/media/me    Authorization: Bearer <cùng token>    → 200
GET /api/media/{id}  Cookie: admin_access_token            → 401 (không phải 404)
```

**Root cause:** cùng dòng `JwtAuthenticationFilter` — chỉ 2 prefix `/api/auth/admin` + `/api/admin` được đọc `admin_access_token`. `/api/media/**` rơi vào nhánh else → tìm `access_token`.

**Impact thêm:** Admin Portal không thể dùng media service qua cookie. Sprint 2.6 (Media Management) chỉ test được với MSW.

**Đề xuất BE (bổ sung):** khi fix BI-010, thử **cả 2 cookie** theo thứ tự ưu tiên thay vì chọn theo path:
```java
Cookie c = getFirst("admin_access_token");
if (c == null) c = getFirst("access_token");
```

---

## 8. Verification (Sau Khi BE Fix — 2026-10-16)

**Backend change:** `api-gateway/.../JwtAuthenticationFilter.java` — nhánh `else` (mọi path KHÔNG thuộc `/api/auth/admin**` + `/api/admin**`) nay **fallback sang `admin_access_token`** khi không có `access_token`. Commit `d4ece81`. (`auth-service` cũng fallback tương tự trong `JwtAuthenticationFilter.resolveToken`.)

**Chặn tạm thời:** phải fix [BI-011](BI-011-auth-service-boot-failure-ratelimit-interceptor.md) (auth-service không boot được) trước mới verify runtime được.

**Backend PR:** https://github.com/hoangdinhreborn/Snapgram-Server/pull/19

**Runtime verify** — login `admin@snapgram.com`; cookie nhận được là httpOnly `admin_access_token` + `refresh_token` (**KHÔNG** có `access_token`, đúng như mô tả bug):

```
GET  /api/auth/me                 Cookie: admin_access_token → 200
GET  /api/media/me                Cookie: admin_access_token → 200
GET  /api/admin/reports           Cookie: admin_access_token → 200
GET  /api/auth/admin/users        Cookie: admin_access_token → 200
GET  /api/auth/admin/roles        Cookie: admin_access_token → 200
POST /api/auth/logout             Cookie: admin_access_token → 204
```

**Negative control:** gọi lại các endpoint trên **không** kèm cookie → `401` ⇒ xác nhận kết quả `200` ở trên là nhờ cookie admin, không phải endpoint public.

**Kết luận:** BI-010 đã fix. FE có thể dùng cookie admin cho **mọi endpoint protected** (không chỉ `/api/auth/admin/**` + `/api/admin/**`).

---

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
