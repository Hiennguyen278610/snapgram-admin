# Absolute UI & Code Rules (Bắt buộc tuân thủ)

Tài liệu này chứa các quy tắc bất di bất dịch trong quá trình thiết kế giao diện (UI) và triển khai Frontend cho phân hệ Snapgram Admin Portal. Tài liệu hoạt động độc lập (self-contained) và gắn kết trực tiếp với:
- [overview.md](overview.md): Mục tiêu và cấu trúc phân hệ.
- [design/design-system.md](design/design-system.md): Bảng màu, typography và tokens giao diện.
- [architect/conventions.md](architect/conventions.md): Quy ước đặt tên và tiêu chuẩn viết mã.
- [architect/frontend-architecture.md](architect/frontend-architecture.md): Cấu trúc project Next.js 15.

Bất kỳ code hay đề xuất thiết kế nào vi phạm các quy tắc này đều bị từ chối.

---

## 1. Danh sách Absolute Rules

### Rule 1: Cấm tuyệt đối Emoji Icon trong Static Text

- **Quy tắc:** Cấm dùng emoji icon (ví dụ: 🚀, 📦, 🛡️, ⚠️, ❌, ✅, 🔥, 📊) trong toàn bộ title của static text component hoặc bất kỳ static text nào trên giao diện.
- **Ngoại lệ duy nhất:** Trừ khi người dùng (Hyan) yêu cầu đích danh.
- **Giải pháp thay thế:** Toàn bộ icon thị giác phải dùng vector icon chính quy từ **Lucide React** (hoặc Radix Icons). Màu sắc và kích thước theo đúng design token (`size-4`, `size-5`, `text-slate-400`,...).

### Rule 2: Cấm lạm dụng Gradient Color cho Background Component

- **Quy tắc:** Cấm tuyệt đối việc lạm dụng background dạng gradient màu mè cho các component (cards, panels, containers, modals, table headers). Toàn bộ bề mặt (surfaces) phải dùng màu phẳng trung tính (flat surface), hairline border.
- **Ngoại lệ duy nhất được cấp phép (Đã chuẩn hóa vào design system):**
  1. **Primary Action Button (Creatpost / Action chính):** Dùng đúng gradient `bg-gradient-to-r from-[#ff6a00] to-[#ee0979]` kèm shadow `shadow-[0_8px_20px_-3px_rgba(247,119,55,0.45)]`.
  2. **Đánh dấu bảng tin / Active Highlights Ring:** Dùng đúng gradient viền `.insta-ring { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }`.
- **RÀNG BUỘC NGHIÊM NGẶT:** **Tuyệt đối không sinh thêm bất kỳ biến thể variant gradient nào khác** (cấm gradient xanh, tím, pastel, neon glow,...).

### Rule 3: Bắt buộc cài đặt shadcn/ui qua lệnh CLI chính quy từ Docs (Sử dụng pnpm v10 / pnpm dlx)

- **Quy tắc:** Khi muốn thêm/kéo bất kỳ component nào từ thư viện **shadcn/ui**, bắt buộc phải thực hiện thông qua lệnh CLI được cấp sẵn từ tài liệu chính thức của shadcn kết hợp với **pnpm** (pnpm dlx), không được tự ý copy-paste file tùy tiện hoặc chế code component thiếu cấu trúc chuẩn:
  ```bash
  # Khởi tạo dự án Next.js 15 với pnpm v10 (Node 22+)
  pnpm dlx create-next-app@latest admin-client --typescript --tailwind --eslint --app

  # Khởi tạo shadcn/ui
  pnpm dlx shadcn@latest init

  # Kéo component chính quy bằng pnpm dlx
  pnpm dlx shadcn@latest add button table dialog dropdown-menu badge input card tabs sheet command
  ```
- Toàn bộ component tạo ra phải nằm trong thư mục quy chuẩn `@/components/ui/` và tuân theo cva (class-variance-authority).

### Rule 4: CLI-First Bootstrap — Cấm Tự Viết Config

- Mọi bước khởi tạo dự án (init repo, setup framework, cài shadcn, thêm dependency) BẮT BUỘC dùng CLI chính quy theo [delivery/bootstrap-commands.md](delivery/bootstrap-commands.md).
- CẤM AI tự viết tay các file: package.json, tsconfig.json, next.config.*, tailwind.config.*, postcss.config.*, pnpm-lock.yaml, .eslintrc*, .prettierrc*.
- Nếu CLI không có lệnh tương ứng → DỪNG, hỏi user. KHÔNG tự bịa.
- Sau mỗi lệnh CLI → verify file/output sinh ra đúng.
- Nếu thấy AI đề xuất "tôi sẽ viết file package.json cho bạn" → reject ngay, yêu cầu dùng CLI.
- **Ngoại lệ:** Được sửa `src/app/layout.tsx` để override font (xoá Geist, dùng next/font). Được sửa `src/app/globals.css` để override token (oklch shadcn → hex brand). Lý do: CLI v4 auto-push không khớp design system.

