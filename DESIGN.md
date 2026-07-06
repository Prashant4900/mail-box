# Application Design System

This document outlines the core design language, principles, and component specifications for the Mailbox platform. It serves as the single source of truth for both designers and developers to ensure UI/UX consistency across the application.

Stack: Next.js, Tailwind CSS, shadcn/ui, hugeicons-react.

Reference feel: **Linear's** restraint and contrast, **Notion's** neutral warmth, **Gmail's** density and row interactions. Mostly grayscale UI with a single accent color used sparingly — not a "colorful" product.

---

## 1. Design Principles

1. **Neutral first, color as signal.** The interface is gray/white/black by default. Color is reserved for the accent (primary actions, active states) and semantic states (success/warning/error). If most of the screen is colored, something's wrong.
2. **Clarity over cleverness.** High data density, but never cluttered — driven by spacing and hierarchy, not borders and boxes.
3. **Accessible by default.** High contrast, keyboard navigability, screen-reader support are non-negotiable.
4. **Quiet motion.** Micro-interactions only (150–200ms), never blocking, never bouncy.

---

## 2. Core Typography

**Geist Sans** + **Geist Mono**, via `next/font/google`.

| Token | Size             | Weight | Line Height | Use                                |
| ----- | ---------------- | ------ | ----------- | ---------------------------------- |
| H1    | 1.5rem (24px)    | 600    | 1.3         | Page title (e.g. "Inbox")          |
| H2    | 1.125rem (18px)  | 600    | 1.4         | Section/panel header               |
| H3    | 0.9375rem (15px) | 600    | 1.4         | Card/list group header             |
| Body  | 0.875rem (14px)  | 400    | 1.55        | Default body text                  |
| Small | 0.8125rem (13px) | 400    | 1.4         | Metadata, timestamps, sender names |
| Micro | 0.6875rem (11px) | 500    | 1.3         | Badges, counts                     |

Notion/Linear both run smaller and tighter than typical marketing-site type scales — 14px body, not 16px. It reads as "tool," not "blog."

---

## 3. Color Palette

Grayscale-driven, single accent. CSS variables for shadcn's `hsl(var(--token))` pattern, dark mode via `.dark` class.

### Neutrals — the backbone of the UI

| Token                             | Light     | Dark      |
| --------------------------------- | --------- | --------- |
| `background`                      | `#FFFFFF` | `#191919` |
| `surface` (sidebar, hover panels) | `#F7F7F5` | `#202020` |
| `surface-hover`                   | `#EEEEEC` | `#2A2A2A` |
| `border`                          | `#EBEBEA` | `#2F2F2F` |
| `border-strong`                   | `#D9D9D6` | `#404040` |
| `text-primary`                    | `#1A1A1A` | `#EDEDED` |
| `text-secondary`                  | `#5E5E5C` | `#B0B0AE` |
| `text-muted`                      | `#9B9B98` | `#6F6F6D` |

These are Notion's actual neutrals (warm off-whites/off-blacks, not pure `#000`/`#FFF`/clinical gray) — less harsh on the eyes for an app people stare at all day.

### Accent (Primary)

Monochrome accent, matching Notion's minimalist feel. Primary buttons, active nav items, selected rows, links, and focus rings use the primary text shade as their accent.

| Token                                       | Light     | Dark      | Use                                  |
| ------------------------------------------- | --------- | --------- | ------------------------------------ |
| `accent`                                    | `#1A1A1A` | `#EDEDED` | Primary actions, text, focus rings   |
| `accent-hover`                              | `#2E2E2E` | `#E0E0E0` | Hover states on primary elements     |
| `accent-subtle` (active row/tab background) | `#EEEEEC` | `#2F2F2F` | Active menu links, row selections    |

### Semantic (status only — never decorative)

| Token                          | Light             | Dark      | Use                          |
| ------------------------------ | ----------------- | --------- | ---------------------------- |
| `success`                      | `#1A7F37`         | `#3FB950` | Sent, connected              |
| `warning`                      | `#9A6700`         | `#D29922` | Draft, pending, rate-limited |
| `destructive`                  | `#CF222E`         | `#F85149` | Failed, delete               |
| `*-subtle` (badge backgrounds) | 10% tint of above | 15% tint  | Badges, inline alerts        |

