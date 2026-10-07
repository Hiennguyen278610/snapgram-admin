# Design System & UI Tokens — Snapgram Admin Portal

## 1. Context & Self-Contained Scope

Tài liệu này là đặc tả quy chuẩn độc lập (self-contained) về toàn bộ tokens giao diện, màu sắc, font chữ và phong cách hiển thị cho **Snapgram Admin Portal**. Tài liệu gắn kết mật thiết với:

- [overview.md](../overview.md): Kiến trúc tổng quan và tech stack.
- [absolute-rules.md](../absolute-rules.md): Các điều luật bất biến về emoji, gradient và CLI shadcn.
- [layouts-and-navigation.md](layouts-and-navigation.md): Bản đồ phân bố layout, sidebar và topbar.
- [architect/conventions.md](../architect/conventions.md): Quy ước code component và styling.

> **RÀNG BUỘC TUÂN THỦ:** Mọi thành phần UI được thiết kế hoặc implement phải tuân thủ tuyệt đối [absolute-rules.md](../absolute-rules.md):
>
> 1. **Cấm dùng emoji icon** trong mọi static text, component title (dùng Lucide React icons chính quy).
> 2. **Cấm lạm dụng gradient color** cho background các component thông thường (cards, panels, modals, tables, badges).
> 3. **NGOẠI LỆ DUY NHẤT VỀ GRADIENT:** Chỉ có 2 phần tử được chỉ định rõ được phép dùng gradient nguyên bản:
>    - **Primary Action Button (Creatpost / Action cấp cao):** `bg-gradient-to-r from-[#ff6a00] to-[#ee0979]` + shadow `shadow-[0_8px_20px_-3px_rgba(247,119,55,0.45)]`.
>    - **Đánh dấu bảng tin / Active Highlights Ring:** `background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)`.
>    - **TUYỆT ĐỐI KHÔNG SINH THÊM BẤT KỲ BIẾN THỂ GRADIENT (VARIANT) NÀO KHÁC.**
> 4. **Bắt buộc kéo component shadcn/ui qua lệnh CLI chính quy:** `pnpm dlx shadcn@latest add <component>`.
> 5. **Tích hợp các skill đã qua kiểm định:** `frontend-design`, `web-design-guidelines`, `vercel-composition-patterns`, `tanstack-query`.

## 2. Triết Lý Thiết Kế (Design Philosophy)

- **Cấu Trúc Khung Nhìn Chuẩn Mực:** Khung nhìn bọc trong Container thẻ lớn (`rounded-[32px] sm:rounded-[40px]`), viền hairline tinh gọn, đổ bóng êm ái.
- **Data-Dense & Precision:** Tối ưu mật độ thông tin, giảm khoảng trắng thừa, giúp Admin đọc lướt số liệu và bảng dữ liệu nhanh nhất.
- **Flat Surface Chủ Đạo:** Toàn bộ bề mặt nền của card, table, dialog đều dùng màu phẳng trung tính, phân lớp bằng độ tương phản rõ ràng. Điểm nhấn thị giác chỉ tập trung vào 2 gradient được phê duyệt.
- **Deliberate Destructive Actions:** Các hành động mang tính hủy diệt hoặc phạt nặng (Ban user, xóa nội dung, tước role) luôn có cảnh báo màu đỏ phân biệt rõ ràng và modal xác nhận kép.

---

## 3. Color Palette & Semantic Tokens

> **LƯU Ý (Tailwind v4 + shadcn v4):** shadcn v4 xuất token dạng `oklch()`
> thay vì hex. Design system này dùng hex làm nguồn sự thật (SSOT).
> Khi override token trong globals.css, giữ dạng hex — Tailwind v4
> cho phép mix oklch + hex.

### 3.1. Cặp Gradient Độc Quyền (Không sinh biến thể)

| Tên Token                          | Cú pháp CSS / Tailwind                                                                                | Mô tả                   | Phạm vi sử dụng duy nhất trong Admin                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`brand-action-gradient`** | `bg-gradient-to-r from-[#ff6a00] to-[#ee0979]`                                                        | Cam sang Hồng            | **Chỉ dùng cho Action Button chính cao nhất** (Nút "Tạo thông báo toàn hệ thống", "Broadcast Alert", hoặc "Tạo mới Admin")                               |
| **`brand-action-shadow`**   | `shadow-[0_8px_20px_-3px_rgba(247,119,55,0.45)]`                                                      | Drop shadow ấm           | Đổ bóng đi kèm nút Action chính ở trên                                                                                                                              |
| **`brand-ring-gradient`**   | `background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)` | Dải viền Instagram ring | **Chỉ dùng để viền highlight:** Đánh dấu avatar có phiên Live/Audit mới, Logo Snapgram Admin góc trái, hoặc viền active indicator bảng tin quan trọng |

*(Cấm tuyệt đối tạo thêm các dải màu gradient biến thể khác như gradient xanh, gradient tím, hay neon glow).*

### 3.2. Base Surface Colors

#### A. Tone Sáng (Light Mode)

- `appBg`: `#e6ebf5` (Nền canvas ngoài cùng bao quanh Dashboard)
- `appCard`: `#ffffff` (Nền thẻ Container chính bo góc `rounded-[32px]` và nền các card)
- `softGray`: `#f8fafc` (Nền nav item active, input search background `#f6f7fb`)
- `border-color`: `rgba(243, 244, 246, 0.8)` (`border-gray-100/80`)
- `text-main`: `#262626` / `#111827` (`text-gray-900`)
- `text-sub`: `#8795a1` / `#9ca3af` (`text-gray-400` / `subText`)