### Rule 5: Theme Mode — Cấm Hardcode Màu, Bắt Buộc Dùng Semantic Token

- **Quy tắc:** Mọi màu sắc (nền, chữ, viền) trong component PHẢI lấy từ CSS variable / semantic token của design system: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`,...
- **CẤM TUYỆT ĐỐI** hardcode màu tại layer component: `bg-white`, `bg-black`, `text-black`, `bg-gray-*`, `bg-zinc-*`, `text-slate-*`... (trừ bảng màu trạng thái ngữ nghĩa `emerald`/`rose`/`amber` đã khai báo tập trung trong design-system).
- **Theme toggle:** Bắt buộc dùng thư viện **`next-themes`**, hỗ trợ 3 mode **Light / Dark / System** (mặc định `system`). **CẤM** tự implement cơ chế đổi theme bằng tay.
- **Toggle UI:** Dùng icon **Lucide** (`Sun`, `Moon`, `Monitor`). **CẤM** dùng emoji (tiếp nối Rule 1).
- **Chi tiết đặc tả:** [design/theme-mode.md](design/theme-mode.md).

---

## 2. Recommended Skills từ skills.sh (Đã thẩm định Security Audits)

Tất cả 4 skill dưới đây đều được thẩm định trực tiếp trên **skills.sh** và đều đạt **PASS 100% cả 3 tiêu chuẩn bảo mật**:

- **Gen Agent Trust Hub:** PASS
- **Socket Security:** PASS
- **Snyk Security:** PASS

### 2.1. 3 Skill Thiết kế Giao diện (Đồng nhất triết lý thiết kế - Không xung đột)

| Skill Name                                | Nguồn (Repository)          |                              Security Audits                              | Mô tả & Lý do lựa chọn                                                                                                                                                                                      | Lệnh cài đặt                                               |
| :---------------------------------------- | :--------------------------- | :-----------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **`frontend-design`**             | `anthropics/skills`        | **Gen Agent Trust: PASS****Socket: PASS****Snyk: PASS** | Hướng dẫn thiết kế giao diện có chủ đích, trực quan, thẩm mỹ cao; tối ưu typography, phân cấp thông tin rõ ràng, tránh giao diện generic nhàm chán. Không dùng gradient bừa bãi.     | `npx skills add https://github.com/anthropics/skills`        |
| **`web-design-guidelines`**       | `vercel-labs/agent-skills` | **Gen Agent Trust: PASS****Socket: PASS****Snyk: PASS** | Bộ quy chuẩn UI/UX của Vercel Web Interface Guidelines. Kiểm duyệt độ tương phản, accessibility (a11y), responsive, padding/margin micro-spacing và trạng thái tương tác bàn phím.             | `npx skills add https://github.com/vercel-labs/agent-skills` |
| **`vercel-composition-patterns`** | `vercel-labs/agent-skills` | **Gen Agent Trust: PASS****Socket: PASS****Snyk: PASS** | Mẫu cấu trúc component React linh hoạt, mở rộng cao (Compound Components, Slot-based composition). Hoàn toàn tương thích và cùng triết lý với**shadcn/ui** và **Radix Primitives**. | `npx skills add https://github.com/vercel-labs/agent-skills` |

### 2.2. 1 Skill TanStack Query (Quản lý State & Server Cache chuẩn xác)

| Skill Name                   | Nguồn (Repository)                 |                              Security Audits                              | Mô tả & Lý do lựa chọn                                                                                                                                                                                           | Lệnh cài đặt                                                      |
| :--------------------------- | :---------------------------------- | :-----------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| **`tanstack-query`** | `tanstack-skills/tanstack-skills` | **Gen Agent Trust: PASS****Socket: PASS****Snyk: PASS** | Skill chính thức từ tổ chức TanStack. Quản lý bất đồng bộ state, query keys factory, stale-while-revalidate, optimistic updates, pagination caching và xử lý auto-retry/mutation lifecycle chuẩn mực. | `npx skills add https://github.com/tanstack-skills/tanstack-skills` |

---

## 3. Checklist tự kiểm tra trước khi bàn giao code UI

- [ ] Không có emoji icon nào xuất hiện trong chuỗi static text / tiêu đề (chỉ dùng Lucide icon).
- [ ] Không có class CSS gradient trên background của card, table, modal, panel.
- [ ] Chỉ có đúng 2 thành phần mang gradient: Nút Action chính (creatpost) và Ring viền đánh dấu bảng tin/highlights. Không có bất kỳ biến thể gradient nào khác.
- [ ] Tất cả component shadcn đều được thêm bằng `npx shadcn@latest add <component>`.
- [ ] Dữ liệu fetch từ Backend (Spring Boot) sử dụng TanStack Query theo đúng mẫu cache key và staleTime quy định.
- [ ] Giao diện đồng bộ phẳng (flat surfaces) sạch sẽ theo tỉ lệ khung nhìn chuẩn canvas.
- [ ] Không hardcode màu trong component (dùng semantic token); theme dùng `next-themes` với đủ 3 mode Light/Dark/System.
