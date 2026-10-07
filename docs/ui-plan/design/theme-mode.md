# Theme Mode & Dark/Light System Architecture — Snapgram Admin Portal

## 1. Context & Self-Contained Scope

Tài liệu này xác lập quy chuẩn kỹ thuật độc lập (self-contained) cho hệ thống chuyển đổi chủ đề (Theme Mode) của **Snapgram Admin Portal**: 3 chế độ hiển thị (Light / Dark / System), cơ chế chống nhấp nháy màu khi tải trang (Anti-FOUC), component `ThemeToggle`, và ràng buộc CSS variables bắt buộc. Tài liệu gắn kết trực tiếp với:

- [design-system.md](design-system.md): Bảng màu Light/Dark, semantic tokens (`--background`, `--foreground`,...).
- [../absolute-rules.md](../absolute-rules.md): Rule 5 — Theme Mode không hardcode màu; Rule 1 — cấm emoji (dùng Lucide).
- [../architect/conventions.md](../architect/conventions.md): Quy chuẩn UI & styling (mục 4).
- [../delivery/bootstrap-commands.md](../delivery/bootstrap-commands.md): Sprint 1.2 — cài `next-themes` bằng CLI.

> **RÀNG BUỘC TỐI THƯỢNG:** Toàn bộ màu sắc trong code PHẢI lấy từ CSS variable (semantic token). Nghiêm cấm hardcode màu (`bg-white`, `text-black`, `bg-gray-100`,...) ngoài định nghĩa token.

---

## 2. Ba Chế Độ Hiển Thị (3 Modes Requirement)

| Mode | Ý nghĩa | Hành vi |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| **Light** | Chế độ sáng | `<html class="">` — không có class `dark`. Canvas sáng, card trắng. |
| **Dark** | Chế độ tối | `<html class="dark">` — thêm class `dark` vào thẻ html. Canvas tối `#09090b`. |
| **System** | Theo cài đặt HĐH (mặc định) | Tự động khớp `prefers-color-scheme` của hệ điều hành; đổi realtime khi user đổi OS theme. |

- **Mặc định:** `defaultTheme="system"`.
- **Lưu trữ lựa chọn:** `localStorage` dưới khóa `theme` (`storageKey="theme"`).
- Trạng thái theme **KHÔNG** đưa vào Zustand — do `next-themes` quản lý riêng, tránh xung đột hydration.

---

## 3. Thư Viện Bắt Buộc: next-themes

Cài đặt qua CLI chính quy (xem [bootstrap-commands.md](../delivery/bootstrap-commands.md) Sprint 1.2):

```bash
pnpm add next-themes
```

**CẤM** tự implement cơ chế theme bằng tay (tự viết `useEffect` toggle class, tự quản lý `localStorage`). Bắt buộc dùng `next-themes`.

### 3.1. ThemeProvider (Root Layout)

Bọc toàn bộ app trong `src/app/layout.tsx`:

```tsx
// src/components/providers/theme-provider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

```tsx
// src/app/layout.tsx (rút gọn)
import { ThemeProvider } from '@/components/providers/theme-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={true}
          storageKey="theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Ràng buộc cấu hình bắt buộc:**

| Prop | Giá trị | Lý do |
| -------------------------- | --------- | ----------------------------------------------------------------------- |
| `attribute` | `"class"` | Áp class `dark` lên `<html>`, khớp với Tailwind `darkMode: 'class'`. |
| `defaultTheme` | `"system"` | Trải nghiệm mặc định theo HĐH. |
| `enableSystem` | `true` | Bật chế độ System. |
| `disableTransitionOnChange` | `true` | Tắt transition CSS khi đổi theme — tránh hiệu ứng "nhòe màu" toàn trang. |
| `storageKey` | `"theme"` | Khóa localStorage. |

### 3.2. Component ThemeToggle