Desaturated/muted versions of red-green-yellow on purpose — Linear and Notion both avoid pure stoplight colors so status colors don't fight with the accent.

---

## 4. Spacing & Layout

8px grid.

- **Scale:** `xs:4px` `sm:8px` `md:16px` `lg:24px` `xl:32px` `2xl:48px`

### Mailbox layout

- **Sidebar:** 232px fixed, collapses to a 56px icon rail below `lg` breakpoint.
- **Message list:** 360px default, resizable, min 280px.
- **Reading pane:** fills remaining space; becomes full-screen overlay on tablet/mobile.
- Row height: 52px comfortable / 40px compact (user toggle, Gmail-style).
- No global max-width on the inbox view — three-pane layouts need the full viewport. Reserve `1280px` max-width for settings pages, and a centered `360px` max-width container for authentication pages (Notion-style).

---

## 5. Component Guidelines

### Buttons (shadcn `Button`)

- **Primary:** `bg-accent` → `hover:bg-accent-hover`, white text. One per screen, max two.
- **Secondary:** `border border-border-strong bg-background`, `text-primary`, `hover:bg-surface-hover`.
- **Ghost:** transparent, `hover:bg-surface-hover` — default for toolbar/row icon actions (this is most buttons in a mailbox).
- **Destructive:** `bg-destructive` white text, confirmation-gated only.
- Focus: `focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-background`.

### Forms & Inputs

- `border border-border bg-background`, `focus:border-accent focus:ring-1 ring-accent`.
- Labels mandatory (`sr-only` allowed, placeholder is never a label).
- Error: `border-destructive`, helper text in `text-destructive` below field.

### Message List (the core surface)

- Row hover: `hover:bg-surface-hover`, `transition-colors duration-150`.
- Unread: `font-semibold text-text-primary` + small `accent` dot before subject.
- Read: `font-normal text-text-secondary`.
- Selected/active row: `bg-accent-subtle`, no border-shift (avoids layout jump on select).
- Row actions (archive/delete/snooze) render on hover, right-aligned, ghost buttons only — list stays clean by default.
- Dense rows, generous horizontal padding (`px-4`), thin or no row dividers — let whitespace and hover state do the separation, not `border-b` on every row (this is the single biggest thing that makes a list look "Gmail 2010" vs "Linear 2024").

### Badges/Labels

- Pill, `text-micro font-medium`, `px-2 py-0.5 rounded-full`, background = `*-subtle`, text = full-strength semantic/accent token.

### Authentication Flow (Notion-Style)

The authentication views (Login, Registration, Setup, Password Reset) reject typical card-based borders and container boxes to mimic Notion's minimal, cardless aesthetic.

- **Layout Structure**:
  - Vertical stack centered on page background.
  - Strict max-width container of `360px` with responsive gutters.
  - Large, high-contrast typography, clear labels, and compact vertical spacing.
- **Fields & Controls**:
  - Inputs use standard thin boundaries (`border border-border bg-background`) with sharp focus states (`focus:border-text-primary`) rather than bright primary rings.
  - Submit buttons are flat, full-width blocks styled either in primary brand color (`bg-accent`) or high-contrast dark style.
- **Form States**:
  - Success/Error alerts use subtle background tints (`success/5`, `destructive/5`) with matching hairline borders, rather than heavy status banners.
  - Form transitions are quiet (using `animate-in fade-in duration-300`).

---

## 6. Icons

- **Library:** `hugeicons-react`, stroke weight `1.5px` everywhere.
- **Sizes:** `16px` inline · `20px` buttons/toolbar · `24px` nav/empty states.
- Default color `text-text-secondary`; active/selected `text-accent`.
- Re-export from `src/components/icons/index.ts`.

---

## 7. Dark Mode

Class-based (`.dark` on `<html>`), shadcn default. Every token above has a dark value — no component should ever hardcode a hex. Dark background is `#191919`, not pure black — same reasoning as the light-mode off-white: pure black/white creates more eye strain and halation around text at this density.

### Styling Enforcement & Variable Usage

