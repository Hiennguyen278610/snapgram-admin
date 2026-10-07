# BI-004: Inconsistent Rate Limit Headers Between Gateway and Services

- **Priority:** `P2` (Minor / Code Cleanliness)
- **Status:** `Open`
- **Module ảnh hưởng:** `api-gateway`, `auth-service`
- **Ngày phát hiện:** 2026-10-07

---

## 1. Mô Tả Vấn Đề
Khi xảy ra tình trạng giới hạn tần suất gọi API (HTTP `429 Too Many Requests`), có sự không đồng nhất về tiêu đề phản hồi (Response Header) chứa thời gian chờ:
- **API Gateway (`RateLimitFilter`):** Trả về header epoch timestamp `X-Rate-Limit-Reset`:
  ```http
  HTTP/1.1 429 Too Many Requests
  X-Rate-Limit-Reset: 1791370060
  ```
- **Auth Service (`RateLimitInterceptor`):** Trả về cả header tiêu chuẩn `Retry-After` (tính bằng số giây đếm lùi) kèm bộ ba header:
  ```http
  HTTP/1.1 429 Too Many Requests
  Retry-After: 60
  X-Rate-Limit-Limit: 10
  X-Rate-Limit-Remaining: 0
  X-Rate-Limit-Reset: 1791370000
  ```

---

## 2. Ảnh Hưởng Tới Phía Frontend (Impact)
- Phía Frontend khi hiển thị thông báo đếm ngược cho Quản trị viên ("Vui lòng thử lại sau X giây") phải viết logic kiểm tra cả 2 header: một bên là số giây tương đối (`Retry-After`), một bên là thời điểm tuyệt đối dạng Unix Timestamp (`X-Rate-Limit-Reset`).

---

## 3. Bằng Chứng Mã Nguồn (Evidence)
- Gateway filter: `api-gateway/src/main/java/com/example/gateway/filter/RateLimitFilter.java#L98-L100`:
  ```java
  exchange.getResponse().getHeaders()
          .add("X-Rate-Limit-Reset",
                  String.valueOf(System.currentTimeMillis() / 1000 + refillDurationSeconds));
  ```
- Auth Service interceptor: `auth-service/src/main/java/com/example/auth/config/RateLimitInterceptor.java#L52-L55`:
  ```java
  response.setStatus(429);
  response.setHeader("Retry-After", String.valueOf(WINDOW.getSeconds()));
  addRateLimitHeaders(response, probe);
  ```

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)
Thống nhất bổ sung header chuẩn quốc tế **`Retry-After`** (RFC 7231) vào cả `RateLimitFilter` của API Gateway để chuẩn hóa giao tiếp cho mọi client HTTP.

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)
- Trong hàm trích xuất thời gian chờ `extractRetryAfter(headers)`:
  1. Kiểm tra header `Retry-After`. Nếu có, parse số nguyên (giây).
  2. Nếu không có, đọc `X-Rate-Limit-Reset` (timestamp giây), lấy giá trị trừ đi thời gian hiện tại (`Math.max(0, resetEpoch - Math.floor(Date.now() / 1000))`).
  3. Nếu cả 2 đều không có, sử dụng fallback mặc định là 60 giây.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
