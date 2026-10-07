# Environment Configuration & Variables Specification — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này xác lập quy chuẩn độc lập (self-contained) về cấu hình biến môi trường (environment variables), phân tầng triển khai (deployment tiers), quản lý bí mật (secret management) và kết nối Gateway cho **Snapgram Admin Portal**. Tài liệu gắn kết mật thiết với:
- [overview.md](../overview.md): Mục tiêu và kiến trúc phân hệ.
- [frontend-architecture.md](frontend-architecture.md): Sơ đồ luồng Gateway và downstream services.
- [auth-and-security-flow.md](auth-and-security-flow.md): Luồng xác thực cookie httpOnly.
- [env.example.md](env.example.md): Tài liệu mẫu khai báo biến môi trường cho Frontend.

---

## 2. Nguồn Gốc Phân Tích Từ Backend Repo
Dựa trên hạ tầng hiện tại của Snapgram-Server:
- **API Gateway (Spring Cloud Gateway):** Port `8080` (Cửa ngõ trung tâm duy nhất kết nối với Frontend).
- **Auth Service:** Port `8081` (Xác thực, phân quyền, quản lý user, JWT).
- **Content Service:** Port `8084` (Bài viết, bình luận, báo cáo vi phạm).
- **Media Service:** Port `8085` (Upload MinIO, presigned URLs).
- **Hạ tầng bổ trợ qua Docker Compose:**
  - MinIO S3 API: `http://localhost:9000` (Console: `http://localhost:9001`).
  - Kafka UI: `http://localhost:8089`.
  - Mailpit Web: `http://localhost:8025`.

---

## 3. Phân Tầng Môi Trường (Environment Tiers)
Dự án Admin Portal áp dụng 2 phân tầng môi trường cho giai đoạn MVP:

| Môi Trường | Tệp Cấu Hình | Địa Chỉ API Gateway | Mục Đích |
|---|---|---|---|
| **Development (`dev`)** | `.env.local` | `http://localhost:8080` | Môi trường phát triển cục bộ của lập trình viên. |
| **Production (`prod`)** | Platform env vars / `.env.production` | Domain chính thức (TBD) | Môi trường chạy thực tế sau khi triển khai hệ thống. |

> **RÀNG BUỘC QUẢN LÝ GIT:** Tuyệt đối KHÔNG commit các tệp `.env.local`, `.env.development.local`, hoặc `.env.production` lên Git repository. Chỉ commit tệp mẫu tài liệu `.env.example`.

---

## 4. Nguyên Tắc Quản Lý Bí Mật (Secret Management)
1. **Biến Công Khai (`NEXT_PUBLIC_*`):**
   - Mọi biến có tiền tố `NEXT_PUBLIC_` sẽ được Next.js nhúng trực tiếp vào bundle JavaScript gửi về trình duyệt của người dùng.
   - **Quy tắc vàng:** TUYỆT ĐỐI KHÔNG chứa secret keys, private credentials, access token bí mật hoặc mã nội bộ trong các biến `NEXT_PUBLIC_*`.
2. **Biến Nội Bộ (Server-side Secrets):**
   - Các biến không có tiền tố `NEXT_PUBLIC_` chỉ tồn tại trong môi trường Node.js Server Runtime (Next.js SSR/Middleware).
   - Được dev tự cấu hình trong `.env.local` khi chạy máy cá nhân, và thiết lập qua Dashboard của nền tảng triển khai (Vercel / Docker Container / K8s ConfigMap) khi lên Production.
   - **Nền tảng triển khai Production:** TBD (Vercel / Docker / Kubernetes).

---

## 5. Quy Chuẩn Xác Thực & Kết Nối Gateway (Auth Cookie Config)
- **Truyền nhận Credentials:** Admin Frontend bắt buộc cấu hình `withCredentials: true` trên tất cả các request gọi sang Gateway (`:8080`).
- **Cookie `admin_access_token`:** Do Backend Auth Service phát hành và quản lý tự động qua header `Set-Cookie` với cờ `httpOnly; Secure; SameSite`. Mã JavaScript của Frontend không được phép và không thể đọc cookie này.
- **Lưu ý Cross-Origin trong môi trường Dev (`localhost:3000` → `localhost:8080`):**
  - Gateway và Auth Service cần cấu hình CORS cho phép `allowedOrigins: ["http://localhost:3000"]`, bật `allowCredentials: true`.
  - Cookie cần thiết lập `SameSite=Lax` để trình duyệt gửi kèm cookie trong các truy vấn cross-origin cục bộ giữa 2 port khác nhau. → **TBD verify với Backend Team**.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
