# CTF Write-up Builder — Instrucciones para Claude Code

## Stack
- Next.js 15.5.19 · React 18 · TypeScript · Tailwind CSS · Radix UI
- TipTap (editor rico) · @dnd-kit (drag & drop)
- pdfmake (exportación PDF) · marked + DOMPurify (markdown→HTML)
- Gemini / OpenAI via `/api/ai-generate` route
- `localStorage` para persistencia · sin base de datos · sin autenticación

## Comandos esenciales
```bash
npm install          # instalar dependencias
npm run dev          # dev en http://localhost:3000
npm run build        # build de producción
npm run typecheck    # tsc --noEmit
```

## Estructura clave
```
src/
├── app/[locale]/             # Next.js App Router (es / en)
├── components/
│   ├── AppLayout.tsx         # layout principal
│   ├── WysiwygEditor.tsx     # editor TipTap
│   ├── PdfExportModal.tsx    # exportación PDF con pdfmake ← trabajo pendiente
│   ├── ImageUploader.tsx     # subida de imágenes ← trabajo pendiente
│   ├── ActiveSectionEditor.tsx
│   └── ...
├── contexts/
│   ├── WriteUpContext.tsx    # estado global (useReducer + localStorage)
│   └── ThemeContext.tsx      # temas hacker/dark/light
├── lib/
│   ├── types.ts
│   ├── constants.ts          # STORAGE_KEYS + PDF_THEME_COLORS
│   └── pdfRenderer.ts        # conversor HTML→bloques pdfmake (htmlToPdfmake)
└── app/globals.css           # temas hacker/dark/light
```

## Convenciones de código
- Todos los componentes son `"use client"` (app 100% client-side)
- Internacionalización con `next-international`: `useI18n()`, `useScopedI18n()`
- Textos de UI siempre en `src/locales/es/index.ts` y `src/locales/en/index.ts`
- No modificar `src/components/ui/` (shadcn) ni `src/middleware.ts`
- localStorage: usar siempre las constantes de `STORAGE_KEYS` en constants.ts
- Verificación visual: Playwright con Chromium en
  `/home/ilanami/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`
  (variable PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH en ~/.zshrc)

---

## ✅ YA COMPLETADO (no volver a tocar)

- Sprint 1: API key, autosave, editor WysiwygEditor (botones + foco), @ts-nocheck, código muerto
- Sprint 2: QuotaExceededError, STORAGE_KEYS centralizado, migración a @dnd-kit
- Sprint 3: sistema de temas hacker/dark/light
- Sprint 5: header con dropdowns, indicador autosave, React.memo en SectionItemCard
- PDF: migrado a pdfmake (conversor htmlToPdfmake en pdfRenderer.ts)
- Plantillas: limpiadas de emojis, tablas y separadores ---
- Editor: botones de heading H1-H4, jerarquía de plantillas h2→h3→h4

---

## 🎯 TRABAJO PENDIENTE

### PASO 0 — Backup de seguridad ANTES de cualquier cambio (obligatorio)

Antes de tocar nada, crear un punto de restauración con git para poder volver atrás
si algo se rompe:

```bash
# 1. Confirmar que el árbol está limpio y todo está pusheado
git status
git log --oneline -1

# 2. Crear una rama de respaldo del estado actual (no se trabaja en ella, solo respaldo)
git branch backup-pre-pdf-imagenes

# 3. Crear una etiqueta con fecha como segundo punto de restauración
git tag backup-$(date +%Y%m%d)

# 4. Subir la rama y la etiqueta de respaldo a GitHub (doble seguridad)
git push origin backup-pre-pdf-imagenes
git push origin --tags

# 5. Crear la rama de trabajo donde SÍ se harán los cambios
git checkout -b fix/pdf-y-compresion-imagenes
```

A partir de aquí se trabaja en `fix/pdf-y-compresion-imagenes`. Si algo sale mal en
cualquier momento, se puede restaurar el estado original con:
```bash
git checkout master            # o git reset --hard backup-pre-pdf-imagenes
```
La rama `backup-pre-pdf-imagenes` y la etiqueta `backup-YYYYMMDD` quedan intactas en
GitHub como red de seguridad pase lo que pase.

**Confirmar que el backup está hecho y subido antes de empezar la Tarea 1.**

---

Quedan DOS tareas. Trabajar una cada vez: implementar → verificar visualmente en
el navegador (yo confirmo) → commit → push. NO hacer commit sin mi verificación.

