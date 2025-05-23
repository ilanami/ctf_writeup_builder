// src/locales/client.ts
'use client';
import { createI18nClient } from 'next-international/client';

// Importamos los tipos de los archivos de locale para una mejor inferencia de tipos
// Asegúrate de que tus archivos en y es exporten 'default' y estén marcados con 'as const'
// Ejemplo: export default { greeting: "Hello" } as const;
export const {
  useI18n,
  useScopedI18n,
  I18nProviderClient,
  useCurrentLocale,
  // Si necesitas cambiar de locale en el cliente, también puedes exportar useChangeLocale
  useChangeLocale,
} = createI18nClient({
  en: () => import('./en'),
  es: () => import('./es'),
});
