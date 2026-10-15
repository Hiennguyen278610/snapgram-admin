# Codebase Conventions & Development Standards — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này xác lập quy chuẩn viết code, quy tắc đặt tên, quản lý file, và tiêu chuẩn kỹ thuật cho toàn bộ phân hệ **Snapgram Admin Portal**. Tài liệu hoạt động độc lập (self-contained) và gắn kết trực tiếp với các phân mục:
- [overview.md](../overview.md): Nền tảng kiến trúc tổng quan và tech stack.
- [absolute-rules.md](../absolute-rules.md): Các điều luật bất biến về emoji, gradient và cài đặt shadcn component.
- [frontend-architecture.md](frontend-architecture.md): Tổ chức cấu trúc thư mục source code.
- [auth-and-security-flow.md](auth-and-security-flow.md): Luồng bảo vệ đăng nhập và route guards.
- [api-integration-map.md](api-integration-map.md): Chuẩn DTO và tích hợp REST API.
- [design-system.md](../design/design-system.md) & [layouts-and-navigation.md](../design/layouts-and-navigation.md): Quy chuẩn UI tokens và layout.

---

## 2. Environment & Tooling Standards
- **Runtime:** `Node.js >= 22.0.0` (quy định trong `package.json -> engines.node`).
- **Package Manager:** `pnpm v10+` bắt buộc (quy định trong `package.json -> packageManager: "pnpm@10.x"`). Nghiêm cấm dùng `npm` hay `yarn`.
- **Framework:** Next.js 15 App Router với TypeScript phiên bản strict mode (`"strict": true` trong `tsconfig.json`).
- **Thư viện UI:** shadcn/ui. Khi cần component mới, luôn chạy:
  ```bash
  pnpm dlx shadcn@latest add <component-name>
  ```
- **Bootstrap:** Mọi bước setup dùng CLI chính quy. Chi tiết tại [../delivery/bootstrap-commands.md](../delivery/bootstrap-commands.md). Cấm viết tay config — xem Rule 4 trong absolute-rules.md.

---

## 3. Cấu Trúc Thư Mục & Đặt Tên (File & Directory Conventions)

### 3.1. Quy ước đặt tên
- **Thư mục routes (`src/app/`):** `kebab-case` (ví dụ: `(dashboard)/user-management/`, `system-health/`).
- **Components (`src/components/`):** `PascalCase` cho tên file và tên component (ví dụ: `UserTable.tsx`, `BanUserModal.tsx`, `StatCard.tsx`).
- **UI Primitives (`src/components/ui/`):** `kebab-case` theo chuẩn xuất ra từ shadcn (ví dụ: `button.tsx`, `dialog.tsx`, `dropdown-menu.tsx`).
- **Hooks (`src/hooks/`):** `camelCase` với tiền tố `use` (ví dụ: `useAdminAuth.ts`, `useDebounce.ts`).
- **Services & Utils (`src/services/`, `src/lib/`):** `kebab-case` hoặc `camelCase` (ví dụ: `api-client.ts`, `users.service.ts`, `formatters.ts`).
- **Types & Interfaces (`src/types/`):** `kebab-case.types.ts` hoặc `index.ts` (ví dụ: `auth.types.ts`, `user.types.ts`).

### 3.2. Cấu trúc Server Components vs Client Components
- Mặc định toàn bộ file trong Next.js 15 App Router là **React Server Components (RSC)** để tối ưu SEO, bundle size và SSR.
- Chỉ gắn directive `'use client';` ở đầu file khi component có:
  - Sử dụng React Hooks (`useState`, `useEffect`, `useCallback`,...).
  - Sử dụng TanStack Query hooks (`useQuery`, `useMutation`).
  - Lắng nghe event của người dùng (`onClick`, `onChange`, `onSubmit`).
  - Tương tác với browser API (`window`, `document`, `localStorage`).

---

## 4. UI & Styling Conventions

### 4.1. Không dùng Emoji trong Static Text
- **Tuyệt đối cấm** emoji trong tiêu đề, nhãn (label), placeholder, button text, notification message, và static text của component (tham chiếu [absolute-rules.md](../absolute-rules.md)).
- Biểu tượng trực quan **100% sử dụng Lucide React** (`lucide-react`), kích thước chuẩn theo Tailwind v4 dùng shorthand `size-*`: `size-4` (inline trong text/button), `size-5` (navigation/actions), `size-6` (icon lớn / empty-state). **CẤM** viết dài `w-4 h-4` — luôn dùng `size-4`.
- **Typography:** Playfair Display (display ≥24px) + Roboto (body/UI) + Roboto Mono (code/ID). Load qua next/font, subsets latin+vietnamese.

