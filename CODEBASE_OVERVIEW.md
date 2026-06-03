# Codebase Overview — react-emails2

> Generated analysis of the React Email + Next.js project.  
> Last reviewed: June 1, 2026

---

## 1. Executive Summary

**react-emails2** is a **code-first email template system** built with [React Email](https://react.email/), [Next.js 14 (App Router)](https://nextjs.org/), and TypeScript. It is **not** a visual drag-and-drop builder. Instead, developers compose emails by:

1. Writing reusable **section components** in `src/components/email/`
2. Assembling full **email templates** in `src/emails/`
3. **Manually registering** templates in the API route and homepage
4. Previewing rendered HTML via Next.js (`/preview/[template]`) or the React Email CLI (`npm run email:dev`)

The project appears to be part of the broader **handlebar-accelerator** monorepo, migrating Handlebars-style email layouts to React Email components (see README "Converting from Handlebars" section).

---

## 2. Dependencies

### Runtime (`package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^14.2.0 | Web framework — App Router, API routes, preview UI |
| `react` / `react-dom` | ^18.2.0 | UI rendering |
| `@react-email/components` | 0.0.31 | Email-safe primitives (`Html`, `Body`, `Img`, `Link`, etc.) |
| `@react-email/render` | ^1.0.4 | Server-side React → HTML string conversion |
| `react-email` | ^3.0.4 | CLI for dev preview (`email dev`) and static export (`email export`) |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` ^5.3.0 | Type checking |
| `@types/node`, `@types/react`, `@types/react-dom` | Type definitions |

### Not Present

- No state management libraries (Redux, Zustand, Jotai, etc.)
- No testing frameworks (Jest, Vitest, Playwright)
- No UI component libraries (Tailwind, MUI, shadcn)
- No lint config file in repo root (only `npm run lint` script)
- No custom hooks, services, or utilities folders

---

## 3. Project Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App (port 3000)                      │
├─────────────────────────────────────────────────────────────────┤
│  src/app/page.tsx          → Template catalog (homepage)         │
│  src/app/preview/[template] → Client iframe preview              │
│  src/app/api/email/[template] → HTML render API (server)         │
└───────────────────────────────┬─────────────────────────────────┘
                                │ fetch /api/email/:slug
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              @react-email/render (server-side)                   │
│  render(<EmailTemplate />) → HTML string                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/emails/*.tsx          Full email documents                  │
│    └─ compose src/components/email/* section blocks              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  React Email CLI (port 3001) — optional, separate preview        │
│  npm run email:dev  →  scans src/emails/                         │
│  npm run email:export → out/emails/*.html                        │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Separation

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **App shell** | `src/app/` | Next.js pages, layout, global CSS, API |
| **Email sections** | `src/components/email/` | Reusable, prop-driven email blocks |
| **Email templates** | `src/emails/` | Complete emails (`Html`, `Body`, composition) |
| **Static assets** | `public/images/` | Nissan vehicle images, logos, banners |
| **Build output** | `.next/`, `out/emails/` | Generated (not source) |

### Data Flow

1. **User visits homepage** (`/`) → static list of template links from hardcoded `emailTemplates` array
2. **User clicks preview** → navigates to `/preview/[template]`
3. **Preview page** (client component) → `fetch('/api/email/[template]')`
4. **API route** (server) → looks up template in `templates` registry → calls `render(EmailComponent({}))` → returns `{ html }`
5. **Preview page** → injects HTML into `<iframe srcDoc={html}>` with desktop/mobile width toggle
6. **Alternative path**: `npm run email:dev` serves `src/emails/` directly via React Email's built-in preview (no Next.js involved)

There is **no dynamic data binding**, **no CMS**, and **no runtime props** passed to templates via the API — all content is hardcoded in TSX files at build time.

---

## 4. How the "Template Builder" Works

> **Important:** This project does not implement a WYSIWYG or drag-and-drop builder. The "builder" is the **developer workflow** for composing emails in code.

### Composition Model

Emails are built like LEGO blocks:

```
Email Template (src/emails/NissanEmail.tsx)
├── @react-email/components shell (Html, Head, Body, Container, Preview)
├── Inline <table> sections (headers, banners, section titles, CTAs)
└── Reusable components from @/components/email
    ├── IntroCopy
    ├── TwoColDualCta
    ├── TwoColStacked
    ├── ThreeColIcon
    ├── PromoBlock
    ├── OrderCard
    ├── OneColProduct
    └── Footer
```

### Two Preview Systems

| System | Command | URL | What it previews |
|--------|---------|-----|------------------|
| **Next.js preview** | `npm run dev` | `http://localhost:3000/preview/[slug]` | Registered templates only; uses API render + iframe |
| **React Email CLI** | `npm run email:dev` | `http://localhost:3001` | All files in `src/emails/`; native React Email dev UI |

### HTML Export

| Method | Command / Code | Output |
|--------|----------------|--------|
| CLI export | `npm run email:export` | Static HTML in `out/emails/` |
| Programmatic | `render(<MyEmail />)` from `@react-email/render` | HTML string |
| API | `GET /api/email/[template]` | JSON `{ html: "..." }` |

---

## 5. Component Responsible for Rendering Email Templates

Rendering happens in **two stages**:

### Stage 1 — Template composition (React components)

Each file in `src/emails/` is a React functional component that returns the full email document tree. Example entry points:

- `NissanEmail.tsx`
- `AllComponentsEmail.tsx`
- `CompleteEmail.tsx`
- `TwoColDualCtaEmail.tsx`
- `TwoColStackedEmail.tsx`

These use `@react-email/components` for the document shell and `@/components/email` for sections.

### Stage 2 — HTML conversion (server)

**Primary render entry point:** `src/app/api/email/[template]/route.ts`

```typescript
const html = await render(EmailComponent({}));
return NextResponse.json({ html });
```

This is the **authoritative server-side renderer** used by the Next.js preview UI.

### Stage 3 — Display (client)

**Preview display:** `src/app/preview/[template]/page.tsx`

Fetches HTML from the API and displays it in an `<iframe srcDoc={html}>`. This component does **not** render React Email components directly — it only displays pre-rendered HTML.

---

## 6. Inventory: Components, Utilities, Hooks, Services, State

### Email Section Components (`src/components/email/`)

| Component | File | Description |
|-----------|------|-------------|
| `TwoColDualCta` | `TwoColDualCta.tsx` | Two-column product cards with dual CTAs (outlined + filled). Internal `ProductCard` sub-component. |
| `TwoColStacked` | `TwoColStacked.tsx` | Two-column stacked products with image, title, price, single CTA. Supports single-image row mode. |
| `IntroCopy` | `IntroCopy.tsx` | Greeting + body text section with HTML support via `dangerouslySetInnerHTML`. |
| `Footer` | `Footer.tsx` | Full footer: logo, social icons, legal text, preference/unsubscribe/privacy links, address, phone, copyright. |
| `OrderCard` | `OrderCard.tsx` | Dark card with label/value rows (order/enquiry details). |
| `PromoBlock` | `PromoBlock.tsx` | Promotional banner: image, title, subtitle, CTA button. |
| `OneColProduct` | `OneColProduct.tsx` | Single-column featured product with image, copy, price, CTA. |
| `ThreeColIcon` | `ThreeColIcon.tsx` | Three-column icon + text feature grid. Internal `IconColumn` sub-component. |

**Barrel export:** `src/components/email/index.ts` re-exports all components and their TypeScript prop types.

### Email Templates (`src/emails/`)

| Template | Slug (API/preview) | Purpose |
|----------|-------------------|---------|
| `NissanEmail.tsx` | `nissan` | Featured Nissan MORE campaign email |
| `AllComponentsEmail.tsx` | `all-components` | Showcase of all 8 section components |
| `CompleteEmail.tsx` | `complete-email` | Header, intro, products, footer |
| `TwoColDualCtaEmail.tsx` | `two-col-dual-cta` | Dual CTA layout demo |
| `TwoColStackedEmail.tsx` | `two-col-stacked` | Stacked product layout demo |

### Next.js App Components/Pages (`src/app/`)

| File | Type | Description |
|------|------|-------------|
| `page.tsx` | Server page | Homepage — template catalog + component list |
| `layout.tsx` | Root layout | HTML shell, metadata, imports `globals.css` |
| `preview/[template]/page.tsx` | Client page | Email preview with desktop/mobile toggle |
| `api/email/[template]/route.ts` | API route | Template registry + HTML rendering |
| `globals.css` | Styles | Dark theme CSS variables for Next.js UI only (not emails) |

### Utilities

**None.** No `src/utils/`, `src/lib/`, or shared helper modules exist. Logic is colocated inside each component file.

### Custom Hooks

**None**, except React built-ins used in the preview page:

- `useParams()` — read template slug from URL
- `useState()` — html, loading, error, viewMode
- `useEffect()` — fetch rendered HTML on mount

### Services

**None.** No API clients, no email delivery service (SendGrid, SES, etc.), no database layer.

### State Management

**None globally.** All state is local to `PreviewPage`:

| State | Type | Purpose |
|-------|------|---------|
| `html` | `string` | Rendered email HTML from API |
| `loading` | `boolean` | Fetch in progress |
| `error` | `string \| null` | Fetch/render failure message |
| `viewMode` | `'desktop' \| 'mobile'` | Preview iframe width |

Homepage template and component lists are **static constants** in `page.tsx`.

---

## 7. Creating, Registering, and Displaying New Components/Templates

### Adding a New Section Component

1. **Create** `src/components/email/MyComponent.tsx` following existing patterns:
   - Section comment blocks (`// TYPES`, `// STYLES`, `// MAIN COMPONENT`)
   - Export typed props interface
   - Use `<table role="presentation">` layout at 600px width
   - Default styles object + optional `styles` prop override
   - Named + default export

2. **Register** in `src/components/email/index.ts`:
   ```typescript
   export { MyComponent } from './MyComponent';
   export type { MyComponentProps } from './MyComponent';
   ```

3. **Use** in any email template:
   ```tsx
   import { MyComponent } from '@/components/email';
   ```

4. **Display on homepage** (optional): Add entry to the `components` array in `src/app/page.tsx`

> Section components are **not** auto-discovered. Homepage listing is manual.

### Adding a New Email Template

1. **Create** `src/emails/MyNewEmail.tsx`:
   ```tsx
   import { Html, Head, Body, Container, Preview } from '@react-email/components';
   import { IntroCopy, Footer } from '@/components/email';

   export const MyNewEmail: React.FC = () => ( /* ... */ );
   export default MyNewEmail;
   ```

2. **Register in API route** — `src/app/api/email/[template]/route.ts`:
   ```typescript
   import MyNewEmail from '@/emails/MyNewEmail';

   const templates: Record<string, React.FC> = {
     'my-new-email': MyNewEmail,
     // ...
   };
   ```

3. **Add to homepage** — `src/app/page.tsx`:
   ```typescript
   const emailTemplates = [
     { name: 'My New Email', description: '...', path: '/preview/my-new-email' },
   ];
   ```

4. **Add display name** (optional) — `src/app/preview/[template]/page.tsx`:
   ```typescript
   const templateNames: Record<string, string> = {
     'my-new-email': 'My New Email',
   };
   ```

5. **React Email CLI** auto-discovers any file in `src/emails/` — no extra registration needed for `email:dev` / `email:export`.

### Registration Touchpoints Summary

| What | Files to update |
|------|-----------------|
| New section component | `components/email/MyComponent.tsx`, `components/email/index.ts`, optionally `app/page.tsx` |
| New email template | `emails/MyEmail.tsx`, `api/email/[template]/route.ts`, `app/page.tsx`, optionally `preview/[template]/page.tsx` |

---

## 8. Folder Structure

```
react-emails2/
├── public/
│   └── images/
│       ├── README.md              # Image asset mapping documentation
│       └── *.png, *.jpg           # Nissan logos, vehicles, banners (git may omit binaries)
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/
│   │   │   └── email/
│   │   │       └── [template]/
│   │   │           └── route.ts   # Template registry + HTML render API
│   │   ├── preview/
│   │   │   └── [template]/
│   │   │       └── page.tsx       # Client-side iframe preview UI
│   │   ├── globals.css            # Dark theme for Next.js shell (not emails)
│   │   ├── layout.tsx             # Root layout + metadata
│   │   └── page.tsx               # Homepage template catalog
│   │
│   ├── components/
│   │   └── email/                 # Reusable email section components (8 total)
│   │       ├── index.ts           # Barrel exports
│   │       ├── TwoColDualCta.tsx
│   │       ├── TwoColStacked.tsx
│   │       ├── IntroCopy.tsx
│   │       ├── Footer.tsx
│   │       ├── OrderCard.tsx
│   │       ├── PromoBlock.tsx
│   │       ├── OneColProduct.tsx
│   │       └── ThreeColIcon.tsx
│   │
│   └── emails/                    # Complete email template documents (5 total)
│       ├── NissanEmail.tsx
│       ├── AllComponentsEmail.tsx
│       ├── CompleteEmail.tsx
│       ├── TwoColDualCtaEmail.tsx
│       └── TwoColStackedEmail.tsx
│
├── .next/                         # Next.js build output (generated)
├── node_modules/                  # Dependencies (generated)
│
├── next.config.js                 # External packages config for React Email
├── next-env.d.ts                  # Next.js TypeScript declarations
├── tsconfig.json                  # TypeScript config (@/* path alias)
├── package.json                   # Scripts and dependencies
├── package-lock.json
├── README.md                      # User-facing documentation
└── CODEBASE_OVERVIEW.md           # This file
```

---

## 9. Coding Patterns, Conventions, and Abstractions

### Email Component Pattern

Every section component follows a consistent structure:

```
1. imports (react, @react-email/components)
2. // TYPES — exported interfaces with JSDoc on props
3. // STYLES — defaultStyles constant (React.CSSProperties)
4. // SUB-COMPONENTS (optional, file-private)
5. // MAIN COMPONENT — exported React.FC
6. export default ComponentName
```

### Layout Conventions

- **600px fixed width** — all section `<table>` elements use `width={600}` for email client compatibility
- **Table-based layout** — nested `<table role="presentation">` with `<tr>`/`<td>`; float-based two-column cards in `TwoColDualCta`
- **Inline styles only** — no CSS classes in email components; styles passed as objects
- **System font stack** — `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`

### Styling Override Pattern

Components accept a `styles?: { ... }` prop that merges over `defaultStyles`:

```typescript
style={{ ...defaultStyles.title, ...styles.title }}
```

Individual item props can also carry inline style overrides (e.g., `greetingStyle`, `bodyStyle`, `valueStyle`).

### HTML Content Pattern

Rich text uses `dangerouslySetInnerHTML` for fields that support HTML markup (greeting, body, legal text, icon text, order values).

### TypeScript Conventions

- Strict mode enabled (`"strict": true`)
- Path alias: `@/*` → `./src/*`
- Props interfaces exported alongside components from `index.ts`
- Both named and default exports on components

### React Email Integration

- `next.config.js` marks `@react-email/components` and `@react-email/render` as `serverComponentsExternalPackages`
- Templates wrap content in `<Html>`, `<Head>`, `<Body>`, `<Container>`, `<Preview>`
- Images use `<Img>`, links use `<Link>` from `@react-email/components`

### Next.js UI Conventions

- Homepage and preview use **inline styles** (not CSS modules or Tailwind)
- Dark theme via CSS custom properties in `globals.css` (`--bg-primary`, `--accent`, etc.)
- Preview page is `'use client'`; homepage and API route are server components/routes

### Content Constants Pattern

Email templates define local constants for repeated values:

```typescript
const IMAGES = { logo: '/images/...', qashqai: '/images/...' };
const COLORS = { black: '#000000', red: '#c3002f', ... };
```

### Handlebars Migration Context

The README documents a mapping from Handlebars to React Email patterns, indicating these components were likely ported from Handlebars partials in the parent **handlebar-accelerator** project:

| Handlebars | React Email |
|------------|-------------|
| `{{#if var}}` | `{var && ...}` |
| `{{#each arr}}` | `{arr.map(...)}` |
| `{{{html}}}` | `dangerouslySetInnerHTML` or JSX |
| `{{var}}` | `{props.var}` |

---

## 10. Registered Templates Reference

| Slug | Component | Homepage | API | Preview Name |
|------|-----------|----------|-----|--------------|
| `nissan` | `NissanEmail` | ✅ | ✅ | ✅ |
| `all-components` | `AllComponentsEmail` | ✅ | ✅ | ✅ |
| `complete-email` | `CompleteEmail` | ✅ | ✅ | ✅ |
| `two-col-dual-cta` | `TwoColDualCtaEmail` | ✅ | ✅ | ✅ |
| `two-col-stacked` | `TwoColStackedEmail` | ✅ | ✅ | ✅ |

---

## 11. Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Next.js on port 3000 |
| Production build | `npm run build` | Next.js production build |
| Production start | `npm run start` | Serve production build |
| Lint | `npm run lint` | Next.js ESLint |
| Email dev | `npm run email:dev` | React Email preview on port 3001, dir `src/emails` |
| Email export | `npm run email:export` | Export HTML to `out/emails/` |

---

## 12. Known Gaps and Observations

1. **No visual builder** — composition is entirely code-based; "builder" in user terms means the developer workflow.
2. **Manual registration** — templates must be added in 2–3 places; no central registry or auto-discovery for Next.js preview.
3. **No runtime props** — API renders templates with empty props `EmailComponent({})`; all content is static in source.
4. **No tests** — no unit or integration tests present.
5. **No email delivery** — renders HTML only; no SMTP/provider integration.
6. **Image paths** — templates use relative `/images/...` paths; production requires absolute CDN URLs (documented in `public/images/README.md`).
7. **Homepage component list** — informational only; components are not individually previewable from the UI.
8. **`PromoBlock` unused in `NissanEmail`** — Nissan template uses inline `<table>` + `<Img>` for banner instead of `PromoBlock` component.
9. **Commented debug code** — `TwoColDualCta.tsx` contains commented-out gutter spacer markup.

---

## 13. Key Files Quick Reference

| Concern | File |
|---------|------|
| Render email → HTML | `src/app/api/email/[template]/route.ts` |
| Display rendered email | `src/app/preview/[template]/page.tsx` |
| Template catalog UI | `src/app/page.tsx` |
| Reusable email blocks | `src/components/email/` |
| Full email documents | `src/emails/` |
| React Email CLI config | `package.json` scripts (`--dir src/emails`) |
| Next.js + React Email compat | `next.config.js` |
| Path aliases | `tsconfig.json` (`@/*`) |

---

*End of codebase overview. Awaiting further instructions before making code changes.*
