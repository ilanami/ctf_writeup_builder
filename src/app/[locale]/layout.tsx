// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '../globals.css';
import { Toaster } from "@/components/ui/toaster";
import { I18nProviderClient } from '@/locales/client';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'CTF Write-up Builder >_',
  description: 'CTF Write-up Builder - Create, manage, and export CTF reports with a hacker aesthetic.',
};


export default function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: ReactNode;
  params: { locale: string };
}>) {
  console.log(`RootLayout rendering with locale: ${locale}`);
  return (
    <I18nProviderClient locale={locale} key={locale}>
      <html lang={locale}>
        <head>
          <script dangerouslySetInnerHTML={{__html: `
            let visible = true;
            setInterval(() => {
              document.title = visible ? 'CTF Write-up Builder >_' : 'CTF Write-up Builder  ';
              visible = !visible;
            }, 500);
          `}} />
        </head>
        <body className={`${GeistSans.variable} ${GeistMono.variable} font-mono antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </I18nProviderClient>
  );
}

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}
