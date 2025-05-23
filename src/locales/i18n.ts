
// src/locales/i18n.ts
// Este archivo ya no se usará para el proveedor principal ni para los hooks de cliente.
// Se mantiene por si se necesitan las exportaciones de getLocaleProps para
// funcionalidades como generateStaticParams, aunque actualmente no se usa.
// Las funciones de servidor ahora provendrán de server.ts y las de cliente de client.ts.

// import { createI18n } from 'next-international';
// import type EnLocale from './en';

// export const {
//   // useI18n, // Se moverá a client.ts
//   // useScopedI18n, // Se moverá a client.ts
//   // I18nProvider, // Se reemplazará por I18nProviderClient de client.ts
//   getLocaleProps, // Podría mantenerse si es necesario para funciones de build-time
//   // getCurrentLocale, // Se moverá a client.ts y server.ts
//   // getScopedI18n, // Se moverá a server.ts
//   // getI18n, // Se moverá a server.ts
// } = createI18n<typeof EnLocale, 'en' | 'es'>({ // Esta llamada es la que causa el error
//   en: () => import('./en'),
//   es: () => import('./es'),
// });

// Dejamos el archivo casi vacío para evitar el error,
// o exportando solo lo que no cause conflicto si fuera necesario.
// Por ahora, se recomienda importar directamente de `client.ts` o `server.ts`.

export {}; // Exportación vacía para que sea tratado como un módulo.
