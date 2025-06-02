import { redirect } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Si estamos en la raíz, redirigir a /en
  if (typeof window !== 'undefined' && window.location.pathname === '/') {
    redirect('/en');
  }

  // Si no estamos en la raíz, mostrar el contenido
  return children;
} 