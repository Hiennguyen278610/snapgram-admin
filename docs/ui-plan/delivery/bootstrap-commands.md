# Bootstrap CLI Commands & Setup Protocol — Snapgram Admin Portal

## 1. Context & Self-Contained Scope

Tài liệu này xác lập quy chuẩn kỹ thuật độc lập (self-contained) về toàn bộ câu lệnh CLI chính quy bắt buộc sử dụng khi khởi tạo và cài đặt cấu hình cho **Snapgram Admin Portal** (từ Sprint 1.1 đến Sprint 1.7 thuộc Phase 1). Tài liệu gắn kết trực tiếp với:

- [../absolute-rules.md](../absolute-rules.md): Rule 3 và Rule 4 (CLI-First, cấm tự viết file config).
- [../architect/conventions.md](../architect/conventions.md): Quy chuẩn môi trường Node 22, pnpm 10, Next.js 15.
- [definition-of-done.md](definition-of-done.md): Tiêu chuẩn nghiệm thu của Phase 1 Foundation.

> **RÀNG BUỘC TỐI THƯỢNG:** Tài liệu này là nguồn **DUY NHẤT** cho AI và lập trình viên khi bootstrap mã nguồn từ Sprint 1.1 đến Sprint 1.7. Nghiêm cấm tự ý sáng tạo câu lệnh hoặc viết tay các file cấu hình nền tảng.

---

## 2. Nguyên Tắc CLI-First Bất Biến

- **Mọi bước thiết lập PHẢI thực hiện thông qua công cụ dòng lệnh (CLI chính quy)** của framework và package manager tương ứng.
- **CẤM TUYỆT ĐỐI AI tự viết tay hoặc ghi đè các file nền tảng:**
  - `package.json` (phải do `create-next-app` và `pnpm add` sinh ra).
  - `tsconfig.json` (phải do `create-next-app` sinh ra).
  - `next.config.*` (phải do `create-next-app` sinh ra).
  - `tailwind.config.*` / `postcss.config.*` (phải do `create-next-app` sinh ra).
  - `pnpm-lock.yaml` (phải do `pnpm` tự giải quyết dependencies và ghi ra).
  - `.eslintrc*` / `eslint.config.*` / `.prettierrc*`.
- **Quy tắc thực thi:** Sau mỗi lệnh CLI chạy thành công, **bắt buộc phải chạy lệnh kiểm tra (Verify step)** để xác nhận tính toàn vẹn của tệp tin trước khi chuyển sang bước kế tiếp.

---

## 3. Bảng Lệnh Bootstrap Chi Tiết Theo Sprint (Phase 1)

### 3.1. Sprint 1.1 — Khởi Tạo Repository & Framework (Next.js 15, pnpm 10, Node 22)

Khởi tạo cấu trúc project Next.js 15 chuẩn bằng lệnh CLI chính thức:

```bash
# Bước 1: Khởi tạo project Next.js 15 với pnpm 10, Node 22 (không dùng Turbopack dev flags gây bất ổn)
pnpm dlx create-next-app@15 admin-client \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --no-turbopack

# Di chuyển vào thư mục dự án vừa tạo
cd admin-client

# Bước 2: Ghim chặt phiên bản Node & Package Manager trong package.json
# (Chỉ cập nhật 2 trường engines và packageManager, KHÔNG thay đổi dependencies)
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.packageManager = "pnpm@10.5.2";
pkg.engines = { "node": ">=22.0.0" };
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("Pinned Node >=22.0.0 and pnpm@10.x in package.json");
'
```

#### Verification Checklist (Sprint 1.1):

- [ ] Tệp `package.json` tồn tại, chứa `"next": "^15.x"`, `"react": "^19.x"`, `"typescript"`.
- [ ] Khóa `"packageManager": "pnpm@10.x"` và `"engines": { "node": ">=22.0.0" }` đã được ghim.
- [ ] Tệp `pnpm-lock.yaml` đã được sinh ra.
- [ ] Thư mục `src/app/` có chứa `layout.tsx` và `page.tsx`.
- [ ] Tệp `tsconfig.json` có `"strict": true`.