### 4.2. Giới hạn Gradient
- Không áp dụng background gradient cho Card, Table, Modal, Sheet, Sidebar hay Panel. Toàn bộ là flat surface.
- Chỉ có đúng 2 trường hợp ngoại lệ duy nhất được cấp phép dùng gradient:
  1. Nút hành động cấp cao nhất (Primary Action Button): `bg-gradient-to-r from-[#ff6a00] to-[#ee0979]` + `shadow-[0_8px_20px_-3px_rgba(247,119,55,0.45)]`.
  2. Viền đánh dấu trạng thái hoạt động nổi bật (Active Ring): `linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)`.
- Không tạo thêm bất kỳ variant gradient nào khác.

### 4.3. Theme Mode (Light / Dark / System)
- Bắt buộc dùng thư viện **`next-themes`** với 3 mode `light` / `dark` / `system` (mặc định `system`). CẤM tự implement cơ chế đổi theme bằng tay.
- Mọi màu sắc dùng CSS variable / semantic token (`bg-background`, `bg-card`, `text-foreground`, `border-border`,...). **CẤM** hardcode màu (`bg-white`, `text-black`, `bg-gray-*`, `bg-zinc-*`).
- Toggle dùng icon Lucide (`Sun`/`Moon`/`Monitor`), **CẤM** emoji; nút trigger bắt buộc có `aria-label`.
- Chi tiết đặc tả tại [../design/theme-mode.md](../design/theme-mode.md).

---

## 5. State Management & Data Fetching Conventions

### 5.1. Server State: TanStack Query (React Query v5)
- Không lưu dữ liệu từ API vào Zustand hay Redux store. Toàn bộ dữ liệu server do TanStack Query quản lý.
- **Quy tắc Query Key:** Luôn dùng mảng phân cấp rõ ràng:
  ```typescript
  export const userKeys = {
    all: ['admin', 'users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: UserFilterParams) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
  };
  ```
- **Mutation:** Luôn invalidate đúng query key tương ứng sau khi mutate thành công (ví dụ: sau khi ban user thì invalidate `userKeys.lists()`).

### 5.2. Client State: Zustand
- Chỉ dùng Zustand cho global UI state thuần túy phía client:
  - Trạng thái đóng/mở Sidebar (`isSidebarCollapsed`).
  - Search command palette modal (`isCommandOpen`).
  - Thông tin user admin đang đăng nhập trong session bộ nhớ tạm (`currentAdmin`).
---

## 6. Cache Invalidation Matrix
Bảng đối chiếu quy định chính xác các Query Keys cần tự động vô hiệu hóa (`queryClient.invalidateQueries`) ngay sau khi Mutation thực hiện thành công:

| Thao Tác Đột Biến (Mutation) | Endpoint API Gọi Đến | Query Keys Bắt Buộc Invalidate | Phạm Vi Ảnh Hưởng Giao Diện |
|---|---|---|---|
| **Ban User** | `POST /api/auth/admin/users/{id}/ban` | `userKeys.lists()`, `userKeys.detail(id)`, `authKeys.stats()` | Bảng User cập nhật trạng thái Banned; Dashboard stats giảm active users, tăng banned users. |
| **Unban User** | `POST /api/auth/admin/users/{id}/unban` | `userKeys.lists()`, `userKeys.detail(id)`, `authKeys.stats()` | Bảng User cập nhật Active; Dashboard stats cập nhật số liệu. |
| **Gán/Gỡ Role User** | `POST/DELETE /api/auth/admin/users/{id}/roles` | `userKeys.detail(id)`, `userKeys.lists()` | Cập nhật role badges của user trong Drawer và Table. |
| **Tạo/Sửa Role RBAC** | `POST/PUT /api/auth/admin/roles` | `rbacKeys.roles()`, `rbacKeys.role(id)` | Bảng quản lý vai trò và phân quyền cập nhật tức thì. |
| **Cập nhật Quyền Role**| `PUT /api/auth/admin/roles/{id}/permissions` | `rbacKeys.role(id)`, `rbacKeys.roles()` | Drawer chi tiết vai trò tải lại ma trận permissions mới. |
| **Xử lý Report (Resolve)** | `PATCH /api/admin/reports/{id}/resolve` | `reportKeys.lists()`, `reportKeys.detail(id)` | Hàng đợi kiểm duyệt loại bỏ hoặc chuyển report sang tab Resolved. |
| **Bác bỏ Report (Dismiss)** | `PATCH /api/admin/reports/{id}/dismiss` | `reportKeys.lists()`, `reportKeys.detail(id)` | Hàng đợi kiểm duyệt chuyển report sang tab Dismissed. |
| **Confirm Presigned Upload** | `POST /api/media/{id}/confirm` | `mediaKeys.lists()` | Thư viện media tải lại hiển thị file mới tải lên MinIO. |
| **Xóa Media** | `DELETE /api/media/{id}` | `mediaKeys.lists()`, `mediaKeys.detail(id)` | Thư viện media loại bỏ thumbnail tệp đã xóa. |

