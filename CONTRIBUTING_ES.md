# Guía de Contribución

¡Gracias por tu interés en contribuir a CTF Write-up Builder!

## ¿Cómo Contribuir?
- Haz un fork del repositorio y crea tu rama a partir de `master`.
- Sigue el estilo y convenciones de código del proyecto.
- Escribe mensajes de commit claros y descriptivos.
- Prueba tus cambios localmente antes de enviar un pull request.
- Asegúrate de que tu código no introduzca vulnerabilidades de seguridad.

## Buenas Prácticas de Seguridad
- Sanitiza todo input y output de usuario. Usa [DOMPurify](https://github.com/cure53/DOMPurify) para cualquier renderizado HTML.
- Nunca subas secretos, API keys o credenciales al repositorio.
- Valida y restringe los archivos subidos e importados.
- Aplica el principio de mínimo privilegio en todo el código y configuración.

## Reporte de Problemas de Seguridad
Si encuentras un problema de seguridad, repórtalo de forma privada a **writeup_builder@proton.me**. No abras un issue público.

## Divulgación Responsable
- Da un tiempo razonable para que el equipo resuelva el problema antes de divulgarlo públicamente.
- Proporciona pasos claros para reproducir la vulnerabilidad.

## Estándares de Comunidad
- Sigue nuestro [Código de Conducta](./CODE_OF_CONDUCT_ES.md).
- Sé respetuoso y colaborativo.

¡Agradecemos tu ayuda para mejorar y asegurar CTF Write-up Builder! 