---

### 3.2. Sprint 1.2 — Tailwind CSS + shadcn/ui + Theme & Icons (shadcn CLI v4)

Khởi tạo hệ thống giao diện shadcn/ui và cài đặt toàn bộ component nguyên thủy cần thiết:

```bash
# Bước 1: Khởi tạo cấu hình shadcn/ui
pnpm dlx shadcn@latest init --preset nova --base radix --css-variables

# BẢNG TRẢ LỜI CÁC CÂU HỎI INTERACTIVE CLI:
# - Which preset would you like to use? → nova
# - Which base library would you like to use? → radix
# - Do you want to use CSS variables for colors? → yes

# Bước 2: Kéo toàn bộ components nguyên thủy cần dùng cho toàn dự án
# (shadcn v4 đã bỏ component `form` — xem ghi chú bên dưới)
pnpm dlx shadcn@latest add \
  button card input label field separator \
  dialog alert-dialog sheet dropdown-menu \
  table badge tabs progress scroll-area \
  sonner avatar command pagination \
  textarea input-group

# Bước 3: Override Font (bắt buộc — CLI v4 auto-push font Geist, không khớp design system)
#   - Tạo src/lib/fonts.ts: next/font cho Playfair Display + Roboto + Roboto Mono,
#     subsets ['latin', 'vietnamese'].
#   - Sửa src/app/layout.tsx: xoá import font Geist, dùng fonts từ src/lib/fonts.ts.
```

> **GHI CHÚ (shadcn CLI v4):**
> - Component `form` (wrapper react-hook-form của shadcn) KHÔNG còn tồn tại trong registry v4. Thay bằng `field` + `label` + `separator` cho form layout, `input-group` + `textarea` cho nhóm input; tích hợp `react-hook-form` qua `Controller`.
> - Thư viện `next-themes` được lệnh `add` tự động cài (dependency của `sonner`) → KHÔNG chạy `pnpm add next-themes` riêng.

#### Verification Checklist (Sprint 1.2):

- [ ] Các tệp `src/components/ui/*.tsx` đã được tạo đầy đủ theo danh sách kéo về.
- [ ] Tệp `src/app/globals.css` đã chứa toàn bộ biến CSS variables (`--background`, `--foreground`,...).
- [ ] Tệp `components.json` của shadcn đã xuất hiện ở thư mục gốc.
- [ ] `package.json` (dependencies) đã chứa `"next-themes"` và `"lucide-react"`.

---

### 3.3. Sprint 1.3 — Đa Ngôn Ngữ (Internationalization - i18n)

Cài đặt thư viện bản địa hóa hỗ trợ Server Components:

```bash
pnpm add next-intl
```

#### Verification Checklist (Sprint 1.3):

- [ ] `package.json` xuất hiện dependency `"next-intl"`.
- [ ] Thư mục `messages/` (sẽ được tạo khi lập trình viên bắt đầu thêm key dịch `en.json` và `vi.json`).

---

### 3.4. Sprint 1.4 — TanStack Query & HTTP Client

Cài đặt thư viện quản lý server-state, HTTP client và schema validation:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools axios zod
pnpm add -D @types/node
```

#### Verification Checklist (Sprint 1.4):

- [ ] `package.json` chứa `@tanstack/react-query`, `@tanstack/react-query-devtools`, `axios`, `zod`.

---

### 3.5. Sprint 1.5 — Quản Lý State Giao Diện & Layout Shell

Cài đặt thư viện client-state cho Sidebar, Modals và Theme:

```bash
pnpm add zustand
```

#### Verification Checklist (Sprint 1.5):

- [ ] `package.json` chứa dependency `"zustand"`.

---

### 3.6. Sprint 1.6 — Testing Framework (Unit, Integration & E2E)

Cài đặt bộ công cụ kiểm thử toàn diện theo [testing.md](../architect/testing.md):

```bash
pnpm add -D vitest @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom \
  msw \
  @playwright/test \
  @axe-core/playwright
