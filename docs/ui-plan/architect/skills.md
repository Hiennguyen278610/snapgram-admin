# Skills Catalog & Security Audits — Snapgram Admin Portal

## 1. Context & Self-Contained Scope
Tài liệu này là đặc tả quy chuẩn độc lập (self-contained) gom chung toàn bộ danh mục **Agent Skills** được phê duyệt sử dụng cho dự án frontend Snapgram Admin Portal. Tài liệu liên kết mật thiết với:
- [overview.md](../overview.md): Kiến trúc tổng thể và định hướng công nghệ.
- [absolute-rules.md](../absolute-rules.md): Các điều luật bất biến về design tokens và CLI.
- [frontend-architecture.md](frontend-architecture.md): Tổ chức module, thư mục và kiến trúc code.
- [conventions.md](conventions.md): Quy chuẩn coding React 19 / Next.js 15 và TanStack Query.

## 2. Tiêu Chuẩn Bảo Mật Bắt Buộc (Security Verification Gate)
Toàn bộ các skill được đưa vào dự án đều phải được kiểm tra thực tế trên hệ thống **skills.sh** và đạt trạng thái **PASS** tuyệt đối trên cả 3 tiêu chí kiểm định bảo mật:
1. **Gen Agent Trust Hub**: Đảm bảo nguồn gốc danh tính tác giả/tổ chức tin cậy, không chứa prompt injection hoặc mã độc.
2. **Socket**: Đảm bảo an toàn chuỗi cung ứng dependency (Supply-chain security), không chứa malware, backdoor hoặc package hijacking.
3. **Snyk**: Không chứa lỗ hổng bảo mật mã nguồn (Vulnerabilities/CWE), code patterns đạt chuẩn an ninh quốc tế.

---

## 3. Danh Mục Các Skill Được Phê Duyệt

### 3.1. Nhóm Skill Thiết Kế Giao Diện (3 Skills Đồng Nhất Triết Lý)

| Skill Slug & Nguồn | Gen Agent Trust Hub | Socket | Snyk | Mục Đích Sử Dụng Trong Dự Án |
|---|---|---|---|---|
| **`anthropics/skills/frontend-design`** | **PASS** | **PASS** | **PASS** | Định hướng thiết kế giao diện SaaS sản phẩm: bố cục phân cấp thị giác rõ ràng, hạn chế trang trí thừa, tuân thủ nguyên tắc typography và spacing nhất quán. |
| **`vercel-labs/agent-skills/web-design-guidelines`** | **PASS** | **PASS** | **PASS** | Quy chuẩn thiết kế web hiện đại: tiêu chuẩn khả năng tiếp cận (Accessibility - a11y), độ tương phản màu (WCAG AA), responsive fluid grid và trạng thái tương tác (hover, focus, active). |
| **`vercel-labs/agent-skills/vercel-composition-patterns`** | **PASS** | **PASS** | **PASS** | Kiến trúc phân rã component trong Next.js App Router: tách biệt Server Components (RSC) cho render dữ liệu và Client Components cho tương tác động; tối ưu hóa Bundle size. |

### 3.2. Nhóm Skill Xử Lý Dữ Liệu & Server State (1 Skill Bắt Buộc)

| Skill Slug & Nguồn | Gen Agent Trust Hub | Socket | Snyk | Mục Đích Sử Dụng Trong Dự Án |
|---|---|---|---|---|
| **`tanstack-skills/tanstack-skills/tanstack-query`** | **PASS** | **PASS** | **PASS** | Chuẩn hóa toàn bộ server-state management: quy tắc đặt Query Keys phân cấp mảng `[entity, scope, params]`, cấu hình `staleTime`, `gcTime`, cơ chế Optimistic Updates và đồng bộ hóa cache sau mutations. |

---

## 4. Nguyên Tắc Ứng Dụng Trong Quy Trình Phát Triển
1. **Tương thích không xung đột:** Cả 3 skill thiết kế giao diện đều đồng thuận về phong cách Clean / Data-Dense / Flat Surfaces, bổ trợ chặt chẽ cho nhau mà không tạo ra mâu thuẫn về styling hay layout.
2. **Tuân thủ Absolute Rules:** Bất kỳ hướng dẫn nào từ các skill khi áp dụng vào code đều không được vượt qua các điều luật bất biến trong [absolute-rules.md](../absolute-rules.md) (Cấm emoji icon, cấm lạm dụng gradient ngoài 2 vị trí quy định, bắt buộc dùng lệnh CLI `pnpm dlx shadcn@latest add ...`).
