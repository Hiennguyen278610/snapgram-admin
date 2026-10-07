# Testing Strategy & Quality Assurance — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này xác lập quy chuẩn kỹ thuật độc lập (self-contained) về chiến lược kiểm thử tự động, công cụ kiểm thử, tiêu chí độ bao phủ (coverage), và quy tắc kiểm thử cho **Snapgram Admin Portal**. Tài liệu gắn kết trực tiếp với:
- [conventions.md](conventions.md): Quy ước đặt tên file và coding standards.
- [error-handling.md](error-handling.md): Lớp Adapter và xử lý lỗi cần test.
- [error-contract.md](error-contract.md): Định dạng lỗi hai tầng (Service & Gateway) để mock.
- [../delivery/definition-of-done.md](../delivery/definition-of-done.md): Tiêu chuẩn nghiệm thu của từng component, hook và page.

---

## 2. Test Stack Lựa Chọn (Công Nghệ Kiểm Thử Hiện Đại)
- **Unit & Component Testing:** **Vitest** + **React Testing Library (@testing-library/react)** + **@testing-library/user-event**.
- **Môi Trường DOM Giả Lập:** **jsdom**.
- **Mocking Tầng Mạng (API Mocking):** **MSW (Mock Service Worker v2)** — Chặn request ở network level, không mock module bừa bãi.
- **End-to-End (E2E) Testing:** **Playwright**.
- **Đo Lường Độ Bao Phủ Code (Code Coverage):** **@vitest/coverage-v8**.
- **RÀNG BUỘC:** **TUYỆT ĐỐI KHÔNG DÙNG Jest** (tránh xung đột cấu hình với Next.js 15, ESM và tốc độ build chậm).

---

## 3. Mục Tiêu Độ Bao Phủ (Coverage Targets)
- **Thư viện tiện ích & logic lõi (`src/lib/**`):** Tối thiểu **70% lines**, **70% branches** (riêng các helper format date/number/currency, parse lỗi: bắt buộc 100% branch).
- **Hooks & Business Logic (`src/features/**`, `src/hooks/**`):** Tối thiểu **70% lines**, **70% branches**.
- **Components Nguyên Thủy shadcn/ui (`src/components/ui/**`):** **KHÔNG ép coverage** (đây là thư viện third-party đã qua kiểm thử từ upstream).
- **Trang ứng dụng Next.js Route (`src/app/**`):** **KHÔNG ép unit test** — toàn bộ luồng trang được bao phủ qua E2E Playwright.
- **Baseline toàn bộ dự án:** **TBD** (Sẽ chốt sau khi hoàn tất Sprint 1.6).

---

## 4. Quy Ước Đặt Tên & Tổ Chức File Test (File Conventions)
- **Unit & Integration Tests:** Đặt cạnh file mã nguồn (Co-located pattern):
  ```
  src/features/users/components/
  ├── UserTable.tsx
  └── UserTable.test.tsx
  src/lib/api/
  ├── error-parser.ts
  └── error-parser.test.ts
  ```
- **E2E Tests:** Nằm riêng tại thư mục `e2e/` ở thư mục gốc của repository Frontend:
  ```
  e2e/
  ├── auth/
  │   ├── login-happy.spec.ts
  │   └── login-lockout.spec.ts
  ├── users/
  │   └── ban-user.spec.ts
  ├── reports/
  │   └── resolve-report.spec.ts
  └── rbac/
      └── role-guard.spec.ts
  ```
- **MSW Handlers:** Đặt tập trung trong `src/mocks/`:
  ```
  src/mocks/
  ├── server.ts                  # Dùng cho Vitest (Node environment)
  ├── browser.ts                 # Dùng cho Local Dev (Service Worker)
  └── handlers/
      ├── auth.handlers.ts
      ├── users.handlers.ts
      ├── reports.handlers.ts
      └── media.handlers.ts
  ```

---

## 5. Danh Mục Bắt Buộc Kiểm Thử (What Must Be Tested)
1. **Tiện ích tính toán & định dạng (`src/lib/**`):**
   - Helper format ngày tháng, số tiền, định dạng bytes media: 100% test case boundary.
   - `error-parser.ts`: Test đầy đủ phản hồi Shape A (microservices) và Shape B (Gateway).
2. **Custom Hooks nghiệp vụ:**
   - `useAdminAuth`, `useBanUser`, `useReportQueue`, `useMediaUpload`: Test trạng thái `isLoading`, `isSuccess`, `isError`, mutate và invalidate cache.
