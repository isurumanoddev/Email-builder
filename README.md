# React Email with Next.js

A Next.js application with React Email components for creating beautiful, cross-client compatible HTML emails.

## 📚 Table of Contents

- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Components](#-components)
  - [TwoColDualCta](#twocoldualcta)
  - [TwoColStacked](#twocolstacked)
  - [IntroCopy](#introcopy)
  - [Footer](#footer)
  - [OrderCard](#ordercard)
  - [PromoBlock](#promoblock)
  - [OneColProduct](#onecolproduct)
  - [ThreeColIcon](#threecolicon)
- [Creating New Emails](#-creating-new-emails)
- [API Routes](#-api-routes)
- [Exporting HTML](#-exporting-html)
- [Best Practices](#-best-practices)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm, yarn, or pnpm

### Step-by-Step Setup

#### Step 1: Navigate to the react-emails directory

```bash
cd react-emails
```

#### Step 2: Install dependencies

```bash
npm install
```

#### Step 3: Start the Next.js development server

```bash
npm run dev
```

This starts the Next.js app at `http://localhost:3000` with:
- Homepage listing all email templates
- Preview pages for each template
- API routes for rendering emails to HTML

#### Step 4: (Optional) Start React Email preview server

```bash
npm run email:dev
```

This starts the React Email preview at `http://localhost:3001`.

#### Step 5: (Optional) Local AI for Figma → component build

The builder can map Figma frames to email components using a **free local vision model** via [Ollama](https://ollama.com):

1. Install Ollama and start it (runs on `http://localhost:11434`).
2. Pull a vision model:

```bash
ollama pull llava
```

For lower RAM, use `ollama pull moondream` and set `OLLAMA_VISION_MODEL=moondream` in `.env.local`.

3. Copy `.env.example` to `.env.local` and set:

```env
AI_PROVIDER=ollama
OLLAMA_VISION_MODEL=llava
FIGMA_ACCESS_TOKEN=your_figma_token
```

In the builder: **Fetch from Figma** → **Build from Figma** (uses Ollama + Figma API design context).

---

## 📁 Project Structure

```
react-emails/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── api/email/[template]/      # API route for rendering emails
│   │   ├── preview/[template]/        # Preview pages for each template
│   │   ├── page.tsx                   # Homepage with template list
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/email/              # Reusable email components (8 total)
│   │   ├── TwoColDualCta.tsx         # 2-col layout with dual CTAs
│   │   ├── TwoColStacked.tsx         # 2-col stacked product layout
│   │   ├── IntroCopy.tsx             # Intro text section
│   │   ├── Footer.tsx                # Full footer component
│   │   ├── OrderCard.tsx             # Order details card
│   │   ├── PromoBlock.tsx            # Promotional banner block
│   │   ├── OneColProduct.tsx         # Single column product
│   │   ├── ThreeColIcon.tsx          # 3-column icon features
│   │   └── index.ts
│   │
│   └── emails/                        # Email templates
│       ├── TwoColDualCtaEmail.tsx
│       ├── TwoColStackedEmail.tsx
│       ├── CompleteEmail.tsx
│       └── AllComponentsEmail.tsx     # Showcases all 8 components
│
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run email:dev` | Start React Email preview server (port 3001) |
| `npm run email:export` | Export all emails to static HTML files |

---

## 🧩 Components

### TwoColDualCta

A two-column layout featuring product cards with dual call-to-action buttons (outlined and filled).

```tsx
import { TwoColDualCta } from '@/components/email';

<TwoColDualCta
  backgroundColor="#f7f8f8"
  cardBorderRadius="8px"
  rows={[
    {
      product1: {
        headerTitle: 'Premium Series',
        imgSrc: 'https://placehold.co/250x180',
        title: 'Luxury Sedan',
        subtitle: 'Starting from $45,000',
        cta1Text: 'REQUEST A QUOTE',
        cta2Text: 'VIEW OFFERS',
        url: 'https://example.com/product1',
        width: 250,
      },
      product2: { /* ... */ },
    },
  ]}
/>
```

---

### TwoColStacked

A two-column stacked layout with product images, titles, prices, and CTA buttons.

```tsx
import { TwoColStacked } from '@/components/email';

<TwoColStacked
  backgroundColor="#f7f8f8"
  rows={[
    {
      product1: {
        deskImgSrc: 'https://placehold.co/250x300',
        title: 'Classic Watch',
        subtitle: 'Timeless elegance',
        price: '$299.00',
        ctaText: 'SHOP NOW',
        url: 'https://example.com/watch',
        width: 250,
      },
      product2: { /* ... */ },
    },
  ]}
/>
```

---

### IntroCopy

An introductory text section with greeting and body text.

```tsx
import { IntroCopy } from '@/components/email';

<IntroCopy
  backgroundColor="#ffffff"
  greeting="Hello John,"
  body="We're excited to share our latest updates with you."
  textAlign="left"
  greetingStyle={{ fontSize: '18px', fontWeight: 600 }}
  bodyStyle={{ fontSize: '16px', lineHeight: '26px' }}
/>
```

---

### Footer

A complete email footer with logo, social icons, legal text, links, and contact info.

```tsx
import { Footer } from '@/components/email';

<Footer
  backgroundColor="#1a1a1a"
  logoSrc="https://placehold.co/120x40"
  logoWidth={120}
  logoUrl="https://example.com"
  socialTitle="Follow us"
  socialLinks={[
    { platform: 'facebook', url: 'https://facebook.com', iconUrl: 'https://placehold.co/28x28' },
    { platform: 'instagram', url: 'https://instagram.com', iconUrl: 'https://placehold.co/28x28' },
  ]}
  showDivider={true}
  legalText="You received this email because you subscribed."
  showLinks={true}
  preferencesUrl="https://example.com/preferences"
  unsubscribeUrl="https://example.com/unsubscribe"
  privacyUrl="https://example.com/privacy"
  address="123 Main Street, New York, NY 10001"
  phone="+1 (555) 123-4567"
  copyright="© 2026 Your Company. All rights reserved."
/>
```

---

### OrderCard

A dark card component for displaying order details with label-value pairs.

```tsx
import { OrderCard } from '@/components/email';

<OrderCard
  backgroundColor="#ffffff"
  cardBackgroundColor="#333333"
  cardWidth={520}
  cardBorderRadius="12px"
  dividerColor="#555555"
  rows={[
    { label: 'Order Number', value: '#ORD-2026-001847' },
    { label: 'Order Date', value: 'January 7, 2026' },
    { label: 'Shipping Method', value: 'Express Delivery' },
    { 
      label: 'Order Total', 
      value: '<strong>$847.00</strong>',
      valueStyle: { color: '#4ade80', fontWeight: 700 }
    },
  ]}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `OrderRowProps[]` | required | Array of label-value pairs |
| `backgroundColor` | `string` | `#ffffff` | Section background |
| `cardBackgroundColor` | `string` | `#333333` | Card background |
| `cardWidth` | `number` | `520` | Card width |
| `cardBorderRadius` | `string` | `8px` | Card border radius |
| `dividerColor` | `string` | `#555555` | Divider color between rows |

---

### PromoBlock

A promotional banner block with image, title, subtitle, and CTA button.

```tsx
import { PromoBlock } from '@/components/email';

<PromoBlock
  imgSrc="https://placehold.co/520x200"
  imgWidth={520}
  altText="Special Offer"
  url="https://example.com/offer"
  title="Limited Time Offer: 20% Off"
  subtitle="Use code <strong>SAVE20</strong> at checkout."
  ctaText="SHOP NOW"
  ctaUrl="https://example.com/shop"
  backgroundColor="#f8f9fa"
  cardBackgroundColor="#ffffff"
  cardBorder="2px solid #1e3a5f"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imgSrc` | `string` | required | Image URL |
| `imgWidth` | `number` | `520` | Image width |
| `title` | `string` | - | Promo title |
| `subtitle` | `string` | - | Promo subtitle (supports HTML) |
| `ctaText` | `string` | - | CTA button text |
| `cardBorder` | `string` | `1px solid #e0e0e0` | Card border |

---

### OneColProduct

A single-column product card with image, title, subtitle, price, and CTA.

```tsx
import { OneColProduct } from '@/components/email';

<OneColProduct
  backgroundColor="#f7f8f8"
  contentWidth={520}
  contentAlign="center"
  rows={[
    {
      deskImgSrc: 'https://placehold.co/520x300',
      imgWidth: 520,
      altText: 'Featured Product',
      url: 'https://example.com/product',
      productTitle: 'Premium Headphones',
      productSubtitle: 'Crystal-clear audio with noise-canceling.',
      productPrice: '$349.00',
      showButton: true,
      ctaText: 'ADD TO CART',
      width: 520,
      backgroundColor: '#ffffff',
      imgBorderRadius: '12px 12px 0 0',
    },
  ]}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `ProductItemProps[]` | required | Array of product items |
| `contentWidth` | `number` | `520` | Content width |
| `contentAlign` | `'left' \| 'center' \| 'right'` | `center` | Content alignment |
| `textAlign` | `'left' \| 'center' \| 'right'` | `left` | Text alignment |

---

### ThreeColIcon

A three-column layout with icons and text for feature highlights.

```tsx
import { ThreeColIcon } from '@/components/email';

<ThreeColIcon
  backgroundColor="#f8f9fa"
  gutterWidth={20}
  textHeight={60}
  rows={[
    {
      left: {
        iconSrc: 'https://placehold.co/24x24',
        iconWidth: 24,
        iconHeight: 24,
        text: '<strong>Free Shipping</strong><br/>On orders over $50',
        backgroundColor: '#ffffff',
        width: 160,
      },
      center: {
        iconSrc: 'https://placehold.co/24x24',
        text: '<strong>Easy Returns</strong><br/>30-day return policy',
        backgroundColor: '#ffffff',
        width: 160,
      },
      right: {
        iconSrc: 'https://placehold.co/24x24',
        text: '<strong>Quality</strong><br/>100% satisfaction',
        backgroundColor: '#ffffff',
        width: 160,
      },
    },
  ]}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `ThreeColIconRowProps[]` | required | Array of row objects |
| `backgroundColor` | `string` | `#f7f8f8` | Section background |
| `gutterWidth` | `number` | `20` | Gap between columns |
| `textHeight` | `number` | `54` | Fixed text height for alignment |

---

## ✉️ Creating New Emails

### Step 1: Create email template

Create a new file in `src/emails/`:

```tsx
// src/emails/MyNewEmail.tsx
import * as React from 'react';
import { Html, Head, Body, Container, Preview } from '@react-email/components';
import { IntroCopy, TwoColDualCta, Footer } from '@/components/email';

export const MyNewEmail: React.FC = () => {
  return (
    <Html>
      <Head />
      <Preview>Your preview text here</Preview>
      <Body style={{ backgroundColor: '#f4f4f4', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <IntroCopy greeting="Hello!" body="Welcome to our newsletter." />
          {/* Add more components */}
          <Footer copyright="© 2026 Company" />
        </Container>
      </Body>
    </Html>
  );
};

export default MyNewEmail;
```

### Step 2: Register in API route

Add to `src/app/api/email/[template]/route.ts`:

```tsx
import MyNewEmail from '@/emails/MyNewEmail';

const templates: Record<string, React.FC> = {
  // ... existing templates
  'my-new-email': MyNewEmail,
};
```

### Step 3: Add to homepage

Update `src/app/page.tsx`:

```tsx
const emailTemplates = [
  // ... existing templates
  {
    name: 'My New Email',
    description: 'Description of my email',
    path: '/preview/my-new-email',
  },
];
```

---

## 🔌 API Routes

### GET /api/email/[template]

Renders an email template and returns HTML.

**Example:**
```bash
curl http://localhost:3000/api/email/all-components
```

**Response:**
```json
{
  "html": "<!DOCTYPE html>..."
}
```

---

## 📤 Exporting HTML

### Export all emails

```bash
npm run email:export
```

Outputs HTML files to `out/emails/`.

### Programmatic export

```typescript
import { render } from '@react-email/render';
import MyEmail from '@/emails/MyEmail';

const html = await render(<MyEmail />);
const plainText = await render(<MyEmail />, { plainText: true });
```

---

## ✅ Best Practices

### 1. Use Placeholder Images for Development
```tsx
imgSrc: 'https://placehold.co/250x200/e2e8f0/1e293b?text=Product'
```

### 2. Always Include Alt Text
```tsx
altText: 'Blue leather handbag with gold hardware'
```

### 3. Keep Fixed Widths
Email clients have limited CSS support. Use 600px container:
```tsx
<table width={600} style={{ width: '600px' }}>
```

### 4. Test Across Clients
- Gmail (Web, iOS, Android)
- Apple Mail
- Outlook (Windows, Web)
- Yahoo Mail

### 5. Use Tables for Layout
React Email uses table-based layouts for maximum compatibility.

---

## 🔗 Resources

- [React Email](https://react.email/)
- [React Email Components](https://react.email/docs/components)
- [Next.js Documentation](https://nextjs.org/docs)
- [Placeholder Images](https://placehold.co/)
- [Email Client CSS Support](https://www.caniemail.com/)

---

## 📝 Converting from Handlebars

| Handlebars | React Email |
|------------|-------------|
| `{{#if var}}` | `{var && ...}` |
| `{{#each arr}}` | `{arr.map(...)}` |
| `{{{html}}}` | `dangerouslySetInnerHTML` or JSX |
| `{{var}}` | `{props.var}` |
| `{{@last}}` | `index === arr.length - 1` |

---

## 📄 License

MIT
#   R e a c t - E m a i l - t e m p l a t e - b u i l d e r  
 #   R e a c t - E m a i l - t e m p l a t e - b u i l d e r  
 #   E m a i l - t e m p l a t e - b u i l d e r  
 #   E m a i l - b u i l d e r  
 #   E m a i l - b u i l d e r  
 