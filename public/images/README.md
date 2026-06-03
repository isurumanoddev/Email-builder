# Nissan Email Images

These images are used in the Nissan email template.

## Image Mapping

| File | Used As | Description |
|------|---------|-------------|
| `preview-928x522.jpg` | Logo | Nissan Motor Corporation logo |
| `10-year-warranty_hp_°°.png.ximg.l_full_m.smart.png` | Banner | Nissan MORE - 10 Years Warranty |
| `QQ ST.png` | Qashqai | Blue Nissan Qashqai (side view) |
| `Ti Patrol.png` | Patrol | Gray Nissan Patrol (side view) |
| `63kWh-ENGAGE.png` | Ariya | Dark Nissan Ariya electric (side view) |
| `XT2PAST25_TCJARBWT33EMA-----.png` | X-Trail | Red Nissan X-Trail (side view) |

## For Production Email Delivery

Replace the relative paths in `src/emails/NissanEmail.tsx` with absolute URLs:

```tsx
const IMAGES = {
  logo: 'https://your-cdn.com/images/preview-928x522.jpg',
  moreBanner: 'https://your-cdn.com/images/10-year-warranty_hp_°°.png.ximg.l_full_m.smart.png',
  qashqai: 'https://your-cdn.com/images/QQ ST.png',
  patrol: 'https://your-cdn.com/images/Ti Patrol.png',
  ariya: 'https://your-cdn.com/images/63kWh-ENGAGE.png',
  xtrail: 'https://your-cdn.com/images/XT2PAST25_TCJARBWT33EMA-----.png',
};
```

**Note:** Consider renaming files to remove special characters (°°, spaces) for better URL compatibility.