---

## 7. Form Validation & Submission Rules
- **Schema Validation Thống Nhất:** Mọi form trong hệ thống bắt buộc sử dụng **`react-hook-form`** kết hợp resolver **`@hookform/resolvers/zod`** và schema định nghĩa bằng **`zod`**.
- **Chế độ kích hoạt (Validation Mode):**
  - Mặc định `mode: "onBlur"` để kiểm tra khi người dùng rời khỏi ô nhập liệu, tránh hiển thị lỗi quá sớm khi đang gõ.
  - Chuyển sang `reValidateMode: "onChange"` sau lần submit lỗi đầu tiên để phản hồi tức thì khi người dùng sửa đúng.
- **Trạng thái Nút Submit (Submission State):**
  - Khi form đang submit (`isSubmitting === true`): Bắt buộc vô hiệu hóa nút bấm (`disabled`), hiển thị spinner Lucide (`Loader2` kèm hiệu ứng xoay `animate-spin`).
  - Text nút submit chuyển sang thì tiếp diễn (ví dụ: `common.status.saving`).
- **Hiển thị lỗi trường (Inline Error Rendering):**
  - Thông báo lỗi hiển thị ngay dưới ô nhập liệu tương ứng (`<p className="text-xs text-rose-600 mt-1">`), đi kèm viền đỏ (`border-rose-500 focus-visible:ring-rose-500`).
  - CẤM dùng alert/toast popup chung chung để thay thế cho lỗi validation từng ô nhập liệu.

---

## 8. Modal, Dialog & Sheet Usage Guidelines
Quy chuẩn phân định rõ ràng giữa các loại hộp thoại dựa trên ngữ cảnh tương tác người dùng:

| Loại Hộp Thoại | Thành Phần UI (shadcn) | Trường Hợp Sử Dụng Cụ Thể | Ràng Buộc Tương Tác & Focus |
|---|---|---|---|
| **Standard Dialog** | `Dialog` | Form thao tác vừa phải: Tạo vai trò mới, Đổi mật khẩu, Preview ảnh/video. | Có nút Close `X`, cho phép đóng khi bấm phím `Esc` hoặc click backdrop nền. |
| **Destructive Modal** | `AlertDialog` | Các hành động rủi ro cao hoặc không thể hoàn tác: **Ban User**, **Xóa Media**, **Thu hồi quyền**. | **BẮT BUỘC xác nhận 2 bước** (tiêu đề cảnh báo màu đỏ, nút Action dùng `bg-rose-600`). **KHÔNG đóng khi click backdrop** để tránh bấm nhầm. |
| **Detail Drawer** | `Sheet` (Slide-over) | Xem chi tiết dữ liệu dày đặc: Drawer xem User Profile, Drawer soi nội dung tố cáo (Report Detail), Ma trận phân quyền Role. | Trượt từ cạnh phải màn hình (`side="right"`), độ rộng `w-full sm:max-w-xl`, hỗ trợ cuộn độc lập. |

---

## 9. Toast Notification Rules (Sonner)
Quy tắc sử dụng hệ thống thông báo nổi toàn cục qua thư viện **`sonner`**:

- **Vị trí cố định (Position):** `top-right` (Góc trên bên phải màn hình), tránh che khuất thanh điều hướng chính.
- **Phân loại & Thời gian tự đóng (Duration):**
  - **Success (`toast.success`):** Tự động đóng sau **3000ms** (3 giây). Dùng cho hành động thành công nhanh (ví dụ: "Đã mở khóa tài khoản").
  - **Info (`toast.info`):** Tự động đóng sau **4000ms**. Dùng cho thông báo hệ thống hoặc tiến trình nền.
  - **Error (`toast.error`):** Tự động đóng sau **6000ms** (hoặc giữ nguyên cho đến khi user bấm tắt nếu là lỗi nghiêm trọng). Đi kèm nút hành động con "Thử lại" (Retry action button) nếu có thể.
