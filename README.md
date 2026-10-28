# Snapgram Admin Portal

Cổng thông tin quản trị nội bộ dành cho hệ thống mạng xã hội Snapgram.

## 1. Giới thiệu

Snapgram Admin Portal là ứng dụng web xây dựng trên nền tảng **Next.js 15 (App Router)** và **React 19**, phục vụ cho quản trị viên vận hành hệ thống:

- **Tổng quan (Dashboard):** Thống kê số lượng người dùng, tăng trưởng, bảo mật theo thời gian thực.
- **Quản lý người dùng (Users):** Tìm kiếm, phân trang server-side, khóa (ban)/mở khóa (unban) tài khoản kèm lý do, gán/gỡ vai trò.
- **Phân quyền động (RBAC):** Quản lý vai trò (Roles) và ma trận phân quyền (Permissions).
- **Kiểm duyệt nội dung (Moderation):** Hàng đợi báo cáo vi phạm (Reports), duyệt/bác bỏ báo cáo và tự động xử lý nội dung.
- **Quản lý media (Media):** Quản lý thư viện hình ảnh/video tải lên MinIO S3, quy trình upload trực tiếp và presigned.
- **Sức khỏe hệ thống (System Health):** Theo dõi trạng thái hoạt động (Actuator health) của 9 microservices nội bộ.

---

## 2. Bảng Cổng (Port Mapping) Hạ Tầng Microservices

Hệ thống giao tiếp qua cổng trung tâm duy nhất là **API Gateway** (`:8080`), các cổng dịch vụ nội bộ được proxy server-side:

| Dịch vụ                  |  Cổng  | Giao thức / Mục đích                                       | Database          |
| ------------------------ | :----: | ---------------------------------------------------------- | ----------------- |
| **api-gateway**          | `8080` | Điểm truy cập duy nhất từ Client, xác thực JWT, định tuyến | Không có          |
| **auth-service**         | `8081` | Đăng nhập, phiên làm việc, người dùng, RBAC, 2FA           | `auth_db`         |
| **chatbot-service**      | `8082` | AI Chatbot                                                 | `bot_db`          |
| **chat-service**         | `8083` | Nhắn tin trực tiếp / WebSocket chat                        | `chat_db`         |
| **content-service**      | `8084` | Bài viết, story, bình luận, follow, báo cáo vi phạm        | `content_db`      |
| **media-service**        | `8085` | Upload, xử lý ảnh/video, tích hợp MinIO S3                 | `media_db`        |
| **notification-service** | `8086` | Thông báo thời gian thực / WebSocket                       | `notification_db` |
| **payment-service**      | `8087` | Thanh toán (VNPay, MoMo)                                   | `payment_db`      |
| **recommender-service**  | `8090` | Đề xuất nội dung (CQRS Read model)                         | `recommender_db`  |
| **Kafka UI**             | `8089` | Bảng điều khiển quản lý Kafka message queues               | —                 |
| **MinIO Console**        | `9001` | Quản lý lưu trữ tệp tin S3 (API port `9000`)               | —                 |
| **Mailpit**              | `8025` | Web inbox kiểm tra email phát triển                        | —                 |

---

## 3. Yêu Cầu Môi Trường & Cài Đặt

### Yêu cầu tiên quyết

- **Node.js:** `>= 22.0.0`
- **pnpm:** `v10+` (`pnpm@10.5.2` khuyến nghị)
- **Backend:** Các container của Snapgram Server đang chạy (`docker compose up -d`).

### Cài đặt dependencies

```bash
pnpm install
```

### Cấu hình biến môi trường

Tạo tệp `.env.local` từ mẫu:

```bash
cp .env.example .env.local
```

Xem mô tả chi tiết từng biến môi trường trong tệp `.env.example`.

---

## 4. Lệnh Khởi Chạy & Kiểm Thử

| Lệnh                 | Mô tả                                                         |
| -------------------- | ------------------------------------------------------------- |
| `pnpm dev`           | Khởi chạy máy chủ phát triển cục bộ (`http://localhost:3000`) |
| `pnpm build`         | Biên dịch bản production                                      |
| `pnpm start`         | Chạy ứng dụng sau khi đã build                                |
| `pnpm typecheck`     | Kiểm tra lỗi kiểu TypeScript (`tsc --noEmit`)                 |
| `pnpm lint`          | Kiểm tra cú pháp và quy chuẩn mã với ESLint                   |
| `pnpm format`        | Tự động định dạng mã với Prettier                             |
| `pnpm format:check`  | Kiểm tra định dạng mã với Prettier                            |
| `pnpm test`          | Chạy bộ kiểm thử đơn vị với Vitest                            |
| `pnpm test:watch`    | Chạy Vitest ở chế độ theo dõi thay đổi                        |
| `pnpm test:coverage` | Đo lường độ bao phủ kiểm thử (Test coverage)                  |
| `pnpm test:e2e`      | Chạy kiểm thử đầu-cuối (E2E) với Playwright                   |

---

## 5. Quy Chuẩn Kỹ Thuật & Tài Liệu Thiết Kế

- **Absolute UI Rules:** Xem `docs/ui-plan/absolute-rules.md` (Cấm emoji trong static text, cấm gradient màu mè, cài đặt shadcn qua CLI chính quy).
- **Thiết kế & Bảng màu:** Xem `docs/ui-plan/design/design-system.md`.
- **Kiến trúc phân hệ:** Xem `docs/ui-plan/architect/frontend-architecture.md`.
- **Sprint Plan & DoD:** Xem `docs/ui-plan/delivery/sprint-plan.md` và `definition-of-done.md`.
