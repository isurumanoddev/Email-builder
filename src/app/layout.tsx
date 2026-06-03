import type { Metadata } from 'next';
import './globals.css';
import '@/builder/builder.css';

export const metadata: Metadata = {
  title: 'React Email Builder',
  description: 'Build and preview email templates with React Email and Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