```

#### Verification Checklist (Sprint 1.6):

- [ ] `package.json` trong `devDependencies` chứa đủ `vitest`, `msw`, `@playwright/test`, `@axe-core/playwright`.

---

### 3.7. Sprint 1.7 — Git Hooks & CI Quality Gate

Thiết lập bộ chặn kiểm tra mã nguồn tự động trước khi commit:

```bash
# Bước 1: Cài đặt công cụ hook và linter
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# Bước 2: Khởi tạo môi trường Husky
pnpm dlx husky init

# Bước 3: Cấu hình hook pre-commit và commit-msg
echo "pnpm lint-staged" > .husky/pre-commit
echo "pnpm dlx commitlint --edit \$1" > .husky/commit-msg
```

#### Verification Checklist (Sprint 1.7):

- [ ] Thư mục `.husky/` tồn tại chứa 2 tệp thực thi `pre-commit` và `commit-msg`.
- [ ] Lệnh `git commit` thử nghiệm sai format Conventional Commits bị từ chối thành công.

---

## 4. Bảng Chống Mẫu (Anti-Patterns — Những Điều CẤM Tuyệt Đối)

| Hành Vi CẤM Tuyệt Đối                             | Giải Pháp Thay Thế Bắt Buộc                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Tự viết tay file `package.json`**          | Chạy`pnpm dlx create-next-app@15 admin-client ...`                  |
| **Tự viết tay file `tsconfig.json`**         | Để lệnh`create-next-app` tự động phát sinh                    |
| **Tự viết tay file `tailwind.config.*`**     | Để`create-next-app` sinh ra, chỉ mở rộng config tokens khi cần |
| **Tự viết tay file `next.config.*`**         | Để`create-next-app` sinh ra, chỉ thêm cấu hình hostname MinIO  |
| **Tự gõ code tạo component của shadcn/ui**   | Luôn chạy`pnpm dlx shadcn@latest add <component>`                  |
| **Tự copy/paste file từ trang web shadcn**     | Luôn chạy lệnh CLI chính thức của shadcn                         |
| **Tự mở `package.json` gõ tên dependency** | Luôn chạy lệnh`pnpm add <pkg>` hoặc `pnpm add -D <pkg>`        |
| **Tự tay sửa hoặc tạo `pnpm-lock.yaml`**   | Để pnpm tự động giải quyết cây phụ thuộc và sinh lockfile   |

---

## 5. Danh Sách Kiểm Tra Tổng Thể Sau Khi Hoàn Thành Bootstrap (Phase 1 Gate)

- [ ] Chạy `pnpm list next react typescript` hiển thị đúng phiên bản Next 15, React 19, TS 5+.
- [ ] Chạy `cat package.json | grep packageManager` hiển thị chuẩn `"packageManager": "pnpm@10.x"`.
- [ ] Chạy `cat package.json | grep engines` hiển thị đúng `"node": ">=22.0.0"`.
- [ ] Chạy lệnh `pnpm build` biên dịch thành công (0 errors, 0 warnings).
- [ ] Kiểm tra `ls src/components/ui/` hiển thị đầy đủ 21 files (không còn `form.tsx`)

---

## 6. Ràng Buộc Xử Lý Khi Gặp Sự Cố CLI

1. Nếu lệnh CLI có câu hỏi tương tác (Interactive Prompt): **Bắt buộc đối chiếu đúng câu trả lời quy định tại mục 3**.
2. Nếu phiên bản CLI không hỗ trợ cờ lệnh (Flag): **DỪNG LẠI NGAY LẬP TỨC**, báo cáo người dùng, **KHÔNG ĐƯỢC TỰ BỊA ĐẶT CỜ MỚI**.
3. Nếu không chắc chắn cú pháp: Chạy kiểm tra bằng lệnh trợ giúp `pnpm dlx <tool> --help` trước khi thực thi.

> ⚠️ Tài liệu này là nguồn DUY NHẤT cho AI khi bootstrap Sprint 1.1 → 1.7.
> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
