# UI Implementation Plan — Snapgram Admin Portal

## 1. Context & Self-Contained Scope

```
docs/ui-plan/
├── absolute-rules.md                   # 5 Điều luật bất biến: Cấm emoji, hạn chế gradient, chuẩn CLI shadcn, CLI-First bootstrap, theme mode
├── overview.md                         # Master overview & Kiến trúc tổng thể (File này)
├── CONTRIBUTING.md                     # Hướng dẫn đóng góp mã nguồn cho lập trình viên
├── api-docs/                           # Tài liệu chi tiết các API endpoints đã có
│   ├── auth-apidocs.md                 # API xác thực, phân quyền, quản lý user và admin dashboard
│   ├── content-apidocs.md              # API quản trị bài viết, bình luận và hàng đợi tố cáo (reports)
│   └── media-apidocs.md                # API tải lên, quản lý file media và presigned URLs
├── design/                             # Phân hệ thiết kế giao diện
│   ├── design-system.md                # Quy chuẩn Design Tokens, màu sắc, font chữ trích xuất chuẩn mực
│   ├── theme-mode.md                   # Hệ thống Theme Mode (Light/Dark/System) & Anti-FOUC (next-themes)
│   ├── layout-system.md                # Cấu trúc khung nhìn Shell Container (1440px), Grid và Zones
│   ├── component-inventory.md          # Danh mục component giao diện và ràng buộc mapping từ API
│   ├── layouts-and-navigation.md       # Sơ đồ thanh điều hướng Sidebar, Topbar và Command Palette
│   └── a11y.md                         # Quy chuẩn Accessibility (WCAG AA, focus ring, ARIA, axe testing)
├── architect/                          # Phân hệ kiến trúc kỹ thuật frontend
│   ├── skills.md                       # Danh mục Agent Skills được phê duyệt (PASS 3 Security Audits)
│   ├── frontend-architecture.md        # Cấu trúc mã nguồn Next.js 15, Zustand, React Query
│   ├── conventions.md                  # Quy ước coding chuẩn: RSC, TanStack Query keys, Form validation
│   ├── auth-and-security-flow.md       # Luồng xác thực bảo mật, 2FA, Route Guards chặn trước login
│   ├── api-integration-map.md          # Bảng đối chiếu chi tiết giữa API Backend và UI Components
│   ├── route-map.md                    # Bản đồ route App Router ↔ màn hình ↔ API
│   ├── i18n.md                         # Quy chuẩn đa ngôn ngữ next-intl (en/vi) và định dạng số/ngày
│   ├── testing.md                      # Chiến lược test: Vitest + RTL + MSW + Playwright + axe
│   ├── env-and-config.md               # Kiến trúc biến môi trường và quản lý secrets (dev/prod)
│   ├── env.example.md                  # Tài liệu mẫu khai báo các biến môi trường FE
│   ├── git-and-ci.md                   # Chiến lược phân nhánh, Conventional Commits và CI pipeline
│   ├── error-contract.md               # Bản đặc tả hiện trạng Error Response Shapes từ Backend
│   └── error-handling.md               # Chiến lược Adapter Layer và xử lý lỗi tại Frontend
├── delivery/                           # Phân hệ bàn giao & quy trình
│   ├── bootstrap-commands.md           # Lệnh CLI chính quy khởi tạo dự án (Sprint 1.1 → 1.7)
│   ├── sprint-plan.md                  # Lộ trình 17 sprint (Phase 1 → Phase 3)
│   └── definition-of-done.md           # Tiêu chuẩn nghiệm thu Definition of Done
└── backend-issues/                     # Theo dõi các bất cập backend cần fix cho FE
    ├── README.md                       # Danh mục tổng hợp và chỉ số ưu tiên P0-P2
    ├── BI-001-missing-error-code-enum.md
    ├── BI-002-423-locked-not-implemented.md
    ├── BI-003-gateway-shape-inconsistent.md
    └── BI-004-response-headers-inconsistent.md
```

---

## 2. Mục Tiêu Dự Án & Phạm Vi Hệ Thống

Admin Portal là một ứng dụng quản trị độc lập, chuyên trách vận hành và giám sát hệ sinh thái mạng xã hội Snapgram, bao gồm các năng lực cốt lõi:

1. **Quản trị người dùng & RBAC:** Khóa/mở khóa tài khoản, cấp phát vai trò (`ADMIN`, `USER`), kiểm tra lịch sử audit log và phiên đăng nhập.
2. **Kiểm duyệt nội dung (Content Moderation):** Tiếp nhận và xử lý hàng đợi tố cáo bài viết, bình luận vi phạm bản quyền hoặc tiêu chuẩn cộng đồng.
3. **Giám sát tệp tin đa phương tiện (Media Management):** Quản lý presigned URLs tải lên MinIO S3, theo dõi dung lượng và kiểm tra file vi phạm.
4. **Bảo mật cửa ngõ tối đa:** Chặn truy cập tuyệt đối trước khi đăng nhập bằng Next.js 15 Middleware (`@login`), chống brute-force (tối đa 3 lần thất bại) và hỗ trợ xác thực hai yếu tố (2FA TOTP).

---

## 3. Tech Stack Quy Chuẩn (Next 15 + pnpm v10 + Node 22+)

Toàn bộ dự án tuân thủ nghiêm ngặt hệ thống công nghệ hiện đại nhất:

- **Runtime Environment:** `Node.js >= 22.0.0` (LTS/Current).
- **Package Manager:** `pnpm v10+` (Nghiêm cấm dùng `npm` hoặc `yarn`).
- **Framework:** **Next.js 15 (App Router)** với TypeScript ở chế độ Strict Mode.
- **Styling & UI Kit:** Tailwind CSS + **shadcn/ui** (Cài đặt component 100% qua lệnh `pnpm dlx shadcn@latest add ...`).
- **Typography:** Playfair Display (display) + Roboto (body) + Roboto Mono (code), Google Fonts, subsets latin+vietnamese.
- **Server State & Data Fetching:** **TanStack Query v5** (`@tanstack/react-query`).
- **Client State:** Zustand (quản lý modal, drawer, filter state).
- **Form & Validation:** `react-hook-form` kết hợp `zod`.
- **Icons:** Lucide React (`lucide-react`) — Tuyệt đối KHÔNG dùng emoji icon trên UI.
- **i18n:** next-intl (locales: en default, vi optional, route /[locale]/admin/...).
- **Repo hygiene:** Conventional Commits + Husky + lint-staged + commitlint.

---

## 4. Ràng Buộc Bất Biến & Skills Hỗ Trợ

- **Ràng buộc bất biến:** Bắt buộc tuân thủ 5 điều luật trong [absolute-rules.md](absolute-rules.md) (Cấm emoji icon, cấm lạm dụng gradient ngoài 2 vị trí được chỉ định, cài đặt shadcn qua CLI chính quy, CLI-First bootstrap cấm viết tay config, theme mode không hardcode màu — dùng `next-themes`).
- **Security-Audited Skills:** Mọi giải pháp code và kiến trúc đều tham chiếu từ 4 skill đã đạt trạng thái **PASS** trên cả 3 tiêu chuẩn bảo mật (*Gen Agent Trust Hub*, *Socket*, *Snyk*) được ghi nhận tại [architect/skills.md](architect/skills.md):
  - `anthropics/skills/frontend-design`
  - `vercel-labs/agent-skills/web-design-guidelines`
  - `vercel-labs/agent-skills/vercel-composition-patterns`
  - `tanstack-skills/tanstack-skills/tanstack-query`
