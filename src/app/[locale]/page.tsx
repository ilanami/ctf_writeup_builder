
// src/app/[locale]/page.tsx
import { WriteUpProvider } from '@/contexts/WriteUpContext';
import { AppLayout } from '@/components/AppLayout';

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <WriteUpProvider>
      <AppLayout />
    </WriteUpProvider>
  );
}
