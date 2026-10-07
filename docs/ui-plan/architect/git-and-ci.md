# Git Workflow, Commit Standards & CI/CD Pipeline — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này xác lập quy chuẩn kỹ thuật độc lập (self-contained) về quản lý mã nguồn Git, chuẩn hóa thông điệp commit (Conventional Commits), kiểm duyệt chất lượng mã nguồn tự động qua git hooks, và quy trình CI/CD cho **Snapgram Admin Portal**. Tài liệu gắn kết mật thiết với:
- [overview.md](../overview.md): Mục tiêu và tech stack.
- [conventions.md](conventions.md): Quy ước code React/Next.js 15.
- [CONTRIBUTING.md](../CONTRIBUTING.md): Hướng dẫn cho thành viên phát triển dự án.

---

## 2. Chiến Lược Phân Nhánh (Branch Naming Strategy)
Tất cả các nhánh trong dự án phải tuân theo tiền tố định danh:

| Nhánh / Tiền Tố | Mục Đích | Ví Dụ |
|---|---|---|
| **`main`** | Nhánh mã nguồn Production ổn định, sẵn sàng deploy. | `main` |
| **`develop`** | Nhánh tích hợp tính năng (nếu sử dụng mô hình GitFlow). | `develop` |
| **`feat/<scope>-<desc>`** | Phát triển tính năng mới. | `feat/users-ban-dialog`, `feat/auth-login-page` |
| **`fix/<scope>-<desc>`** | Sửa lỗi tính năng hoặc logic. | `fix/auth-423-lockout`, `fix/reports-status-filter` |
| **`chore/<desc>`** | Nâng cấp dependencies, cấu hình dự án, tooling. | `chore/bump-next-15`, `chore/setup-commitlint` |
| **`docs/<desc>`** | Cập nhật tài liệu, README, UI plan. | `docs/update-i18n-specs` |
| **`refactor/<scope>-<desc>`** | Tái cấu trúc mã nguồn mà không đổi hành vi. | `refactor/api-client-wrapper` |

---

## 3. Quy Chuẩn Commit Message (Conventional Commits)
Toàn bộ commit phải tuân thủ định dạng:
```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 3.1. Các Thành Phần Chi Tiết
- **Types bắt buộc:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`.
- **Scope phổ biến:** `auth`, `users`, `reports`, `media`, `i18n`, `ui`, `api`, `config`.
- **Subject:** 
  - Bắt buộc dùng **tiếng Anh**, viết chữ thường (lowercase), động từ dạng mệnh lệnh (imperative, ví dụ: `add`, `fix`, `update`, `remove`).
  - Độ dài tối đa **≤ 72 ký tự**.
  - **TUYỆT ĐỐI KHÔNG có dấu chấm `.` ở cuối dòng**.
- **Body (Tùy chọn):** Giải thích *lý do (why)* thực hiện thay đổi, không lặp lại *cái gì (what)*.
- **Footer (Tùy chọn):** Khai báo thay đổi gây xung đột (`BREAKING CHANGE: <mô tả>`) hoặc đóng issue (`Closes #123`).

### 3.2. Ví Dụ Đối Chiếu
- **ĐÚNG:**
  - `feat(users): add ban user dialog`
  - `fix(auth): handle 423 locked response`
  - `chore(deps): bump next to 15.1`
  - `docs(i18n): specify message format rules`
- **SAI (Bị reject bởi commitlint):**
  - `update code` *(Thiếu type và scope)*
  - `Feat(users): Add dialog.` *(Viết hoa sai case, có dấu chấm cuối)*
  - `fixed bug in login` *(Không đúng chuẩn Conventional)*

---

## 4. Quy Tắc Pull Request (PR Rules)
1. **Tiêu đề PR:** Phải tuân theo chuẩn Conventional Commits (ví dụ: `feat(media): implement presigned upload component`).
2. **Kiểm tra tự động:** Bắt buộc **PASS 100%** pipeline CI trước khi được merge.
3. **Phê duyệt (Code Review):** Bắt buộc có ít nhất **1 approve** từ reviewer trước khi nhập code.
4. **Phương thức Merge:** **Squash and merge** vào nhánh `main` để duy trì git history sạch sẽ.

---

## 5. Kiểm Soát Cục Bộ (Pre-commit & Commit-msg Hooks)
Cấu hình kiểm tra tự động trước khi commit thông qua `husky`:
- **`pre-commit` hook (`husky` + `lint-staged`):**
  - Chạy `eslint --fix` trên toàn bộ các tệp `.ts`, `.tsx` trong vùng staged.
  - Chạy `prettier --write` định dạng code tự động.
- **`commit-msg` hook (`commitlint`):**
  - Kiểm tra tiêu đề commit khớp hoàn toàn với quy tắc Conventional Commits. Nếu sai cú pháp, lệnh commit sẽ bị hủy ngay lập tức.

---

## 6. Đường Ống CI Tự Động (GitHub Actions Pipeline)
- **Sự kiện kích hoạt (Triggers):** Mọi Pull Request nhắm vào nhánh `main`, và mọi sự kiện push trực tiếp vào `main`.
- **Thứ tự thực thi các bước (Pipeline Steps):**
  1. `pnpm install --frozen-lockfile` (Cài đặt dependencies chính xác theo `pnpm-lock.yaml`).
  2. `pnpm lint` (Kiểm tra lỗi tĩnh bằng ESLint).
  3. `pnpm typecheck` (Kiểm tra kiểu dữ liệu với `tsc --noEmit`).
  4. `pnpm test` (Chạy bộ unit tests với Vitest/Jest).
  5. `pnpm build` (Biên dịch thử nghiệm ứng dụng Next.js 15).
- **Môi trường CI:** Node.js version `22` (khớp với khai báo `"engines": { "node": ">=22" }`), kích hoạt cache pnpm store để tối ưu thời gian chạy.

---

## 7. Triển Khai Hệ Thống (Deployment)
- **Nền tảng triển khai:** TBD (Vercel / Docker Container / Kubernetes Cluster).
- **Cơ chế kích hoạt deploy:** TBD (Tự động kích hoạt khi merge PR vào `main` hoặc kích hoạt thủ công qua workflow release).
- *Lưu ý:* Mọi cấu hình Git Hooks và GitHub Actions CI/CD trên sẽ được thiết lập chính thức trong repository của Frontend khi tách repo.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
