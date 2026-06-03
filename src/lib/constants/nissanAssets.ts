/**
 * Nissan brand assets — single source of truth for images used across
 * email components, templates, and the builder registry defaults.
 *
 * Paths resolve to files in `public/images/` when running via Next.js.
 * For production email delivery, replace with absolute CDN URLs.
 */

function img(filename: string): string {
  return `/images/${encodeURIComponent(filename)}`;
}

export const NISSAN_IMAGES = {
  logo: img('preview-928x522.jpg'),
  moreBanner: img('10-year-warranty_hp_°°.png.ximg.l_full_m.smart.png'),
  qashqai: img('QQ ST.png'),
  patrol: img('Ti Patrol.png'),
  ariya: img('63kWh-ENGAGE.png'),
  xtrail: img('XT2PAST25_TCJARBWT33EMA-----.png'),
} as const;

export const NISSAN_COLORS = {
  black: '#000000',
  white: '#ffffff',
  red: '#c3002f',
  gray: '#4a4a4a',
  lightGray: '#f5f5f5',
  darkGray: '#1a1a1a',
} as const;

/** Nissan-themed icon placeholders for ThreeColIcon (warranty features). */
export const NISSAN_ICONS = {
  warranty: 'https://placehold.co/32x32/c3002f/ffffff?text=10',
  innovation: 'https://placehold.co/32x32/c3002f/ffffff?text=⚡',
  service: 'https://placehold.co/32x32/c3002f/ffffff?text=★',
} as const;

export const NISSAN_SOCIAL_ICONS = {
  facebook: 'https://placehold.co/28x28/ffffff/1a1a1a?text=f',
  instagram: 'https://placehold.co/28x28/ffffff/1a1a1a?text=ig',
  youtube: 'https://placehold.co/28x28/ffffff/1a1a1a?text=yt',
  twitter: 'https://placehold.co/28x28/ffffff/1a1a1a?text=X',
} as const;

/** Default product rows using real Nissan vehicle images. */
export const NISSAN_PRODUCT_DEFAULTS = {
  twoColDualCtaRow: {
    product1: {
      headerTitle: 'All-New Qashqai',
      headerSubtitle: 'CROSSOVER',
      imgSrc: NISSAN_IMAGES.qashqai,
      imgWidth: 250,
      altText: 'Nissan Qashqai',
      url: 'https://www.nissan.com/qashqai',
      labelText: 'FROM AUD 89,900',
      title: 'Nissan Qashqai',
      subtitle: 'Bold design meets smart technology',
      cta1Text: 'REQUEST A QUOTE',
      cta2Text: 'BOOK TEST DRIVE',
      backgroundColor: NISSAN_COLORS.white,
      width: 250,
    },
    product2: {
      headerTitle: 'Patrol',
      headerSubtitle: 'FULL-SIZE SUV',
      imgSrc: NISSAN_IMAGES.patrol,
      imgWidth: 250,
      altText: 'Nissan Patrol',
      url: 'https://www.nissan.com/patrol',
      labelText: 'FROM AUD 199,900',
      title: 'Nissan Patrol',
      subtitle: 'Legendary power and luxury',
      cta1Text: 'REQUEST A QUOTE',
      cta2Text: 'BOOK TEST DRIVE',
      backgroundColor: NISSAN_COLORS.white,
      width: 250,
    },
  },
  twoColStackedRow: {
    product1: {
      deskImgSrc: NISSAN_IMAGES.ariya,
      imgWidth: 250,
      altText: 'Nissan Ariya',
      url: 'https://www.nissan.com/ariya',
      title: 'Nissan Ariya',
      subtitle: '100% Electric. 100% Nissan.',
      price: 'From AUD 179,900',
      ctaText: 'EXPLORE NOW',
      backgroundColor: NISSAN_COLORS.white,
      width: 250,
    },
    product2: {
      deskImgSrc: NISSAN_IMAGES.xtrail,
      imgWidth: 250,
      altText: 'Nissan X-Trail',
      url: 'https://www.nissan.com/xtrail',
      title: 'Nissan X-Trail',
      subtitle: 'Adventure-ready family SUV',
      price: 'From AUD 119,900',
      ctaText: 'EXPLORE NOW',
      backgroundColor: NISSAN_COLORS.white,
      width: 250,
    },
  },
  oneColProductRow: {
    deskImgSrc: NISSAN_IMAGES.patrol,
    imgWidth: 520,
    altText: 'Nissan Patrol Ti',
    url: 'https://www.nissan.com/patrol',
    productTitle: 'Nissan Patrol Ti',
    productSubtitle:
      'The legendary Patrol combines commanding presence with refined luxury.',
    productPrice: 'From AUD 199,900',
    showButton: true,
    ctaText: 'CONFIGURE YOURS',
    ctaUrl: 'https://www.nissan.com/patrol/configure',
    width: 520,
    backgroundColor: NISSAN_COLORS.white,
  },
  threeColIconRow: {
    left: {
      iconSrc: NISSAN_ICONS.warranty,
      iconWidth: 32,
      iconHeight: 32,
      text: '<strong style="color:#c3002f;">10 Year Warranty</strong><br/><span style="color:#4a4a4a;">Complete peace of mind</span>',
      backgroundColor: NISSAN_COLORS.lightGray,
      width: 160,
      iconPadding: '20px 16px 12px 16px',
    },
    center: {
      iconSrc: NISSAN_ICONS.innovation,
      iconWidth: 32,
      iconHeight: 32,
      text: '<strong style="color:#c3002f;">Innovation</strong><br/><span style="color:#4a4a4a;">Cutting-edge technology</span>',
      backgroundColor: NISSAN_COLORS.lightGray,
      width: 160,
      iconPadding: '20px 16px 12px 16px',
    },
    right: {
      iconSrc: NISSAN_ICONS.service,
      iconWidth: 32,
      iconHeight: 32,
      text: '<strong style="color:#c3002f;">Premium Service</strong><br/><span style="color:#4a4a4a;">World-class experience</span>',
      backgroundColor: NISSAN_COLORS.lightGray,
      width: 160,
      iconPadding: '20px 16px 12px 16px',
    },
  },
} as const;
