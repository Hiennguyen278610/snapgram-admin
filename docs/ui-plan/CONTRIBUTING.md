# Contributing Guidelines — Snapgram Admin Portal

Chào mừng bạn tham gia phát triển **Snapgram Admin Portal**. Tài liệu này hướng dẫn các bước thiết lập môi trường, quy trình làm việc, chuẩn mực viết mã và quy tắc bắt buộc tuân thủ trước khi đóng góp mã nguồn.

> ⚠️ Tài liệu này tạm nằm trong backend repo và sẽ được chuyển sang vị trí thư mục gốc (`root`) của Frontend repo khi chính thức tách dự án.

---

## 1. Yêu Cầu Môi Trường Cốt Lõi
Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt các công cụ quy chuẩn:
- **Node.js:** Phiên bản `>= 22.0.0` (LTS/Current).
- **Package Manager:** **pnpm v10+** (Nghiêm cấm tuyệt đối sử dụng `npm` hoặc `yarn`).

---

## 2. Các Lệnh Thao Tác Thường Dùng
```bash
# 1. Cài đặt các gói phụ thuộc (dependencies)
pnpm install

# 2. Khởi chạy môi trường phát triển cục bộ (Local Dev Server tại http://localhost:3000)
pnpm dev

# 3. Chạy kiểm tra tĩnh toàn diện (Linting)
pnpm lint

# 4. Chạy kiểm tra kiểu dữ liệu TypeScript
pnpm typecheck

# 5. Chạy bộ kiểm thử tự động (Unit Tests)
pnpm test

# 6. Biên dịch ứng dụng sản xuất (Production Build)
pnpm build
```

---

## 3. Quy Trình Nhánh & Commit (Branch & Commit Workflow)
- **Quy chuẩn nhánh:** Đặt tên nhánh theo tiền tố `feat/`, `fix/`, `chore/`, `docs/`, `refactor/` (Xem chi tiết tại [architect/git-and-ci.md](architect/git-and-ci.md)).
- **Quy chuẩn thông điệp Commit:** Bắt buộc tuân theo **Conventional Commits**:
  - Cú pháp: `<type>(<scope>): <subject>` (ví dụ: `feat(users): add ban user dialog`).
  - Dùng tiếng Anh, chữ thường, không có dấu chấm ở cuối dòng, độ dài ≤ 72 ký tự.
  - Commit hook (`commitlint` + `husky`) sẽ tự động từ chối nếu commit sai định dạng.

---

## 4. Quy Chuẩn Kéo Component UI (shadcn/ui)
Tuyệt đối không tự tạo hoặc sao chép mã nguồn các thành phần UI cơ bản. Bắt buộc kéo từ thư viện **shadcn/ui** qua lệnh CLI chính quy:
```bash
pnpm dlx shadcn@latest add <component-name>
# Ví dụ: pnpm dlx shadcn@latest add button dialog table dropdown-menu
```

---

## 5. Quy Chuẩn Đa Ngôn Ngữ (i18n Keys)
- Mọi chuỗi văn bản tĩnh (static text) trên giao diện bắt buộc phải có key trong `messages/en.json` và `messages/vi.json`.
- Cú pháp key: `<domain>.<section>.<element>` theo kiểu `lowerCamelCase` (ví dụ: `users.table.column.email`).
- Chi tiết xem tại [architect/i18n.md](architect/i18n.md).

---

## 6. Quy Tắc Xác Thực & Bảo Mật Bắt Buộc (Auth Note)
- Admin Portal sử dụng cơ chế **Cookie-based Authentication** (`admin_access_token` với cờ `httpOnly; Secure; SameSite`).
- **TUYỆT ĐỐI KHÔNG LƯU TOKEN** vào `localStorage`, `sessionStorage` hay bất kỳ bộ nhớ nào phía client.
- Mọi request gọi tới Backend API qua Gateway (`:8080`) bắt buộc cấu hình `withCredentials: true`.
- Chi tiết xem tại [architect/auth-and-security-flow.md](architect/auth-and-security-flow.md).

---

## 7. Các Điều CẤM Tuyệt Đối (Tham Chiếu Absolute Rules)
Theo quy định tại [absolute-rules.md](absolute-rules.md):
1. **CẤM Emoji Icon:** Không sử dụng emoji trong toàn bộ static text, tiêu đề trang, nhãn nút (100% dùng vector icon từ Lucide React).
2. **CẤM Nền Gradient:** Không dùng gradient làm background cho Card, Table, Modal, Sheet, Badge (chỉ có đúng 2 ngoại lệ: Nút Primary Action và Viền active ring).
3. **CẤM Tự Chế Component:** Không tự ý viết mới các component nguyên thủy đã có trong shadcn/ui.
4. **CẤM Viết Tay Config (CLI-First):** Mọi bước setup/cài đặt dùng CLI chính quy; nghiêm cấm tự viết `package.json`, `tsconfig.json`, `next.config.*`, `tailwind.config.*`, `pnpm-lock.yaml`...
5. **CẤM Hardcode Màu:** Mọi màu dùng semantic token (`bg-background`, `text-foreground`,...); theme dùng `next-themes` với đủ 3 mode Light/Dark/System.

---

## 8. Danh Sách Kiểm Tra Pull Request (PR Checklist)
Trước khi tạo hoặc yêu cầu review PR, vui lòng đảm bảo:
- [ ] Tiêu đề PR đúng định dạng Conventional Commits.
- [ ] Đã chạy `pnpm lint` và `pnpm typecheck` không có lỗi.
- [ ] Đã thêm đầy đủ translation key cho các chuỗi văn bản mới trong `messages/en.json` và `messages/vi.json`.
- [ ] Không có chuỗi văn bản nào bị hardcode trực tiếp trong component.
- [ ] Không vi phạm bất kỳ điều luật nào trong [absolute-rules.md](absolute-rules.md).
- [ ] Mọi API call đều được gọi qua Gateway (`:8080`) và cấu hình `withCredentials: true`.

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
