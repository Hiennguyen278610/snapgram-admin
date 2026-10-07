# Environment Variables Reference (`.env.example`) — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này là đặc tả danh mục các biến môi trường tối thiểu cần thiết để vận hành **Snapgram Admin Portal**. Tài liệu gắn kết trực tiếp với [env-and-config.md](env-and-config.md).

> ⚠️ **LƯU Ý:** Đây là tài liệu markdown mô tả đặc tả. TUYỆT ĐỐI KHÔNG tạo tệp `.env.example` hoặc `.env` thật ra ngoài thư mục `docs/ui-plan/`.

---

## 2. Danh Mục Biến Môi Trường Tối Thiểu

```bash
# ==============================================================================
# SNAPGRAM ADMIN PORTAL — ENVIRONMENT CONFIGURATION
# ==============================================================================

# [Required] Địa chỉ gốc của API Gateway (Cửa ngõ kết nối tất cả Microservices)
NEXT_PUBLIC_API_URL=http://localhost:8080

# [Required] Alias định danh Gateway URL (dùng đồng bộ trong Axios/Ky client)
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080

# [Optional] Tên ứng dụng hiển thị trên thanh tiêu đề và Header Brand
NEXT_PUBLIC_APP_NAME="Snapgram Admin"

# [Required] Ngôn ngữ mặc định của ứng dụng (en = English, vi = Tiếng Việt)
NEXT_PUBLIC_DEFAULT_LOCALE=en

# [Optional] Cờ bật/tắt luồng kiểm tra xác thực hai yếu tố (2FA TOTP)
NEXT_PUBLIC_ENABLE_2FA=true
```

---

## 3. Chi Tiết Từng Biến Cấu Hình

| Tên Biến | Kiểu Truy Cập | Mục Đích Sử Dụng | Giá Trị Mẫu (Dev) | Giá Trị Mẫu (Prod) |
|---|---|---|---|---|
| **`NEXT_PUBLIC_API_URL`** | Public (Client & Server) | Đường dẫn gốc gọi tất cả REST APIs qua API Gateway | `http://localhost:8080` | `https://api.snapgram.com` (TBD) |
| **`NEXT_PUBLIC_GATEWAY_URL`** | Public (Client & Server) | Alias đồng bộ dùng trong cấu hình HTTP Client wrapper | `http://localhost:8080` | `https://api.snapgram.com` (TBD) |
| **`NEXT_PUBLIC_APP_NAME`** | Public (Client & Server) | Chuỗi tên hiển thị trên title trang và layout header | `Snapgram Admin` | `Snapgram Admin` |
| **`NEXT_PUBLIC_DEFAULT_LOCALE`**| Public (Client & Server) | Ngôn ngữ fallback khi URL không chỉ định locale | `en` | `en` |
| **`NEXT_PUBLIC_ENABLE_2FA`** | Public (Client & Server) | Bật/tắt bước nhập mã OTP 2FA trong form login | `true` | `true` |

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
