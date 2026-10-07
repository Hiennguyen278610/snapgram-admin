# BI-003: Inconsistent Error Shape Between API Gateway and Microservices

- **Priority:** `P1` (Important)
- **Status:** `Open`
- **Module ảnh hưởng:** `api-gateway`
- **Ngày phát hiện:** 2026-10-07

---

## 1. Mô Tả Vấn Đề
Có sự bất đồng bộ về cấu trúc dữ liệu JSON trả về giữa API Gateway và các Microservice:
- **Các Microservices (Downstream):** Trả về đầy đủ cấu trúc DTO `ErrorResponse`:
  ```json
  {
    "status": 401,
    "error": "Unauthorized",
    "message": "JWT token is expired",
    "timestamp": "2026-10-07T10:00:00Z"
  }
  ```
- **API Gateway (Spring Cloud Gateway WebFilter):** Do tự khởi tạo JSON thủ công qua WebFlux `DataBuffer`, Gateway chỉ trả về duy nhất 1 trường `error`:
  ```json
  {
    "error": "Missing or invalid Authorization header"
  }
  ```
  hoặc
  ```json
  {
    "error": "Rate limit exceeded. Please try again later."
  }
  ```

---

## 2. Ảnh Hưởng Tới Phía Frontend (Impact)
- Tầng HTTP Client / Interceptor của Frontend không thể dùng một interface duy nhất để parse response lỗi.
- Nếu code FE giả định luôn có `res.data.status` hay `res.data.message`, ứng dụng sẽ bị crash hoặc hiển thị `undefined` khi lỗi phát sinh từ Gateway.

---

## 3. Bằng Chứng Mã Nguồn (Evidence)
- Đoạn ghi response trong `JwtAuthenticationFilter` của Gateway:
  `api-gateway/src/main/java/com/example/gateway/filter/JwtAuthenticationFilter.java#L159-L167`:
  ```java
  private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
      exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
      exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
      String body = "{\"error\": \"" + message + "\"}";
      DataBuffer buffer = exchange.getResponse().bufferFactory()
              .wrap(body.getBytes(StandardCharsets.UTF_8));
      return exchange.getResponse().writeWith(Mono.just(buffer));
  }
  ```
- Đoạn ghi response trong `RateLimitFilter` của Gateway:
  `api-gateway/src/main/java/com/example/gateway/filter/RateLimitFilter.java#L95-L105`:
  ```java
  private Mono<Void> tooManyRequests(ServerWebExchange exchange) {
      exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
      exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
      String body = "{\"error\": \"Rate limit exceeded. Please try again later.\"}";
      ...
  }
  ```

---

## 4. Đề Xuất Giải Pháp Cho Backend (Recommendation)
Cập nhật các filter trong `api-gateway` để serialize chuỗi JSON chuẩn mực có đầy đủ các trường tương đương microservices:
```java
String body = String.format(
    "{\"status\": %d, \"error\": \"%s\", \"message\": \"%s\", \"timestamp\": \"%s\"}",
    HttpStatus.UNAUTHORIZED.value(),
    "Unauthorized",
    message,
    Instant.now().toString()
);
```

---

## 5. Giải Pháp Thích Ứng Của Frontend Hiện Tại (FE Workaround)
- Trong lớp `error-parser.ts`, thiết lập cơ chế phát hiện tự động (Shape Detector):
  ```typescript
  if (typeof data.status === 'number') {
    // Xử lý theo Shape A (Microservices)
    return {
      httpStatus: data.status,
      message: data.message || data.error,
      fieldErrors: data.errors
    };
  } else if (typeof data.error === 'string') {
    // Xử lý theo Shape B (Gateway)
    return {
      httpStatus: response.status,
      message: data.error
    };
  }
  ```

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
