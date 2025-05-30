# Política de Seguridad

## Versiones Soportadas
Solo se brinda soporte a la última versión principal y secundaria de CTF Write-up Builder. Por favor, utiliza siempre la versión más reciente para garantizar la mejor seguridad y experiencia.

| Versión | Soportada           |
| ------- | ------------------- |
| Última  | :white_check_mark:  |
| Anteriores | :x:              |

## Reporte de Vulnerabilidades
Si detectas una vulnerabilidad de seguridad, repórtala de forma responsable escribiendo a: **writeup_builder@proton.me**

- **No** crees issues públicos en GitHub para problemas de seguridad.
- Nos comprometemos a responder en un plazo de 48 horas y resolver los problemas críticos lo antes posible.

## Buenas Prácticas de Seguridad
- Todo input de usuario se sanitiza usando [DOMPurify](https://github.com/cure53/DOMPurify) para prevenir XSS.
- La app es 100% cliente; ningún dato sensible se envía a servidores externos (excepto solicitudes de IA, que van directo al proveedor).
- Las API keys se almacenan localmente en Base64 (no es cifrado seguro, pero nunca se envían a nuestros servidores).
- Recomendamos usar API keys únicas y no compartirlas.
- Mantén tu navegador y sistema operativo actualizados.

## Política de Divulgación Responsable
Fomentamos la divulgación responsable de vulnerabilidades:
- Reporta vulnerabilidades de forma privada al correo indicado.
- Permite un tiempo razonable para investigar y corregir antes de divulgar públicamente.
- Proporciona pasos claros para reproducir el problema.

## Contexto de Seguridad
- La app ha sido auditada y mantiene una calificación A/A+ en securityheaders.com.
- No existen vulnerabilidades XSS; todo el renderizado de Markdown y HTML es seguro.
- No hay secretos ni credenciales hardcodeados en el código.
- CORS y headers de seguridad están activos en producción.

¡Gracias por ayudar a mantener CTF Write-up Builder seguro para la comunidad CTF hispanohablante! 