# Definition of Done (DoD) & Phase Gateways — Snapgram Admin Portal

## 1. Context & Self-Contained Scope

Tài liệu này xác lập quy chuẩn kỹ thuật độc lập (self-contained) về tiêu chuẩn nghiệm thu chất lượng (Definition of Done - DoD) cho từng thành phần giao diện, custom hook, service, trang ứng dụng, và điều kiện chuyển giao của từng Phase lớn trong dự án **Snapgram Admin Portal**. Tài liệu gắn kết trực tiếp với:

- [../absolute-rules.md](../absolute-rules.md): Các điều luật bất biến về emoji, gradient và CLI.
- [../design/design-system.md](../design/design-system.md): Bảng màu, typography và tokens hiển thị.
- [testing.md](testing.md): Chiến lược kiểm thử và ngưỡng độ bao phủ.
- [route-map.md](route-map.md): Bản đồ định tuyến và phân quyền.
- [../CONTRIBUTING.md](../CONTRIBUTING.md): Quy chuẩn commit và PR.

---

## 2. Hệ Thống Thuật Ngữ Quy Chuẩn (Project Terminology)

Dự án được phân rã thành **3 PHASE** lớn bao gồm tổng cộng **17 Sprints** tuần tự:

- **Phase (Giai đoạn):** Cột mốc kiến trúc lớn (Milestone), kéo dài từ **2 đến 6 tuần**.
- **Sprint (Chu kỳ):** Đợt phát triển tính năng tập trung, kéo dài từ **1 đến 2 tuần** trong phạm vi 1 Phase.

> *Lưu ý:* Tài liệu này định nghĩa tiêu chuẩn nghiệm thu (DoD) bất biến xuyên suốt dự án. Kế hoạch chi tiết (Sprint Backlog Plan) cho từng Sprint sẽ được tạo riêng khi bắt đầu Phase 1.

---

## 3. Tiêu Chuẩn Nghiệm Thu Chi Tiết (Granular Definition of Done)

### 3.1. Component DoD (Dành Cho Thành Phần Giao Diện)

- [ ] **Type Safety:** Định nghĩa kiểu dữ liệu TypeScript tường minh cho Props (`interface Props`), tuyệt đối không dùng kiểu `any`.
- [ ] **Bản địa hóa (i18n):** 100% chuỗi văn bản tĩnh hiển thị qua `next-intl` (tra cứu key từ `messages/`), không hardcode chuỗi text.
- [ ] **Đủ 4 Trạng Thái (Four Visual States):** Đảm bảo xử lý đủ 4 trạng thái:
  1. *Loading state:* Skeleton hoặc Spinner.
  2. *Empty state:* Trạng thái không có dữ liệu kèm hướng dẫn.
  3. *Error state:* Thông báo lỗi rõ ràng kèm nút thử lại (Retry).
  4. *Disabled state:* Trạng thái vô hiệu hóa khi không có quyền hoặc đang gửi request.
- [ ] **Responsive chuẩn mực:** Hiển thị mượt mà trên cả 3 breakpoints theo [layout-system.md](../design/layout-system.md) (Mobile `<640px`, Tablet `640-1023px`, Desktop `≥1024px`).
- [ ] **Tiêu chuẩn Accessibility (a11y):** Hỗ trợ điều hướng hoàn toàn bằng bàn phím (Tab, Enter, Escape), có vòng viền focus rõ ràng (`focus-visible:ring`), có `aria-label` cho mọi icon button.
- [ ] **Tuân thủ Absolute Rules:** Không có emoji trong tiêu đề/nhãn; Không dùng nền gradient bừa bãi (chỉ dùng đúng 2 vị trí được cấp phép); Kéo component shadcn qua lệnh CLI chính quy.
- [ ] **Unit Tests:** Viết co-located unit test cho các component có logic điều kiện hoặc biến đổi dữ liệu.
- [ ] **Storybook Story:** **TBD** (Sẽ đánh giá nhu cầu ở Phase 2).

### 3.2. Hook & Service Layer DoD

- [ ] **Type-Safe tuyệt đối:** Kiểu dữ liệu tham số đầu vào và kết quả trả về khớp chính xác với DTO trong `api-docs/*.md`.
- [ ] **Query Key Convention:** Đặt tên khóa truy vấn TanStack Query phân cấp mảng đúng chuẩn `[domain, scope, params]`.
- [ ] **MSW Mocking:** Có bộ giả lập MSW tương ứng cho các kịch bản: Thành công (200), Hết hạn token (401), Thiếu quyền (403), Lỗi server (500).
- [ ] **Cache Invalidation:** Tự động vô hiệu hóa (invalidate) đúng query key tương ứng sau khi thực hiện mutation thành công.
- [ ] **Chuẩn hóa Error:** Sử dụng lớp Adapter `error-parser.ts` để phân giải thành `ApiError` và map sang key i18n theo [error-handling.md](error-handling.md).

### 3.3. Page DoD (Dành Cho Trang Ứng Dụng Hoàn Chỉnh)

- [ ] **Routing & Layout:** Cấu trúc thư mục khớp chính xác với [route-map.md](route-map.md), bọc đúng Shell Layout tương ứng.
- [ ] **Route Guard & RBAC:** Kiểm tra đúng quyền hạn của trang; nếu không đủ quyền, hiển thị component `ForbiddenState` hoặc `notFound()`.
- [ ] **Metadata i18n:** Cấu hình đầy đủ Title và Description đa ngôn ngữ trong hàm `generateMetadata`.
- [ ] **Đầy đủ 3 trạng thái trang:** Có file `loading.tsx`, trạng thái rỗng và `error.tsx` (Error Boundary).
- [ ] **E2E Critical Path:** Có ít nhất 1 kịch bản Playwright E2E bao phủ luồng nghiệp vụ chính của trang.
- [ ] **Sạch sẽ Console:** Không xuất hiện bất kỳ lỗi (Error) hoặc cảnh báo (Warning) nào trên DevTools Console.
- [ ] **Kiểm tra tự động a11y:** Chạy audit tự động qua `axe-playwright` không có lỗi nghiêm trọng (Violation critical = 0).