Đặt tại `src/components/layout/theme-toggle.tsx`, dùng `DropdownMenu` (shadcn) + icon **Lucide** (`Sun`, `Moon`, `Monitor`). **CẤM dùng emoji.**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('theme');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('toggle')}>
          {mounted ? <Icon className="size-5" /> : <Monitor className="size-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="size-4" /> {t('light')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="size-4" /> {t('dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="size-4" /> {t('system')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Ràng buộc:**
- Icon kích thước theo chuẩn Tailwind v4: `size-4` (trong dropdown item), `size-5` (trigger).
- Nút trigger bắt buộc có `aria-label={t('theme.toggle')}` cho screen reader.
- Guard `mounted` để tránh hydration mismatch (server không biết theme của client).

---

## 4. Giao Thức Chống Nhấp Nháy Màu (Anti-FOUC Protocol)

Nhấp nháy màu trắng (FOUC - Flash Of Unstyled Content) xảy ra khi server render HTML trước khi client biết theme đã lưu. Bắt buộc xử lý:

1. **`suppressHydrationWarning`:** Thẻ `<html>` bắt buộc có `suppressHydrationWarning` vì `next-themes` inject script đổi class trước khi React hydrate.
2. **Inline Script Injection (tự động):** `next-themes` tự chèn một inline `<script>` vào `<head>` chạy **trước khi paint**, đọc `localStorage('theme')` và gán class `dark` (hoặc không gán class nào nếu là Light) lên `<html>` ngay lập tức. **KHÔNG** tự viết lại script này.
3. **Mounted Guard:** Mọi component đọc `useTheme()` để hiển thị UI phụ thuộc theme (icon, màu) PHẢI guard bằng `mounted` state để tránh lệch hydration.
4. **`disableTransitionOnChange={true}`:** Tắt transition khi đổi theme để tránh flash màu khi chuyển mode.

> **Lưu ý CSP:** Nếu dự án bật Content-Security-Policy nghiêm ngặt, cần thêm nonce/hash cho inline script của `next-themes` → TBD khi cấu hình CSP ở Phase deploy.

---

## 5. CSS Variables & Semantic Tokens

### 5.1. Nguyên tắc bắt buộc
- Mọi màu sắc component **chỉ** dùng semantic token utilities của Tailwind: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`,...
- Định nghĩa 2 bộ token trong `src/app/globals.css`: `:root` (Light) và `.dark` (Dark).

```css
/* src/app/globals.css (rút gọn minh họa) */
:root {
  --background: #e6ebf5;   /* Canvas sáng */
  --card: #ffffff;         /* Card sáng */
  --foreground: #0f172a;
  --border: #e2e8f0;
}
.dark {
  --background: #09090b;   /* Canvas tối */
  --card: #18181b;         /* Card tối */
  --foreground: #fafafa;
  --border: #27272a;
}
```

### 5.2. Điều CẤM tuyệt đối
- **CẤM** hardcode màu nền/chữ: `bg-white`, `bg-black`, `text-black`, `bg-gray-*`, `bg-zinc-*`, `text-slate-*`... tại layer component.
- **CẤM** dùng `dark:` variant thủ công khi đã có token tương ứng (`bg-card` tự đổi theo theme — không cần `bg-white dark:bg-zinc-900`).
- **Ngoại lệ:** Các bảng màu ngữ nghĩa trạng thái (status badge: `emerald`/`rose`/`amber`) được phép dùng trực tiếp nhưng phải khai báo tập trung trong design-system, không rải rác.

---

## 6. i18n Keys Bắt Buộc

Thêm vào `messages/vi.json` và `messages/en.json`:

```json
{
  "theme": {
    "toggle": "Đổi giao diện",
    "light": "Sáng",
    "dark": "Tối",
    "system": "Theo hệ thống"
  }
}
```

_(EN: `toggle`: "Toggle theme", `light`: "Light", `dark`: "Dark", `system`: "System".)_

---

## 7. Checklist Nghiệm Thu Theme

- [ ] `next-themes` cài qua `pnpm add next-themes`.
- [ ] `ThemeProvider` bọc root layout với đúng 5 props bắt buộc.
- [ ] `<html>` có `suppressHydrationWarning`.
- [ ] `ThemeToggle` dùng `DropdownMenu` + Lucide (`Sun`/`Moon`/`Monitor`), KHÔNG emoji.
- [ ] Đủ 3 mode Light/Dark/System, lưu ở `localStorage` khóa `theme`.
- [ ] Không còn class màu hardcode (`bg-white`, `text-black`,...) trong component layer.
- [ ] Đủ 4 i18n key `theme.toggle|light|dark|system` ở cả `vi.json` và `en.json`.
- [ ] Không có FOUC (kiểm tra bằng reload trang ở chế độ Dark).

---

> ⚠️ Tài liệu tạm nằm trong backend repo. Sẽ move sang FE repo khi tách.