- **Ràng buộc nội dung:**
  - Tiêu đề ngắn gọn (≤ 40 ký tự), mô tả chi tiết tối đa 1-2 câu.
  - 100% nội dung thông báo qua từ điển i18n (`t("...")`). **CẤM** hiển thị chuỗi lỗi tiếng Anh thô từ backend.
  - **Chống Spam (Deduplication):** Sử dụng `id` cố định khi thông báo lỗi API lặp lại để tránh xếp chồng hàng chục toast giống nhau trên màn hình.

---

## 10. Security & Error Handling Conventions
- **Credentials:** Tất cả request gọi tới Backend API qua Axios/Fetch wrapper phải bật `withCredentials: true` để truyền nhận `httpOnly` cookie (`admin_access_token`).
- **Token Handling:** Không bao giờ lưu Access Token hoặc Refresh Token vào `localStorage` hay `sessionStorage`.
- **Token Storage:** Admin token nằm trong cookie httpOnly do BE set. FE KHÔNG đọc token. KHÔNG lưu token vào localStorage/sessionStorage/bất kỳ storage nào. Mọi request dùng `withCredentials: true`.
- **Refresh Token:** TBD — chưa xử lý ở sprint hiện tại. Access token hết hạn → 401 → redirect login. Xem chi tiết tại `auth-and-security-flow.md`.
- **Error Interceptor:**
  - Nhận mã `401 Unauthorized`: Xóa session cache, redirect ngay lập tức về `/admin/login`.
  - Nhận mã `403 Forbidden`: Hiển thị thông báo hoặc redirect về trang cấm truy cập (tài khoản không có quyền `ROLE_ADMIN`).
  - Nhận mã `429 Too Many Requests`: Hiển thị cảnh báo rate-limit / tạm khóa và đếm ngược thời gian chờ.

---

## 11. Media Upload & URL Conventions