### 3.4. Pull Request DoD

- [ ] Vượt qua 100% các bước kiểm tra tự động của CI Pipeline: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- [ ] Vượt qua kiểm tra cú pháp Conventional Commits bằng `commitlint`.
- [ ] Tiêu đề PR tuân thủ đúng định dạng Conventional Commits.
- [ ] Nhận được tối thiểu **1 sự phê duyệt (Approval)** từ reviewer.
- [ ] Dung lượng bundle sau khi build không tăng đột biến (Bundle size check).

---

## 4. Điều Kiện Nghiệm Thu Từng Phase (Phase Gateways)

### Phase 1 — Nền Tảng (Foundation)

- **Thời lượng ước tính:** 2 – 3 tuần.
- **Quy mô:** Bao gồm 7 Sprints từ **Sprint 1.1 đến Sprint 1.7**:
  - `Sprint 1.1`: Khởi tạo repo, tooling, TypeScript strict mode, pnpm v10, Next.js 15.
  - `Sprint 1.2`: Cấu hình Tailwind CSS, shadcn/ui base, Design tokens, Fonts Google (`Playfair Display`, `Roboto`, `Roboto Mono`).
  - `Sprint 1.3`: Cài đặt `next-intl`, cấu hình route đa ngôn ngữ `/[locale]/admin/...`, middleware xác thực cookie.
  - `Sprint 1.4`: Tích hợp TanStack Query v5, Axios client `withCredentials: true`, lớp Adapter `error-parser.ts`.
  - `Sprint 1.5`: Xây dựng MasterShell, SidebarNavigation, TopSearchBar, Command Palette.
  - `Sprint 1.6`: Thiết lập Vitest, React Testing Library, MSW v2, Playwright, viết test mẫu.
  - `Sprint 1.7`: Thiết lập CI pipeline GitHub Actions, Husky pre-commit hooks, Commitlint.
- **Điều kiện nghiệm thu Phase 1 (Exit Criteria):**
  - [ ] Production build pass 100% không cảnh báo.
  - [ ] CI pipeline xanh toàn bộ trên GitHub Actions (Node 22).
  - [ ] Chưa cần có các component nghiệp vụ chuyên sâu.

### Phase 2 — Thành Phần Nghiệp Vụ (Business Components)

- **Thời lượng ước tính:** 4 – 6 tuần.
- **Quy mô:** Bao gồm 6 Sprints từ **Sprint 2.1 đến Sprint 2.6**:
  - `Sprint 2.1`: Authentication forms, 2FA OTP Modal, CountdownTimer lockout.
  - `Sprint 2.2`: User Data Table, bộ lọc, Drawer xem chi tiết, Modal Ban/Unban.
  - `Sprint 2.3`: RBAC Manager, Role table, Permission matrix drawer.
  - `Sprint 2.4`: Moderation Queue Table, Bộ lọc trạng thái, Drawer soi chi tiết nội dung vi phạm, Modal xử lý duyệt/bác bỏ.
  - `Sprint 2.5`: Media Library Grid, bộ tải lên Presigned Upload (3 bước) có progress bar, Direct Uploader, Modal xóa media.
  - `Sprint 2.6`: Dashboard Stat Cards, Moderation Quick Bar, System Health Monitoring.
- **Điều kiện nghiệm thu Phase 2 (Exit Criteria):**
  - [ ] 100% component nghiệp vụ đạt tiêu chuẩn Component DoD và Hook/Service DoD.
  - [ ] Đạt độ bao phủ Unit & Integration test tối thiểu 70% lines và branches cho `src/features/**`.
  - [ ] 100% văn bản tĩnh được bản địa hóa đầy đủ cho 2 locale `en` và `vi`.
  - [ ] Luồng đăng nhập hoạt động hoàn chỉnh (nhận cookie httpOnly, chặn route `/admin/*` nếu chưa login).

### Phase 3 — Hoàn Thiện Trang & Tối Ưu Hóa (Pages & Hardening)

- **Thời lượng ước tính:** 3 – 4 tuần.
- **Quy mô:** Bao gồm 4 Sprints từ **Sprint 3.1 đến Sprint 3.4**:
  - `Sprint 3.1`: Nối ráp hoàn chỉnh toàn bộ các trang theo `route-map.md`, kích hoạt 2-tier route guard.
  - `Sprint 3.2`: Viết trọn bộ kịch bản E2E Playwright cho các Critical Paths, thiết lập coverage gate.
  - `Sprint 3.3`: Audit khả năng tiếp cận (Accessibility WCAG AA), tối ưu hóa Core Web Vitals và Performance Budget.
  - `Sprint 3.4`: Cấu hình Production Build, Docker container hóa frontend, Staging Deployment và Smoke Testing.
- **Điều kiện nghiệm thu Phase 3 (Exit Criteria):**
  - [ ] 100% kịch bản E2E Playwright pass trên CI.
  - [ ] Độ bao phủ toàn dự án đạt ngưỡng quy định.
  - [ ] Triển khai thành công trên môi trường Staging/Production thử nghiệm, kết nối thông suốt với API Gateway (`:8080`).

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
