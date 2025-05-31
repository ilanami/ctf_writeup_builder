# Guía de Usuario: CTF Write-up Builder

## ¿Qué es CTF Write-up Builder?

CTF Write-up Builder es una aplicación web que te permite crear, organizar y exportar write-ups (resoluciones) de máquinas y retos de CTF de forma profesional, rápida y segura.  
Soporta español e inglés, y está diseñada para la comunidad de ciberseguridad.

---

## Índice

1. [Primeros pasos](#primeros-pasos)
2. [Estructura de la aplicación](#estructura-de-la-aplicación)
3. [Secciones principales y su uso](#secciones-principales-y-su-uso)
4. [Importar y exportar write-ups](#importar-y-exportar-write-ups)
5. [Uso de la IA (OpenAI/Gemini)](#uso-de-la-ia-openai-gemini)
6. [Personalización y plantillas](#personalización-y-plantillas)
7. [Gestión de idiomas](#gestión-de-idiomas)
8. [Consejos de seguridad y privacidad](#consejos-de-seguridad-y-privacidad)
9. [Preguntas frecuentes](#preguntas-frecuentes)

---

## Primeros pasos

1. **Accede a la app:**  
   Abre la URL de la aplicación en tu navegador (por ejemplo, la de Vercel).

2. **Selecciona el idioma:**  
   Puedes elegir entre español e inglés desde el menú superior o de configuración.

3. **Configura tu API Key (opcional):**  
   Si quieres usar la IA para sugerencias automáticas, configura tu clave de OpenAI o Gemini en la sección de configuración.

---

## Estructura de la aplicación

- **Barra superior:**  
  Acceso a idioma, configuración, importación/exportación, y ayuda.

- **Panel principal:**  
  Aquí editas tu write-up, añades secciones, imágenes, y gestionas el contenido.

- **Vista previa:**  
  Puedes ver cómo quedará tu write-up final en tiempo real.

---

## Secciones principales y su uso

### 1. **Título y Metadatos**

- **Título:**  
  Escribe el nombre de la máquina o reto. Ejemplo: `HTB - Blue`
- **Autor:**  
  Tu nombre o alias.
- **Fecha:**  
  La fecha se genera automáticamente y **no se puede modificar**. Siempre refleja la fecha actual.
- **Dificultad, sistema operativo:**  
  Completa estos campos para un write-up profesional.

### 2. **Secciones del Write-up**

La app incluye plantillas sugeridas (Reconocimiento, Explotación, Post-Explotación, etc.) y puedes añadir, eliminar o reordenar secciones a tu gusto.

- **Añadir sección:**  
  Haz clic en "Añadir sección" y elige un nombre.
- **Editar sección:**  
  Haz clic en el título o contenido para modificarlo.
- **Reordenar secciones:**  
  Arrastra las secciones de usuario para cambiar el orden (las plantillas fijas no se pueden mover).
- **Eliminar sección:**  
  Haz clic en el icono de papelera en la sección correspondiente.

### 3. **Imágenes y archivos**

- **Añadir imagen:**  
  **IMPORTANTE:** Solo puedes añadir imágenes a secciones que hayas editado o creado. Si no has modificado una plantilla sugerida o añadido una sección, no podrás subir imágenes ni modificar la estructura.
- **Visualización:**  
  Las imágenes se muestran en la vista previa y en la exportación.

### 4. **Notas y consejos**

- Usa las secciones para documentar cada fase del reto.
- Puedes copiar/pegar comandos, salidas de terminal, y resultados.

---

## Importar y exportar write-ups

### **Importar**

- **Desde JSON:**  
  Importa un write-up previamente exportado desde la app.
- **Desde Markdown:**  
  Importa write-ups en formato Markdown (.md). La app intentará mapear los encabezados y secciones automáticamente.
- **Opciones de importación:**  
  Puedes elegir entre fusionar con tu write-up actual o reemplazarlo completamente.

### **Exportar**

- **A PDF:**  
  Exporta tu write-up en formato PDF listo para compartir o entregar.
- **A JSON:**  
  Guarda tu progreso para continuar editando más tarde.
- **A Markdown:**  
  Exporta el contenido en formato Markdown para compartir en foros o repositorios.

---

## Uso de la IA (OpenAI/Gemini)

- **Configura tu API Key:**  
  Ve a configuración y añade tu clave de OpenAI o Gemini.
- **Sugerencias automáticas:**  
  En cada sección puedes pedir a la IA que te ayude a redactar, resumir o mejorar el texto.
- **Privacidad:**  
  Las claves se almacenan localmente y nunca se envían a servidores externos.

---

## Personalización y plantillas

- **Secciones sugeridas:**  
  Siempre tendrás plantillas de secciones recomendadas (Recon, Exploit, etc.).
- **Crea tus propias plantillas:**  
  Puedes añadir y guardar secciones personalizadas para futuros write-ups.

---

## Gestión de idiomas

- **Cambia de idioma en cualquier momento:**  
  El contenido de la interfaz y las plantillas se adaptan automáticamente.
- **Advertencia:**  
  Cambiar de idioma puede resetear el write-up actual (se muestra un aviso de confirmación).

---

## Consejos de seguridad y privacidad

- **Todo el contenido se guarda localmente en tu navegador.**
- **No se envía información a servidores externos, salvo que uses la IA.**
- **Las claves API están protegidas y solo se usan en tu dispositivo.**
- **No subas información sensible o privada si vas a compartir el write-up.**

---

## Preguntas frecuentes

**¿Puedo usar la app sin conexión?**  
Sí, pero algunas funciones (como la IA) requieren internet.

**¿Puedo compartir mis write-ups?**  
Sí, exporta a PDF, Markdown o JSON y compártelos como prefieras.

**¿Qué pasa si cierro la app?**  
Tu progreso se guarda localmente, pero exporta regularmente para evitar pérdidas.

**¿Puedo colaborar con otros?**  
Por ahora, la edición es individual, pero puedes compartir archivos exportados.

---

## Soporte y contacto

- **¿Tienes dudas o sugerencias?**  
  Consulta la documentación, revisa los archivos de ayuda, o contacta al equipo en:  
  **writeup_builder@proton.me**

---

¿Necesitas la guía en inglés o un PDF/manual visual? ¡Dímelo y lo preparo! 