### 11.1. Phân Định Luồng Tải Lên (Presigned vs Direct Upload)
- **Presigned Upload Flow (`POST /api/media/presigned` → `PUT {uploadUrl}` → `POST /api/media/{id}/confirm`):**
  - **Áp dụng:** Bắt buộc cho tất cả tệp video hoặc tệp ảnh có dung lượng **> 5MB**.
  - **Trải nghiệm người dùng (UX):**
    - Bắt buộc hiển thị thanh tiến trình thực tế (`Progress` bar 0% - 100%) khi upload binary lên MinIO.
    - Bắt buộc có nút **Hủy (Cancel)** bằng `AbortController` và nút **Thử lại (Retry)** khi mạng gián đoạn.
  - **Client Pre-validation:** Bắt buộc kiểm tra định dạng MIME (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`,...) và kích thước `sizeBytes` trước khi gọi API xin `uploadUrl`.
  - **Xử lý URL Presigned hết hạn:** Nếu PUT lên MinIO trả mã `403 Forbidden` (URL hết hạn theo `expiresInSeconds`): client tự động gọi lại `/api/media/presigned` để lấy URL mới và PUT lại 1 lần duy nhất. Nếu vẫn fail → hiển thị thông báo lỗi cho user và dừng.
- **Direct Upload Flow (`POST /api/media/upload` multipart/form-data):**
  - **Áp dụng:** Dành riêng cho ảnh đại diện (avatar), icon hoặc ảnh nhỏ có dung lượng **< 5MB**.
  - **Lý do không dùng Progress:** File dưới 5MB hoàn tất upload gần như tức thì, chỉ cần hiển thị spinner/loading indicator đơn giản trên nút bấm, không cần dựng thanh tiến trình phức tạp.

### 11.2. Xử Lý Đường Dẫn Media (Media URL Handling)
- **Tính Chất URL:** Trường `url` trả về từ Media Service (`MediaResponse`) là Presigned URL có thời hạn truy cập (hoặc link MinIO có chữ ký). **Tuyệt đối không lưu cache cứng vĩnh viễn** ở client hoặc `localStorage`.
- **Next.js Image Optimization:** Toàn bộ component hiển thị ảnh qua `next/image` phải khai báo hostname của MinIO / S3 trong file cấu hình (Extension `.ts`/`.mjs`/`.js` chốt ở Sprint 1):
  ```javascript
  // next.config.mjs (Extension .ts/.mjs/.js chốt ở Sprint 1)
  // TODO: verify MinIO API port từ backend config (Console thường 9001, API thường 9000)
  const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '9000',
          pathname: '/**',
        },
      ],
    },
  };

  export default nextConfig;
  ```

---

## 12. i18n & Globalization Conventions
- Bắt buộc quản lý toàn bộ chuỗi đa ngôn ngữ (EN/VI) bằng thư viện `next-intl` theo cấu trúc route `/[locale]/admin/...`.
- Cấu trúc key đặt theo mẫu `<domain>.<section>.<element>` dạng `lowerCamelCase` (ví dụ: `auth.login.title`, `common.action.cancel`).
- Tuyệt đối không hardcode chuỗi text trong component. Mọi thông báo lỗi từ API backend phải được ánh xạ qua `error.<CODE>`.
- Định dạng số, ngày giờ và tiền tệ sử dụng helper tập trung tại `src/lib/i18n/format.ts`.
- Chi tiết quy chuẩn xem tại [i18n.md](i18n.md).

---

## 13. Git, Commit & Repository Conventions
- Quy chuẩn phân nhánh: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
- Quy chuẩn thông điệp commit: Bắt buộc tuân thủ **Conventional Commits** (`<type>(<scope>): <subject>`), tự động kiểm tra bằng `husky` và `commitlint`.
- Quy chuẩn Pull Request: Đảm bảo vượt qua toàn bộ các bước kiểm tra của CI pipeline (`lint`, `typecheck`, `test`, `build`) trước khi squash merge vào `main`.
- Chi tiết quy chuẩn xem tại [git-and-ci.md](git-and-ci.md).

---

## 14. Danh Sách TBD (To Be Determined) Phân Hệ Media

- **Multi-file Upload:** Hiện tại Media Service API (`POST /api/media/presigned`, `POST /api/media/upload`) chỉ xử lý đơn lẻ 1 file/request. Việc hỗ trợ upload hàng loạt (batch/parallel) nhiều file cùng lúc trên giao diện hay backend có endpoint batch riêng → **TBD** (chờ xác nhận từ backend).
- **Video Preview trong `MediaPreviewDialog`:** Cấu hình phát video (có tự động chạy `autoplay`, có tiếng hay tắt tiếng `muted`, hiển thị thanh điều khiển `controls` native hay custom player) → **TBD** (chốt theo yêu cầu UX ở Sprint 1).
- **Phân Quyền Quản Trị Media Cấp Toàn Cục:** Endpoint `GET /api/media/me` hiện chỉ lấy media của user đang đăng nhập (dựa trên `X-User-Id`). Chưa có endpoint Admin `GET /api/admin/media` để duyệt/quản lý toàn bộ kho media của hệ thống → **TBD** (cần backend cung cấp nếu mở rộng phân hệ).

---

## 15. Search, Filter & Debounce Conventions

- **Debounce bắt buộc:** Mọi ô tìm kiếm kiểu "gõ tới đâu gọi API tới đó" PHẢI debounce **300ms** (dùng hook dùng chung `useDebounce` đặt tại `src/hooks/useDebounce.ts`).
- **Độ dài tối thiểu:** Chỉ gọi API khi từ khóa có **≥ 2 ký tự**. Dưới ngưỡng → không gọi request, hiển thị gợi ý nhập thêm.
- **Hủy request cũ (AbortController):** Mỗi lần từ khóa thay đổi, request trước đó PHẢI bị hủy (dùng `AbortController` truyền qua `signal`, hoặc để TanStack Query tự hủy theo query key) để tránh race condition.
- **Tích hợp TanStack Query:** Đưa từ khóa **đã debounce** vào query key để cache theo từng từ khóa:
  ```typescript
  const debounced = useDebounce(keyword, 300);
  const { data, isFetching } = useQuery({
    queryKey: userKeys.list({ q: debounced }),
    queryFn: ({ signal }) => searchUsers(debounced, signal),
    enabled: debounced.length >= 2,
  });
  ```
- **Feedback trạng thái:** Trong lúc chờ kết quả, hiển thị spinner Lucide (`Loader2` + `animate-spin`) ở cuối ô input — **KHÔNG** chặn toàn trang.
- **Empty state:** Khi không có kết quả, hiển thị thông báo qua i18n (`t("common.search.noResults")`), không hardcode chuỗi.

---

## 16. Tech Debt Deferrals

- **`error.http.<status>` fallback** (error-handling.md §5): chưa implement ở Sprint 1.4 (messages chưa có nhóm `error.http.*`). Sẽ bổ sung ở Sprint 3.3 (Polish) hoặc khi cần.
- **401 redirect tự động** (sprint-plan.md 1.4 ghi "redirect login"): defer sang Sprint 2.1, khi route `/admin/login` tồn tại. Sprint 1.4 chỉ throw `ApiError`, không tự redirect.
- **`error-parser.ts` branch coverage 89.36%** (spec `testing.md` §3 yêu cầu 100% branch cho helper parse lỗi): hiện thiếu ~0.6% do nhánh message-fallback và parse `Retry-After` lỗi. Sẽ bổ sung case ở Sprint 2.x khi viết test cho hooks/services cùng context.
- **`client.ts` func coverage 50%**: nhánh success `(response) => response` của interceptor chưa được exercise. Bổ sung 1 success-path test ở Sprint 2.x.
- **Zod field-error messages chưa i18n** (Sprint 2.1): `loginSchema`/`twoFactorSchema` dùng message mặc định tiếng Anh của zod; form hiển thị nguyên văn. Sprint 2.2 sẽ custom message theo i18n key.
- **Type lỏng cho `mutation.error`**: react-query type `Error` chung chung, chưa generic `useMutation<Data, ApiError, Variables>`. **Đã fix một phần ở Sprint 2.3**: 4 hook mutation của users (`use-ban-user`, `use-unban-user`, `use-assign-role`, `use-remove-role`) đều khai báo `useMutation<AdminUser, ApiError, Variables>`. Các hook mutation cũ (`use-admin-login`, `use-two-factor`) và các sprint sau (reports/media) vẫn cần chuẩn hoá theo cùng pattern.
- **Label ô mật khẩu bị "treo" (a11y)** (Sprint 2.1): `login-form.tsx` đặt `<FieldLabel htmlFor="login-password">` nhưng `<PasswordField>` không nhận `id` (Props không khai báo `id`), nên label trỏ tới id không tồn tại — screen reader không đọc được nhãn (WCAG 1.3.1/4.1.2). Fix ở Sprint 3.3 (a11y audit): thêm `id?: string` vào `PasswordField` Props + truyền `id="login-password"`; sau đó đổi test về `getByLabelText(/password/i)`.
- **Endpoint 2FA lệch doc — ĐÃ GIẢI QUYẾT (2026-10-08)**: prose mục "2FA flow" của `api-docs/auth-apidocs.md` từng ghi `POST /api/auth/2fa/login` + `/api/auth/2fa/setup|enable|disable`, trong khi code Sprint 2.1 dùng `POST /api/auth/login/2fa` với body `{ tempToken, totpCode }`. Đã đối chiếu **Swagger sống** `http://localhost:8081/v3/api-docs`: các path `/api/auth/2fa/*` **không tồn tại**; path thật là `/api/auth/login/2fa` (`TwoFaLoginRequest`: `tempToken` bắt buộc, `totpCode`, `backupCode`) và `/api/users/me/2fa/setup|enable` + `DELETE /api/users/me/2fa/disable`. ⇒ **Code FE đúng, doc sai** — đã sửa lại prose trong `auth-apidocs.md`. Không cần đổi service/mock.
- **2FA chưa hỗ trợ `backupCode`**: Swagger sống cho thấy `TwoFaLoginRequest` nhận cả `totpCode` và `backupCode`, nhưng `TwoFactorVerifyModal` (Sprint 2.1) chỉ có ô nhập 6 chữ số. Cân nhắc bổ sung luồng "dùng mã dự phòng" ở Sprint 3.3.
- **Đồng bộ trạng thái bảng vào URL chưa làm** (Sprint 2.3): route-map.md §7 yêu cầu filter/pagination/search **bắt buộc** đồng bộ vào URL Search Parameters, nhưng `users-page-content.tsx` dùng `useState` cục bộ theo brief Sprint 2.3 (quyết định của Tech Lead ngày 2026-10-08). Hệ quả: F5 mất bộ lọc, không copy link chia sẻ ca trực được. Xử lý ở Sprint 3.3 (Polish) — áp dụng cho cả users/reports/media. Mục "lưu `drawerId` trên URL" của route-map §7 vẫn `TBD`.
- **Bộ lọc `status`/`role` của bảng Users chưa triển khai** (Sprint 2.3): backend `GET /api/auth/admin/users` chưa có tham số tương ứng (xem [BI-005](../backend-issues/BI-005-missing-user-search-param.md)). Cố tình KHÔNG làm lọc client-side trên 1 trang để tránh hiển thị sai. Bổ sung khi backend có tham số. Tương tự, tham số `q` đã gửi lên nhưng backend hiện bỏ qua.
- **Checkbox "chọn tất cả" của `UserDataTable` chưa làm** (Sprint 2.3): brief có nhắc header checkbox cho bulk action tương lai, nhưng chưa có row checkbox và chưa có bulk action nào → sẽ tạo ra control chết, gây hại a11y. Sẽ bổ sung cùng lúc với tính năng bulk action (chưa nằm trong sprint plan).
- **`loading.tsx` / `error.tsx` cấp route chưa có** (Sprint 2.2 & 2.3): definition-of-done.md §3.3 yêu cầu mỗi trang có `loading.tsx` + `error.tsx`. Thực tế cả `admin/dashboard` và `admin/users` đều xử lý 4 trạng thái **bên trong** feature component (`*-page-content.tsx` + `*-skeleton`/`*-error`) và chưa tạo file route-level. Cần chuẩn hoá ở Sprint 3.3.
- **Kiểm tra RBAC theo vai trò ở tầng route chưa có** (Sprint 2.1→2.3): `src/middleware.ts` chỉ kiểm tra sự tồn tại của cookie `admin_access_token` (2 rule), KHÔNG kiểm tra vai trò. Vì vậy route-map.md §2 ghi `/admin/users` yêu cầu `ADMIN` nhưng một `MODERATOR` vẫn vào được. Điều kiện tiên quyết: token hiện là httpOnly nên FE không đọc được role — cần backend trả role qua endpoint `GET /api/users/me` hoặc cookie riêng. Defer tới Sprint 2.4 (RBAC) / 3.4 (Hardening).
- **Session admin hết hạn → `503` thay vì `401`** (phát hiện 2026-10-08, Sprint 2.3 — [BI-006](../backend-issues/BI-006-gateway-admin-auth-503.md)): Gateway filter nuốt lỗi 4xx từ `/api/auth/verify` rồi map thành `503`. FE hiện hiển thị `error.server.internalError` + nút Retry (đúng spec error-handling.md §5/§10). **KHÔNG hack FE parse `503` thành `401`** — chờ BE fix (map 4xx → `401`, thêm `/api/auth/verify` vào `permitAll`). Hệ quả kèm theo: logic chuyển hướng `401 → /admin/login` của FE **chưa bao giờ được kích hoạt**; sau khi BE fix phải bổ sung + kiểm thử luồng auto-redirect `401` (xem thêm tech-debt "401 redirect tự động" ở trên).
- **`permission.description` đơn ngữ (tiếng Việt)** (phát hiện 2026-10-08, Sprint 2.4 — [BI-007](../backend-issues/BI-007-permission-description-not-localized.md)): backend seed cứng description tiếng Việt trong DB và không có `Accept-Language`/`MessageSource`. Hệ quả: ở locale `en`, ma trận permission vẫn hiển thị mô tả tiếng Việt. FE **không** tạo 17 khoá i18n cho permission (sẽ lệch DB khi backend thêm permission mới) — thay vào đó nhãn chính là `permission.name` (trung tính ngôn ngữ, ví dụ `USER:BAN`) và tiêu đề nhóm `category` do FE bản địa hoá qua `rbac.category.*`. Description hiển thị nguyên văn như dòng phụ.
- **`GET /api/auth/admin/permissions` trả OBJECT map, không phải array** (Sprint 2.4): response là `category -> PermissionResponse[]`. Schema Zod là `z.record(z.string(), z.array(permissionResponseSchema))`. ⚠️ Khi thêm endpoint danh sách mới ở các sprint sau, **luôn kiểm tra Swagger sống** (`http://localhost:8081/v3/api-docs`) thay vì chỉ đọc `api-docs/*.md` — tài liệu markdown đã từng sai ở cả tham số (`BI-005`) và đường dẫn (2FA).