3. **Tầng Service (API Client Layer):**
   - Mỗi hàm gọi API phải có test case: Thành công (200/201), Hết hạn phiên (401), Không có quyền (403), Quá tải/Rate limit (429), Sập server (500).
4. **Biểu mẫu & Validation (Forms):**
   - Kiểm tra Zod schema validation (nhập thiếu, sai format email, mật khẩu ngắn).
   - Kiểm tra hàm `onSubmit` và trạng thái vô hiệu hóa nút bấm khi submit.
5. **Component Nghiệp Vụ Chứa Logic:**
   - Component có điều kiện hiển thị phân quyền, popup xác nhận hủy diệt, phân trang, lọc bảng.
6. **E2E Critical Path Scenarios (Đường dẫn trọng yếu):**
   - **Đăng nhập:** Đăng nhập thành công vào Dashboard; Đăng nhập sai 3 lần hiển thị khóa tài khoản.
   - **Quản trị User:** Tìm kiếm user, mở Modal Ban, nhập lý do, xác nhận và cập nhật badge BANNED.
   - **Kiểm duyệt Report:** Duyệt (Resolve) bài viết vi phạm, Bác bỏ (Dismiss) tố cáo.
   - **Upload Media:** Upload presigned flow 3 bước thành công.
   - **RBAC Guard:** Tài khoản role `MODERATOR` cố tình truy cập URL `/admin/users` bị chặn hoặc chuyển về ForbiddenState.

---

## 6. Chiến Lược Giả Lập Mạng Bằng MSW (MSW Strategy)
- Chặn ở tầng giao thức HTTP (`http.get`, `http.post`), không mock module React hay Axios instance.
- **Mô phỏng cả 2 loại Error Shape** theo [error-contract.md](error-contract.md):
  - Giả lập lỗi downstream microservices trả về đầy đủ `{ status, error, message, timestamp }`.
  - Giả lập lỗi Gateway từ chối trả về `{ error: 'Rate limit exceeded' }` kèm header `X-Rate-Limit-Reset`.

---

## 7. Chiến Lược Kiểm Thử Đầu Cuối Playwright (Playwright Strategy)
- **Base URL:** `http://localhost:3000`.
- **Trình duyệt mục tiêu:** Ban đầu chạy kiểm thử trên **Chromium** (`--project=chromium`). Hỗ trợ Firefox/WebKit là **TBD**.
- **Cơ chế xác thực E2E (Authentication in E2E):** Sử dụng tính năng `storageState` của Playwright để lưu trạng thái cookie `admin_access_token` hợp lệ sau lần login đầu tiên, giúp các test case sau không phải đăng nhập lại.
- **Kiểm thử hồi quy giao diện (Visual Regression Testing):** **TBD** (Chưa áp dụng ở sprint đầu để tránh tốn tài nguyên bảo trì).

---

## 8. Tích Hợp Vào CI Pipeline (CI Integration)
- Lệnh `pnpm test`: Kích hoạt Vitest chạy tự động kèm đo lường coverage trên runner GitHub Actions.
- Lệnh `pnpm test:e2e`: Kích hoạt Playwright E2E cho các PR chuẩn bị merge vào `main`.
- **Cơ chế chặn:** Pipeline lập tức báo FAIL nếu độ bao phủ code tụt dưới ngưỡng 70%.
- **Tích hợp báo cáo Codecov / SonarCloud:** **TBD**.

---

## 9. Những Thành Phần Tuyệt Đối KHÔNG Cần Test (What NOT To Test)
- Các component nguyên thủy của **shadcn/ui** (`button.tsx`, `dialog.tsx`, `input.tsx`).
- Thuộc tính giao diện thuần túy (class Tailwind CSS, màu sắc, padding).
- Hiệu ứng chuyển động (Framer Motion / CSS animations).
- Hành vi nội bộ của thư viện bên thứ ba (hành vi nội bộ của React Query hoặc React Hook Form).

---

## 10. Kế Hoạch Triển Khai Theo Phân Kỳ (Sprint Assignment)
- **Phase 1 — Foundation (Sprint 1.6):** Cài đặt và cấu hình Vitest, React Testing Library, MSW v2, Playwright, viết 1 test mẫu hoàn chỉnh cho `error-parser`.
- **Phase 2 — Business Components (Sprint 2.1 → 2.6):** Viết unit & integration tests song hành cho từng hook, service và component nghiệp vụ theo chuẩn DoD.
- **Phase 3 — Pages & Hardening (Sprint 3.2):** Viết trọn bộ E2E critical paths, rà soát coverage gate và kiểm tra a11y tự động.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
