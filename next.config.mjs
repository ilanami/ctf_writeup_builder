/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Desarrollo: CSP muy permisiva para que todo funcione
      console.log('🔧 Desarrollo: CSP permisiva');
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https: blob:",
                "connect-src 'self' https:",
                "font-src 'self' data:",
                "object-src 'none'",
                "media-src 'self'",
                "frame-src 'self'",
                "worker-src 'self' blob:",
                "child-src 'self' blob:",
                "base-uri 'self'"
              ].join('; ')
            }
          ]
        }
      ];
    }

    // Producción: CSP A+ pero funcional
    console.log('🔒 Producción: CSP A+ funcional');
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // CRÍTICO: Permitir Next.js chunks y React
              "script-src 'self' 'unsafe-inline'", // Necesario para Next.js
              "style-src 'self' 'unsafe-inline'", // Necesario para Tailwind
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https:", // Para API calls
              "font-src 'self' data:",
              "object-src 'none'",
              "media-src 'self'",
              "frame-src 'self'",
              "worker-src 'self' blob:", // Para Web Workers si los usas
              "child-src 'self' blob:",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          },
          // Headers A+ que SÍ funcionan
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
          // REMOVIDOS temporalmente los que causan problemas:
          // - Cross-Origin-Embedder-Policy
          // - Cross-Origin-Opener-Policy  
          // - Strict-Transport-Security (Vercel lo maneja)
        ]
      }
    ];
  },
  
  poweredByHeader: false,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

export default nextConfig;
