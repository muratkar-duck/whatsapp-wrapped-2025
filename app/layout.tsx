import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WhatsApp Wrapped 2025',
  description: 'Deterministic, print-ready Wrapped reports for WhatsApp history.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-gray-50 text-gray-900">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold text-accent">
            Wrapped 2025
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
            <Link href="/" className="transition hover:text-accent">
              Ana Sayfa
            </Link>
            <Link href="/report/2025" className="transition hover:text-accent">
              Raporu Görüntüle
            </Link>
            <Link href="/outputs" className="transition hover:text-accent">
              Çıktılar
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
