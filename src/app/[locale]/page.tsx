// src/app/[locale]/page.tsx
import { WriteUpProvider } from '@/contexts/WriteUpContext';
import { AppLayout } from '@/components/AppLayout';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <WriteUpProvider>
      <AppLayout />
    </WriteUpProvider>
  );
}