To ensure visual consistency and seamless theme toggling across light and dark modes:
- **No Hardcoded Styles**: Inline styles and hardcoded hex/HSL colors are strictly prohibited within application code and component TSX files.
- **CSS-First Theme Variables**: All styling rules, custom colors, sizing tokens, and theme-dependent designs must be declared as variables in CSS stylesheets (e.g., `globals.css`) and referenced strictly via utility classes.

---

## 8. Responsive Behavior

Breakpoints follow Tailwind defaults — don't invent custom ones unless a real layout need shows up.

| Breakpoint    | Width    | Layout                                                                                                |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| Base (mobile) | < 640px  | Single pane. Sidebar and message list are hidden behind navigation; reading pane is the default view. |
| `sm`          | ≥ 640px  | Still single pane, more breathing room (padding, touch targets).                                      |
| `md`          | ≥ 768px  | Two-pane: message list + reading pane. Sidebar becomes a slide-over drawer.                           |
| `lg`          | ≥ 1024px | Full three-pane: sidebar (icon rail) + message list + reading pane.                                   |
| `xl`          | ≥ 1280px | Sidebar expands to full width (icons + labels). Message list can widen slightly.                      |

### Mobile-specific rules

- Bottom nav bar (Inbox, Search, Compose, Folders) replaces the sidebar entirely below `md` — don't try to cram the desktop sidebar into a drawer as the primary nav, it's a different pattern at this size.
- Compose opens full-screen, not a modal — modals on small viewports just become bad full screens anyway, so skip the in-between state.
- Row height stays at "comfortable" (52px) on mobile regardless of the desktop density setting — compact rows don't work as tap targets.
- Swipe gestures (archive/delete) are the primary row actions on touch; hover-revealed icon actions don't apply since there's no hover.
- Minimum tap target: 40x40px, even where the visual icon is 20px.

### Tablet

- Treat tablet width same as `md` (two-pane) regardless of touch vs pointer input — don't branch logic on device type, branch on viewport width and pointer capability (`@media (hover: hover)`) separately.

---

## 9. PWA Support

Goal: installable, works offline for reading cached mail, feels native on mobile home screens.

### Manifest (`app/manifest.ts` in Next.js)

- `name`: full product name. `short_name`: under 12 chars for home screen label.
- `display`: `standalone` (no browser chrome).
- `theme_color`: `#FFFFFF` light / `#191919` dark — matches `background` token, set both via `media` query in the manifest or a `<meta name="theme-color">` pair in `<head>` with `media="(prefers-color-scheme: dark)"`.
- `background_color`: same as `theme_color`, used for the splash screen.
- Icons: `192x192` and `512x512` minimum, plus a `maskable` variant (safe-zone padding so Android doesn't crop it) — generate from a single square logo source.
- `start_url`: `/inbox` (or whatever the default authenticated view is), not `/`.

### Service Worker

- Use `next-pwa` or Workbox directly — don't hand-roll cache logic unless there's a specific reason to.
- Cache strategy:
  - App shell (JS/CSS/fonts): `StaleWhileRevalidate` — instant load, updates in background.
  - Message list/content API calls: `NetworkFirst` with a short timeout fallback to cache — mail should feel live, but degrade gracefully offline.
  - Images/attachments: `CacheFirst` with an expiration cap (don't let attachment cache grow unbounded).
- Show a persistent but small "offline" indicator (not a blocking banner) when `navigator.onLine` is false — surfaced in the top bar, using the `warning` token, not `destructive` (offline isn't an error state).

### Install Prompt

- Don't auto-trigger the native install prompt on load. Capture `beforeinstallprompt`, show your own small UI cue (e.g. an icon-button in the sidebar or a dismissible row) after the user has sent or read a few emails — install prompts on first visit get ignored or dismissed and rarely come back.
- On iOS Safari, there's no `beforeinstallprompt` — show a one-time custom instruction sheet ("Add to Home Screen via Share menu") instead, dismissible and not repeated per session.

### Other PWA touches

- `apple-touch-icon` in addition to manifest icons — iOS ignores the manifest for the home screen icon.
- Respect `safe-area-inset-*` (notch/home-indicator) in the bottom nav and compose full-screen view via `env(safe-area-inset-bottom)` padding.
- Push notifications (new mail) are a separate, larger feature (needs a backend + permission UX) — flagging it here as in-scope for "feels native" but not part of this design doc's component specs.
