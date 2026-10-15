# BI-011: Commit `d4ece81` Làm `auth-service` Không Khởi Động Được (`RateLimitInterceptor` — No default constructor found)

- **Priority:** `P0` (Blocker) — chặn **toàn bộ** backend khởi động, không riêng một endpoint
- **Status:** `Open`
- **Module ảnh hưởng:** `auth-service` (`com.example.auth.config.RateLimitInterceptor`), kéo theo `api-gateway` (do `depends_on: auth-service: condition: service_healthy`)
- **Ngày phát hiện:** 2026-10-15
- **Phát hiện tại:** verify runtime BI-010 sau khi pull commit `d4ece81` (merge commit `18a3a82`)
- **Commit gây lỗi:** `d4ece81` — *"fix: resolve backend API and gateway consistency issues across services"* (2026-10-15 19:44)
- **Mức độ thực tế:** `auth-service` **crash-loop 16 lần** rồi bị đánh dấu `unhealthy`. `api-gateway` **không start được**. Mọi luồng cần đăng nhập (`/api/auth/**`, `/api/admin/**`, `/api/media/**`) đều không dùng được.

---

## 1. Mô Tả Vấn Đề

Commit `d4ece81` (commit fix BI-010) **thêm constructor thứ hai** vào `RateLimitInterceptor` mà **không annotate `@Autowired`** cho constructor nào. Spring, khi gặp bean có nhiều hơn một constructor và không có constructor nào được chỉ định, sẽ tìm **default (no-arg) constructor** — class không có → `BeanCreationException` ngay lúc khởi tạo context.

```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    // constructor #1 (đã có từ trước)
    public RateLimitInterceptor(ProxyManager<byte[]> proxyManager) { ... }

    // constructor #2 — THÊM MỚI ở d4ece81, không @Autowired
    public RateLimitInterceptor(ProxyManager<byte[]> proxyManager, ObjectMapper objectMapper) { ... }
}
```

`WebConfig` inject bean này bằng field injection nên Spring **buộc phải** khởi tạo nó:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private RateLimitInterceptor rateLimitInterceptor;   // ← kích hoạt lỗi

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor).addPathPatterns("/api/auth/**");
    }
}
```

**Điểm mấu chốt:** trước `d4ece81`, class chỉ có **một** constructor → Spring tự động chọn (single-constructor autowiring) → chạy bình thường. Việc thêm constructor thứ hai đã phá vỡ cơ chế đó.

---

## 2. Bằng Chứng (`docker logs snapgram-auth-service`, 2026-10-15)

Build lại image từ đúng commit `18a3a82` rồi `docker compose up -d`:

```
2026-10-15 16:27:09 - Initialized JPA EntityManagerFactory for persistence unit 'default'
2026-10-15 16:27:19 - Exception encountered during context initialization - cancelling refresh attempt:
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'rateLimitInterceptor'
defined in URL [jar:nested:/app/app.jar/!BOOT-INF/classes/!/com/example/auth/config/RateLimitInterceptor.class]:
Failed to instantiate [com.example.auth.config.RateLimitInterceptor]: No default constructor found
2026-10-15 16:27:19 - Closing JPA EntityManagerFactory for persistence unit 'default'
2026-10-15 16:27:19 - HikariPool-1 - Shutdown initiated...
2026-10-15 16:27:19 - Stopping service [Tomcat]
2026-10-15 16:27:19 -
Error starting ApplicationContext. To display the condition evaluation report re-run your application with 'debug' enabled.
2026-10-15 16:27:19 - Application run failed
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'rateLimitInterceptor'
defined in URL [jar:nested:/app/app.jar/!BOOT-INF/classes/!/com/example/auth/config/RateLimitInterceptor.class]:
Failed to instantiate [com.example.auth.config.RateLimitInterceptor]: No default constructor found
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.instantiateBean(AbstractAutowireCapableBeanFactory.java:1342)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBeanInstance(AbstractAutowireCapableBeanFactory.java:1229)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:565)
	...
Caused by: org.springframework.beans.BeanInstantiationException:
Failed to instantiate [com.example.auth.config.RateLimitInterceptor]: No default constructor found
	at org.springframework.beans.factory.support.SimpleInstantiationStrategy.instantiate(SimpleInstantiationStrategy.java:102)
	... 24 common frames omitted