#### B. Tone Tối Tương Thích (Dark Admin Mode)

- `appBg`: `#09090b` (`zinc-950`)
- `appCard`: `#18181b` (`zinc-900`)
- `softGray`: `#27272a` (`zinc-800`)
- `border-color`: `#27272a` (`border-zinc-800`)
- `text-main`: `#fafafa` (`zinc-50`)
- `text-sub`: `#a1a1aa` (`zinc-400`)

### 3.3. Semantic Status Tokens (Flat Badges - Tuyệt đối không dùng gradient)

- **Active / Success:** `bg-emerald-50 text-emerald-700 border-emerald-200` (Dark: `bg-emerald-950/40 text-emerald-400 border-emerald-800/50`)
- **Warning / Pending Review:** `bg-amber-50 text-amber-700 border-amber-200` (Dark: `bg-amber-950/40 text-amber-400 border-amber-800/50`)
- **Danger / Banned / Lockout:** `bg-rose-50 text-rose-700 border-rose-200` (Dark: `bg-rose-950/40 text-rose-400 border-rose-800/50`)
- **System / Info:** `bg-sky-50 text-sky-700 border-sky-200` (Dark: `bg-sky-950/40 text-sky-400 border-sky-800/50`)

---

## 4. Typography Scale & Font Rules

- **Display / Heading (≥24px):** `Playfair Display`, `serif` (chỉ dùng cho size ≥24px; không dùng cho body/label/caption/Display 2 để đảm bảo độ đọc).
- **Body / UI:** `Roboto`, `sans-serif` (toàn bộ UI text, form label, table content, button, navigation).
- **Code / ID / Mono:** `Roboto Mono`, `monospace` (User ID, UUID, Request ID, API URLs).
- **Brand Wordmark:** Font `Grand Hotel` (`font-instagram`) chỉ dùng cho đúng chữ **Snapgram** trên Logo Sidebar.
- **Nguồn & Tải font:** Tất cả từ Google Fonts. Load qua `next/font`, self-host, variable font, `display: 'swap'`. Bắt buộc cấu hình subsets: `['latin', 'vietnamese']` cho cả 3 font.
- **Ràng buộc:** CẤM dùng Emoji Icon trong toàn bộ static text title, nhãn hoặc nội dung hiển thị (dùng Lucide React icons).

| Style | Kích thước | Trọng số (Weight) | Font Family | Dùng cho |
|---|---|---|---|---|
| `Display 1` | 24px (1.5rem) | SemiBold (600) | Playfair Display | Tiêu đề trang, Header Dashboard chính |
| `Display 2` | 20px (1.25rem) | SemiBold (600) | Roboto | Tiêu đề Card, Tên bảng dữ liệu (không dùng Playfair ở 20px vì khó đọc) |
| `Stat Number` | 28px - 32px | Bold (700) | Playfair Display | Chỉ số chính trên Metric Card |
| `Body` | 14px (0.875rem) | Regular (400) | Roboto | Nội dung bảng, Form label, đoạn văn, dropdown item |
| `Caption` | 12px (0.75rem) | Medium (500) | Roboto | Badge, timestamp, helper text |
| `Code/ID` | 12px (0.75rem) | Regular (Mono) | Roboto Mono | User ID (UUID), request ID, API URLs |

---

## 5. UI Components Specification (shadcn/ui Based)

### 5.1. Admin Profile Widget (Góc Sidebar)

- Avatar bo tròn viền ring mảnh (`p-[3px] rounded-full border-2 border-slate-200/90`).
- Tên Admin hiển thị to rõ (`text-[17px] font-bold text-gray-900`), bên dưới là `@username` và Role badge (`Admin` / `Moderator`).
- Khối 3 cột thống kê nhỏ (`border-y border-gray-100 py-2.5 px-3`): Phản ánh chỉ số cá nhân (vd: Số ticket đã duyệt, Số user đã ban, Ca trực).

### 5.2. Search Bar Header

- Input pill bo tròn: `w-full bg-[#f6f7fb] text-sm text-gray-700 pl-11 pr-4 py-2.5 rounded-full border border-transparent focus:border-slate-300 focus:bg-white outline-none transition`.
- Icon Search: Vector icon từ Lucide React (`Search`), không dùng emoji.

### 5.3. Primary Action Button

- Nút CTA duy nhất được dùng gradient:
  `flex items-center gap-2 bg-gradient-to-r from-[#ff6a00] to-[#ee0979] text-white px-5 py-2.5 rounded-full font-medium text-xs sm:text-sm shadow-[0_8px_20px_-3px_rgba(247,119,55,0.45)] hover:opacity-95 active:scale-95 transition-all`.

### 5.4. Story/Live Highlights Ring

- Vòng tròn đánh dấu phiên tin hoặc hoạt động nổi bật sử dụng:
  `.insta-ring { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }`.

### 5.5. Data Table & Destructive Action Modal (shadcn/ui)

- Cài đặt qua lệnh: `pnpm dlx shadcn@latest add table dialog dropdown-menu badge`.
- Nền phẳng hoàn toàn, viền hairline tinh gọn, nút hủy diệt (Ban/Delete) dùng `rose-600` solid (không gradient).
