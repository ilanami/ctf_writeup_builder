// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css';
import { Toaster } from "@/components/ui/toaster";
import { I18nProviderClient } from '@/locales/client';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'CTF Write-up Builder >_',
  description: 'CTF Write-up Builder - Create, manage, and export CTF reports with a hacker aesthetic.',
};


export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  console.log(`RootLayout rendering with locale: ${locale}`);
  return (
    <I18nProviderClient locale={locale} key={locale}>
      <html lang={locale}>
        <head>
          {/* Eliminado script inline para máxima seguridad CSP */}
        </head>
        <body className={`${GeistSans.variable} ${GeistMono.variable} font-mono antialiased`}>
          {children}
          <Toaster />
          <Analytics />
        </body>
      </html>
    </I18nProviderClient>
  );
}

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}