Caused by: java.lang.NoSuchMethodException: com.example.auth.config.RateLimitInterceptor.<init>()
	at java.base/java.lang.Class.getConstructor0(Unknown Source)
	at java.base/java.lang.Class.getDeclaredConstructor(Unknown Source)
```

Hệ quả trực tiếp trên compose:

```
Container snapgram-auth-service Started
Container snapgram-auth-service Waiting
Container snapgram-auth-service Error dependency auth-service failed to start
dependency failed to start: container snapgram-auth-service is unhealthy
```

`docker inspect snapgram-auth-service` → `restarts=16`, `health=starting` (crash-loop vô hạn vì `restart: unless-stopped`).

---

## 3. Root Cause

| | |
|---|---|
| **File** | `auth-service/src/main/java/com/example/auth/config/RateLimitInterceptor.java` |
| **Dòng** | 31 (ctor 1 tham số) và 35 (ctor 2 tham số) |
| **Vấn đề** | 2 constructor, không constructor nào có `@Autowired` ⇒ Spring không biết chọn cái nào và đòi default constructor |
| **Commit** | `d4ece81` |
| **Vì sao trước đó chạy được** | Bản cũ (`8522c82`) chỉ có **1** constructor ⇒ Spring single-constructor autowiring |

---

## 4. Ảnh Hưởng Tới Phía Frontend (Impact)

- **Chặn hoàn toàn việc verify BI-010 runtime.** Không thể chạy 5 curl (`/api/auth/me`, `/api/auth/logout`, `/api/media/me`, `/api/admin/reports`, `/api/auth/admin/users`) vì `:8080` không lên.
- **Sprint 3.1 (System Health)** trên FE sẽ hiển thị Gateway/Auth là `DOWN` — phản ánh đúng thực tế, không phải bug FE.
- Mọi luồng đăng nhập/refresh token của Admin Portal không hoạt động khi chạy backend thật.
- FE **không có workaround** — đây thuần là lỗi khởi động service.

---

## 5. Tái Hiện Nhanh (Reproduction)

```bash
cd Snapgram-Server
git checkout 18a3a82          # commit có d4ece81

docker compose -f infra/docker-compose.yml build auth-service
docker compose -f infra/docker-compose.yml up -d auth-service
sleep 20
docker logs snapgram-auth-service 2>&1 | grep -A2 "No default constructor found"
docker inspect -f '{{.RestartCount}} {{.State.Health.Status}}' snapgram-auth-service
# → 16 starting  (crash-loop)
```

Lưu ý: dùng **`docker compose`** (plugin v2), không dùng `docker-compose` (v1) vì bản v1.29.2 không tương thích Docker Engine 29.x.

---

## 6. Đề Xuất Giải Pháp Cho Backend (Recommendation)

**Phương án A — khuyến nghị (1 dòng, an toàn nhất, không phụ thuộc bean `ObjectMapper`):**

```java
@Autowired   // ← thêm dòng này
public RateLimitInterceptor(ProxyManager<byte[]> proxyManager) {
    this(proxyManager, new ObjectMapper());
}
```

Constructor 2 tham số sẽ trở thành constructor nội bộ được uỷ nhiệm, không còn gây nhập nhằng.

**Phương án B** — annotate constructor 2 tham số, **chỉ khi** context thực sự có bean `tools.jackson.databind.ObjectMapper` (Jackson 3):

```java
@Autowired
public RateLimitInterceptor(ProxyManager<byte[]> proxyManager, ObjectMapper objectMapper) { ... }
```

Nếu không có bean `ObjectMapper`, phương án này sẽ đổi lỗi `No default constructor found` sang `NoSuchBeanDefinitionException`.

**Phương án C** — xoá constructor 1 tham số và luôn dùng bản 2 tham số với `@Autowired`.

---

## 7. Verification Sau Khi Fix

Yêu cầu BE xác nhận tối thiểu:

```bash
docker compose -f infra/docker-compose.yml up -d auth-service api-gateway
curl -s http://localhost:8081/actuator/health     # {"status":"UP"}
curl -s http://localhost:8080/actuator/health     # {"status":"UP"}
docker inspect -f '{{.RestartCount}}' snapgram-auth-service   # 0
```

Sau khi BI-011 được fix, mới có thể chạy tiếp verification của **BI-010**.

---

*Quy ước trạng thái:* `Open` (Mới tạo) | `In Progress` (Đang sửa) | `Fixed` (Đã sửa xong) | `Wontfix` (Từ chối sửa).