---

### TAREA 1 — Títulos huérfanos y espacio vacío en PDF

Archivo: `src/components/PdfExportModal.tsx`, función `buildDocDefinition()`.

**Contexto verificado:** El PDF usa pdfmake con footer (número de página). El enfoque
estándar de `pageBreakBefore` con `followingNodesOnPage.length === 0` NO funciona de
forma fiable cuando hay footer (issue pdfmake #1749, abierto): el footer cuenta como
nodo siguiente y la condición nunca se cumple. Por eso se usa `unbreakable`.

**FIX 1.1 — Títulos huérfanos (enfoque unbreakable):**
Actualmente el título de sección y su contenido se hacen `content.push()` por separado,
así que un título puede quedar solo al final de página. Agrupar el título con su PRIMER
bloque de contenido en un `stack` con `unbreakable: true`:

1. Construir primero todos los bloques de contenido de la sección en un array
   (answer, flag, y el resultado de htmlToPdfmake del contenido)
2. Crear el bloque del título (quitar `headlineLevel: 1`, ya no se usa)
3. Si hay contenido: `content.push({ stack: [titleBlock, contentBlocks[0]], unbreakable: true })`
   y luego empujar el resto de bloques (índice 1 en adelante) normalmente
4. Si no hay contenido: empujar solo el título

Esto garantiza que el título siempre arrastre al menos su primer párrafo a la misma
página. No depende de followingNodesOnPage, así que el footer no lo afecta.

Advertencia: si el primer bloque fuera una imagen enorme o un code block gigante, el
conjunto podría superar una página. Para contenido normal (párrafo/lista como primer
bloque) no ocurre.

**FIX 1.2 — Espacio vacío por imágenes:**
- Cambiar `fit: [500, 650]` por `fit: [500, 420]` en los screenshots (650pt es muy
  alto y fuerza saltos que dejan huecos; 420pt cabe más a menudo)
- Agrupar imagen + caption en un `stack` con `unbreakable: true` para que nunca se
  separen entre páginas

**Verificación (la hago yo):** generaré un PDF con un título que caiga justo al final
de una página. Si título+primer párrafo saltan juntos a la siguiente, funciona.
También: imágenes que no se corten, caption pegado a su imagen, menos huecos.

**Commit cuando lo verifique:**
```
fix: títulos huérfanos y espacio vacío en exportación PDF
```

---

### TAREA 2 — Comprimir imágenes antes de guardar

Archivo: `src/components/ImageUploader.tsx`.

**Contexto verificado:** ImageUploader hace `reader.readAsDataURL(file)` directamente,
guardando la imagen sin comprimir en base64 en localStorage. Esto llena localStorage,
genera PDFs enormes y ralentiza la preview.

**Implementación:**
1. Instalar: `npm install browser-image-compression`
2. En ImageUploader.tsx, ANTES de readAsDataURL, comprimir el archivo con:
   ```ts
   import imageCompression from 'browser-image-compression';
   const options = {
     maxSizeMB: 0.8,
     maxWidthOrHeight: 1920,
     useWebWorker: true,
     fileType: 'image/jpeg',
     initialQuality: 0.8,
     onProgress: (p) => setCompressProgress(p),
   };
   const compressedFile = await imageCompression(file, options);
   // luego readAsDataURL sobre compressedFile
   ```
3. Añadir estado "Optimizando imagen..." mientras comprime (usar onProgress)
4. try/catch: si la compresión falla, guardar el original como fallback
5. Aplicar la compresión a TODAS las vías de subida: imagen de máquina (machineImage),
   screenshots de sección, y drag & drop si existe
6. Mantener la validación existente de MAX_FILE_SIZE_MB (5MB) sobre el archivo original

**Verificación (la hago yo):** subiré una captura grande (2-4MB), confirmaré que se
guarda comprimida (tamaño en localStorage), que se ve bien en la preview, y que el
PDF resultante pesa mucho menos.

**Commit cuando lo verifique:**
```
feat: comprimir imágenes en el navegador antes de guardar
```

---

## ⛔ No tocar
- `src/components/ui/` — componentes shadcn
- `src/middleware.ts` — i18n routing
- `src/ai/genkit.ts` — configuración de Genkit AI
- La lógica de encriptación base64 de la API key (intencional)
- Todo lo marcado como ✅ COMPLETADO arriba