---

## 17. Blocked by Backend (Đang chờ BE)

Các issue BE chưa fix. FE KHÔNG hack workaround — giữ code đúng spec.

### BI-005 — `q` query param bị bỏ qua
- **Impact**: Search user không filter ở real backend (trả full list).
- **FE status**: Code đúng (gửi `q` param). Test pass với MSW.
- **Tạm thời**: Không test search trên real backend.
- **Sau fix**: E2E test search filter bằng real backend.

### BI-006 — Session hết hạn → 503 thay 401
- **Impact**: Auto-redirect login không kích hoạt. User thấy "Internal server error" + Retry.
- **FE status**: Interceptor 401 → redirect đã sẵn (Sprint 2.1).
- **Tạm thời**: Chấp nhận UX kém khi session expired.
- **Sau fix**: Interceptor tự động chạy.

### BI-007 — Permission description là tiếng Việt cứng
- **Impact**: User locale=en thấy mô tả permission bằng tiếng Việt.
- **FE status**: Hiển thị nguyên `permission.description` từ API.
- **Tạm thời**: Chấp nhận — backend là single source cho permission name/desc.
- **Sau fix**: BE trả `descriptionEn` HOẶC FE dùng catalog i18n riêng (17 key hardcode — cần update khi BE thêm permission).

### BI-008 — Report resolve/dismiss thiếu status guard
- **Impact**: Resolve report đã `DISMISSED` → 500 (đáng lẽ 409). Dismiss report đã `RESOLVED` → 200, âm thầm đổi trạng thái.
- **FE status**: Nút Resolve/Dismiss bị **disable** khi status không phù hợp (chỉ `PENDING`/`REVIEWED` cho phép hành động).
- **Tạm thời**: UI chặn ở tầng hiển thị; backend vẫn có thể bị gọi sai qua API trực tiếp.
- **Sau fix**: Bỏ disable phía FE (hoặc giữ như lớp phòng vệ) + map 409 thành thông báo conflict đúng nghĩa.

### BI-009 — `targetType` filter bị bỏ qua khi không kèm `status`
- **Impact**: Ở tab "All", chọn Target type không lọc gì (trả full list). Ở tab trạng thái cụ thể thì lọc đúng. Enum sai (`user`, `BOGUS`) → 500 thay vì 400.
- **FE status**: Code đúng (gửi `targetType` chữ HOA). MSW mock lọc đúng.
- **Tạm thời**: Không test filter targetType trên tab "All" với real backend.
- **Sau fix**: E2E/browser verify filter trên cả tab "All" và tab trạng thái.

### BI-010 — Cookie admin không được dùng cho /me, /logout, /api/media/**
(Đã mở rộng từ Sprint 2.6: ảnh hưởng thêm toàn bộ /api/media/**.)
- **Status**: ✅ **Fixed** (2026-10-16) — BE PR [#19](https://github.com/hoangdinhreborn/Snapgram-Server/pull/19).
- **Action**: FE bỏ workaround (đã xoá `TODO(BI-010)`). **Unblock Sidebar User Menu** (mini-sprint 3.05) + switch media sang real backend + role-filtered sidebar (Sprint 3.3).
- **Impact (lịch sử)**: Các endpoint này trả **401** khi gọi bằng cookie admin ⇒ **không thể đăng xuất** (cookie httpOnly không tự xoá được), **không lấy được thông tin admin hiện tại**, và **toàn bộ /api/media/** không gọi được qua cookie**.
- **Verify**: xem [BI-010 §8](../backend-issues/BI-010-admin-cookie-not-used-for-me-and-logout.md).

### BI-011 — `auth-service` không khởi động được do `RateLimitInterceptor` (P0)
- **Impact**: Commit `d4ece81` thêm constructor thứ 2 vào `RateLimitInterceptor` mà không `@Autowired` ⇒ Spring đòi default constructor ⇒ **auth-service crash-loop, api-gateway không lên** ⇒ không chạy được backend thật.
- **FE status**: Không có workaround. **Chặn luôn việc verify runtime BI-010** và khiến Sprint 3.1 hiển thị Gateway/Auth = `DOWN` (đúng thực tế).
- **Tạm thời**: Dùng MSW cho test; không verify real backend.
- **Sau fix**: `curl :8081/:8080/actuator/health` = UP → verify BI-010 (5 endpoint bằng cookie admin) → cập nhật docs BI-010 sang `Fixed`.
- **Chi tiết**: [BI-011](../backend-issues/BI-011-auth-service-boot-failure-ratelimit-interceptor.md).

### Nguyên tắc chung
- FE không tự ý đổi API contract để workaround.
- Track trong `backend-issues/BI-*.md`.
- Khi BE báo fix → verify bằng curl real backend + bật lại E2E tương ứng.

---

## 18. Test Environment Notes

- **MSW v3 + jsdom + axios:** MSW v3 không intercept được XHR adapter của axios khi chạy trong `jsdom` (interceptor chain không bắt được request từ jsdom). Với test liên quan tới `apiClient` (axios), bắt buộc dùng directive `// @vitest-environment node` ở đầu file test — axios sẽ dùng http adapter và MSW intercept bình thường. Test component (React) vẫn chạy jsdom mặc định.
