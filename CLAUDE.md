# CTF Write-up Builder — Instrucciones para Claude Code

## Stack
- Next.js 15 · React 18 · TypeScript · Tailwind CSS · Radix UI
- TipTap (editor rico) · react-beautiful-dnd (drag & drop, **deprecated**)
- Gemini / OpenAI via `/api/ai-generate` route
- `localStorage` para persistencia · sin base de datos · sin autenticación

## Comandos esenciales
```bash
npm install          # instalar dependencias
npm run dev          # dev en http://localhost:3000  ← URL para Playwright
npm run build        # build de producción
npm run typecheck    # tsc --noEmit (TypeScript sin emitir)
```

## Estructura clave
```
src/
├── app/[locale]/         # Next.js App Router (es / en)
├── components/
│   ├── AppLayout.tsx     # ⚠️ God Component 995 líneas con @ts-nocheck
│   ├── WysiwygEditor.tsx # ⚠️ Bug crítico: useEffect reset loop
│   ├── PdfExportModal.tsx
│   ├── ActiveSectionEditor.tsx
│   └── ...
├── contexts/
│   └── WriteUpContext.tsx # Estado global (useReducer + localStorage)
├── lib/
│   ├── types.ts
│   └── constants.ts
└── app/globals.css        # Solo tema Hacker. Añadir dark y light aquí.
```

## Convenciones de código
- Todos los componentes son `"use client"` (app 100% client-side)
- Internacionalización con `next-international`: `useI18n()`, `useScopedI18n()`
- Clases de color hardcodeadas en verde neón `#00ff00` y cyan `#00ffff`
- No modificar archivos bajo `src/components/ui/` (shadcn — no editarlos)
- Los textos de UI van siempre a `src/locales/es/index.ts` y `src/locales/en/index.ts`

---

## 🛠️ MCP Servers disponibles

### Playwright MCP
Permite abrir un navegador real y verificar visualmente que los cambios funcionan.

**Cuándo usarlo — obligatorio tras cualquier cambio en estos sprints:**
- Sprint 1 BUG-03 (editor): verificar que negrita, listas, código y enlaces funcionan
- Sprint 3 FEATURE-01 (temas): verificar que los 3 temas cambian correctamente
- Sprint 4 FEATURE-02 (PDF): verificar que el PDF se exporta sin páginas vacías
- Sprint 5 FEATURE-03 (header): verificar que los dropdowns abren y cierran bien

**Flujo de verificación estándar tras cada fix:**
```
1. npm run dev   (si no está ya corriendo)
2. Usar Playwright para navegar a http://localhost:3000
3. Ejecutar el caso de prueba específico del bug/feature
4. Confirmar resultado antes de hacer commit
```

**Casos de prueba por sprint:**

*BUG-03 — editor de formato:*
- Navegar a localhost:3000 → seleccionar cualquier sección
- Escribir "texto de prueba" → seleccionar las palabras → pulsar Bold
- Verificar que el texto queda en **negrita** y NO desaparece al seguir escribiendo
- Repetir con: lista (icono lista), bloque de código, enlace

*FEATURE-01 — temas:*
- Pulsar botón ☀️ → verificar fondo blanco, texto oscuro, sin texto ilegible
- Pulsar botón 🌙 → verificar fondo azul oscuro profesional
- Pulsar botón >_ → verificar vuelta al verde neón
- Recargar la página → verificar que el tema persiste

*FEATURE-02 — PDF:*
- Crear writeup con al menos 3 secciones y 2-3 imágenes de diferentes tamaños
- Exportar PDF → debe descargarse directamente (sin diálogo del navegador)
- Abrir PDF → ninguna página debe estar casi vacía por culpa de una imagen grande

*BUG-02 — pérdida de datos:*
- Escribir texto en una sección → inmediatamente clic en otra sección (< 1 segundo)
- Recargar página → el texto escrito debe seguir ahí

---

### GitHub MCP
Permite gestionar el repositorio: ramas, commits, pull requests y diffs.

**Cuándo usarlo:**
- Al inicio de cada sprint: crear rama `fix/sprint-N-descripcion`
- Al finalizar cada sprint: revisar el diff completo antes de hacer merge
- Para abrir una PR por sprint con descripción detallada de los cambios

**Flujo de trabajo por sprint:**
```
Inicio de sprint:
  → Crear rama: fix/sprint-1-bugs-criticos

Durante el sprint:
  → Hacer commits atómicos por bug/feature (un commit por BUG-XX o FEATURE-XX)

Al finalizar el sprint:
  → Revisar diff completo de todos los archivos modificados
  → Abrir PR con título: "[Sprint N] Descripción" y lista de cambios
```

**Formato de commits:**
```
fix: corregir eliminación de API key en localStorage         ← BUG-01
fix: no cancelar autosave al cambiar sección                 ← BUG-02
fix: corregir useEffect reset loop en WysiwygEditor          ← BUG-03
fix: eliminar @ts-nocheck y código muerto                    ← BUG-04/05
fix: centralizar STORAGE_KEYS y manejar QuotaExceededError   ← BUG-06/07
fix: migrar react-beautiful-dnd a @dnd-kit/sortable          ← BUG-08
feat: añadir sistema de temas (hacker/dark/light)            ← FEATURE-01
feat: reemplazar window.print por jsPDF+html2canvas          ← FEATURE-02
feat: reorganizar header con dropdowns                       ← FEATURE-03
feat: indicador visual de auto-guardado                      ← FEATURE-04
perf: añadir React.memo y useCallback en SectionItemCard     ← FEATURE-05
```

---

## 📚 Skills activas

### React / TypeScript skill
Aplica patrones correctos de React 18 y TypeScript estricto en todos los cambios.

**Reglas que esta skill hace cumplir en este proyecto:**
- `useRef` para valores que no deben disparar re-renders (ver BUG-03)
- `useCallback` para handlers pasados como props a listas (ver FEATURE-05)
- `React.memo` en componentes que reciben props estables y están en listas
- Nunca usar `any` implícito — preferir tipos explícitos o `as unknown as T`
- Eliminar `// @ts-nocheck` de archivos — corregir los errores reales (ver BUG-04)
- Al migrar de react-beautiful-dnd a @dnd-kit: usar `useSortable`, `DndContext`, `SortableContext` con `verticalListSortingStrategy`
- `useEffect` siempre con array de dependencias explícito y completo
- Separar lógica de negocio de lógica de renderizado (ver split de AppLayout.tsx)

### Code Review skill
Revisar el código antes de cada commit buscando bugs, fugas de memoria y malas prácticas.

**Checklist que esta skill aplica antes de cada commit en este proyecto:**
- [ ] No quedan `console.log`, `console.warn` ni `console.error` de debug
- [ ] No hay `// @ts-nocheck`, `// @ts-ignore` ni `any` implícito nuevo
- [ ] Todo `useEffect` tiene array de dependencias completo
- [ ] Todo `URL.createObjectURL` tiene su correspondiente `URL.revokeObjectURL`
- [ ] Todo `localStorage.setItem` está envuelto en try/catch
- [ ] No hay strings literales de localStorage — usar `STORAGE_KEYS` del constants.ts
- [ ] No hay código muerto (`{false && ...}`, funciones nunca llamadas, imports sin usar)
- [ ] Los handlers pasados como props a listas están en `useCallback`
- [ ] Los nuevos componentes que van en listas usan `React.memo`

**Cuándo invocarla:** Antes de cada `git commit`. Escribir en Claude Code:
```
Aplica el code review checklist de CLAUDE.md a los archivos modificados en este sprint
antes de hacer el commit.
```

### Accessibility checker skill
Verificar que los componentes de UI cumplen estándares de accesibilidad WCAG 2.1 nivel AA.

**Cuándo usarla — obligatorio al tocar estos componentes:**
- Al añadir los botones de tema en el header (FEATURE-01)
- Al reorganizar el header con dropdowns (FEATURE-03)
- Al modificar `SectionItemCard` (FEATURE-05)
- Al añadir el indicador de auto-guardado (FEATURE-04)

**Reglas que esta skill aplica en este proyecto:**
- Todos los botones icon-only necesitan `aria-label` descriptivo
  - Ejemplo: `<Button aria-label="Cambiar a tema oscuro">`
- Los `DropdownMenu` necesitan `aria-haspopup="true"` y `aria-expanded`
- Contraste mínimo: texto normal 4.5:1, texto grande 3:1
  - ⚠️ Los botones verdes del tema Hacker (`#00ff00` sobre negro) cumplen — no cambiar
  - ⚠️ En tema Light verificar que el azul primario sobre blanco cumple contraste
- Los toasts deben tener `role="alert"` para lectores de pantalla
- El indicador de auto-guardado (FEATURE-04) necesita `aria-live="polite"`
- Al usar Playwright para verificar accesibilidad:
  ```
  Navega a localhost:3000 y usa el inspector de accesibilidad para verificar
  que todos los botones del header tienen aria-label y que el contraste de
  texto es adecuado en los tres temas.
  ```

---

## 🔄 Flujo completo de trabajo por sprint

```
1. GitHub MCP: crear rama fix/sprint-N
2. Implementar el bug/feature según instrucciones del sprint
3. React/TypeScript skill: verificar patrones correctos durante la implementación
4. Code Review skill: pasar el checklist antes de commitear
5. Playwright MCP: ejecutar los casos de prueba visuales del sprint
6. Accessibility skill: verificar a11y si el sprint toca UI
7. GitHub MCP: commit con formato estándar + abrir PR
```

---

## 🐛 BUGS PENDIENTES DE CORREGIR (por prioridad)

### SPRINT 1 — Bugs críticos (empezar aquí)

**BUG-01: API Key nunca se borra**
- Archivo: `src/components/AppLayout.tsx` función `handleDeleteApiKey` (~línea 104)
- El problema: llama a `localStorage.removeItem('USER_GOOGLE_AI_API_KEY')` pero la clave real está bajo `localStorage.removeItem('aiApiKey')` y `localStorage.removeItem('aiProvider')`
- Fix: cambiar la función para borrar las claves correctas
- Verificar con Playwright: configurar una clave → borrarla → recargar → debe haber desaparecido

**BUG-02: Pérdida de datos al cambiar sección**
- Archivo: `src/contexts/WriteUpContext.tsx` casos `SET_ACTIVE_SECTION` y `SET_VIEW`
- El problema: ambos casos setean `isDirty: false`, cancelando el timer de autosave de 1s
- Fix: eliminar `isDirty: false` de esos dos casos. `isDirty` solo debe ponerse `false` cuando el localStorage confirma la escritura
- Verificar con Playwright: editar → cambiar sección rápido → recargar → texto debe persistir

**BUG-03: WysiwygEditor destruye el formato al escribir**
- Archivo: `src/components/WysiwygEditor.tsx`
- El problema: el `useEffect` llama a `setContent(processTemplateContent(value))` en cada tecla. `processTemplateContent` envuelve HTML en `<p>` extra → HTML inválido → TipTap normaliza y borra el formato
- Fix completo:
  1. Añadir `const isInternalChange = useRef(false)` 
  2. En `onUpdate`, poner `isInternalChange.current = true` antes de `onChange()`
  3. En `useEffect`, si `isInternalChange.current === true`, sólo resetear el ref y hacer return
  4. Reemplazar `processTemplateContent` por una función que detecte si el contenido ya es HTML (starts with `<`) y lo pase tal cual, o si es Markdown lo convierta con `marked.parse()` (ya está en package.json)
- Verificar con Playwright: seleccionar texto → pulsar Bold → seguir escribiendo → negrita debe mantenerse

**BUG-04: @ts-nocheck en AppLayout.tsx**
- Archivo: `src/components/AppLayout.tsx` línea 1
- Fix: eliminar la línea `// @ts-nocheck` y corregir los errores de TypeScript que aparezcan (mayoritariamente serán parámetros `any` en handlers de i18n — tiparlos correctamente o usar `as any` explícito donde sea necesario)
- Verificar: `npm run typecheck` debe pasar sin errores

**BUG-05: Código muerto**
- Archivo: `src/components/AppLayout.tsx` ~línea 870
- Hay un bloque `{false && userSections.length > 0 ? (... 25 líneas ...) : (...)}` — eliminar el bloque entero (el renderizado correcto es el DragDropContext que está justo encima)
- Eliminar también: `console.log("Draft saved to localStorage")` en `WriteUpContext.tsx` línea ~275

---

### SPRINT 2 — Estabilidad

**BUG-06: localStorage sin manejo de QuotaExceededError**
- Archivo: `src/contexts/WriteUpContext.tsx` función autosave (~línea 271)
- Fix: envolver el `localStorage.setItem` en try/catch específico para `DOMException` con `name === 'QuotaExceededError'`. Mostrar un toast de warning al usuario usando el sistema de toast existente (importar `useToast` no es posible en el contexto — pasar el error como acción al reducer y que un componente lo muestre, o usar un evento custom)

**BUG-07: Centralizar claves de localStorage**
- Archivo: `src/lib/constants.ts`
- Añadir al final del archivo:
```ts
export const STORAGE_KEYS = {
  writeUp: 'ctfWriteUpBuilder_draft',
  aiApiKey: 'aiApiKey',
  aiProvider: 'aiProvider',
} as const;
```
- Reemplazar todos los strings literales de localStorage en AppLayout.tsx, ApiKeyConfigModal.tsx, ActiveSectionEditor.tsx y WriteUpContext.tsx por las constantes

**BUG-08: react-beautiful-dnd deprecated → migrar a @dnd-kit**
- Desinstalar: `npm uninstall react-beautiful-dnd`
- Instalar: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Reescribir el drag-and-drop en `StructureAndAddSectionsPanel` dentro de `AppLayout.tsx`
- La lógica de reordenado (`handleDragEnd`) se mantiene igual, solo cambia la API del componente wrapper
- Verificar con Playwright: crear 3+ secciones → arrastrar → el orden debe actualizarse y persistir

---

### SPRINT 3 — Sistema de temas

**FEATURE-01: Añadir temas Light y Dark a la app**

1. **`src/app/globals.css`**: mantener `:root` con el tema Hacker actual. Añadir debajo:
```css
[data-theme="dark"] {
  --background: 220 15% 10%;
  --foreground: 210 20% 88%;
  --muted: 220 15% 16%;
  --muted-foreground: 210 15% 55%;
  --card: 220 15% 13%;
  --card-foreground: 210 20% 88%;
  --border: 220 15% 22%;
  --input: 220 15% 14%;
  --primary: 210 100% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 15% 18%;
  --secondary-foreground: 210 20% 75%;
  --accent: 210 100% 70%;
  --accent-foreground: 0 0% 0%;
  --ring: 210 100% 60%;
  --radius: 0.5rem;
}
[data-theme="light"] {
  --background: 0 0% 98%;
  --foreground: 220 15% 18%;
  --muted: 210 15% 93%;
  --muted-foreground: 220 10% 45%;
  --card: 0 0% 100%;
  --card-foreground: 220 15% 18%;
  --border: 210 15% 82%;
  --input: 210 15% 94%;
  --primary: 210 100% 40%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 15% 90%;
  --secondary-foreground: 220 15% 25%;
  --accent: 210 100% 50%;
  --accent-foreground: 0 0% 100%;
  --ring: 210 100% 45%;
  --radius: 0.5rem;
}
```

2. **Crear `src/contexts/ThemeContext.tsx`**:
```tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
export type AppTheme = 'hacker' | 'dark' | 'light';
interface ThemeCtx { theme: AppTheme; setTheme: (t: AppTheme) => void; }
const ThemeContext = createContext<ThemeCtx>({ theme: 'hacker', setTheme: () => {} });
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('hacker');
  useEffect(() => {
    const saved = localStorage.getItem('ctf-app-theme') as AppTheme;
    if (saved && ['hacker','dark','light'].includes(saved)) setThemeState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ctf-app-theme', theme);
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeContext.Provider>;
};
export const useAppTheme = () => useContext(ThemeContext);
```

3. **`src/app/[locale]/layout.tsx`**: envolver children en `<ThemeProvider>`

4. **`src/components/AppLayout.tsx`**: añadir 3 botones de tema en el header (>_ / 🌙 / ☀️) usando `useAppTheme()`. Cada botón necesita `aria-label` descriptivo (Accessibility skill).
- Verificar con Playwright: los 3 botones cambian el tema y la preferencia persiste tras recargar
- Verificar con Accessibility skill: contraste correcto en tema Light

---

### SPRINT 4 — PDF mejorado

**FEATURE-02: Exportación PDF con jsPDF + html2canvas**
- Instalar: `npm install jspdf html2canvas`
- Instalar tipos: `npm install --save-dev @types/html2canvas` (si existen) 
- Archivo: `src/components/PdfExportModal.tsx` función `handleExport`
- Reemplazar la lógica del iframe+window.print() por:
  1. Crear instancia `new jsPDF({ unit: 'pt', format: 'a4' })`
  2. Para cada sección del writeup, clonar el DOM element, aplicar `img { max-height: 300px; object-fit: contain }` al clone, renderizar con `html2canvas(clone, { scale: 2, useCORS: true })`
  3. Calcular si la sección renderizada cabe en el espacio restante de la página. Si no cabe → `pdf.addPage()`
  4. Añadir canvas al PDF con `pdf.addImage()`
  5. Al final, añadir número de página en cada hoja
  6. `pdf.save('nombre-del-writeup.pdf')`
- Verificar con Playwright: crear writeup con imágenes grandes → exportar → PDF sin páginas vacías

---

### SPRINT 5 — UX / diseño (opcional)

**FEATURE-03: Reorganizar header**
- Condensar los 14 botones en: acciones primarias visibles + DropdownMenu para secundarias
- Grupo principal: [Nuevo] [Guardar] [Vista] [Export MD] [Export PDF]
- Dropdown "⚙️ Config": API Key · Idioma · About
- Dropdown "📥 Importar": JSON · MD · Backup
- Aplicar Accessibility skill: `aria-haspopup`, `aria-expanded`, `aria-label` en todos los botones

**FEATURE-04: Indicador de auto-guardado**
- En el header, junto al botón Guardar, mostrar:
  - `● Guardando...` cuando `isDirty === true`
  - `✓ Guardado` cuando `isDirty === false` (con fade-out a los 3s)
- El elemento debe tener `aria-live="polite"` (Accessibility skill)

**FEATURE-05: React.memo en SectionItemCard**
- `src/components/SectionItemCard.tsx`: exportar con `React.memo()`
- `src/components/AppLayout.tsx` en `StructureAndAddSectionsPanel`: envolver `handleSelectSection` y `handleDeleteSection` en `useCallback`

---

## ⛔ No tocar
- `src/components/ui/` — componentes shadcn, no modificar
- `src/middleware.ts` — i18n routing, no tocar
- `src/ai/genkit.ts` — configuración de Genkit AI
- La lógica de encriptación base64 de la API key (es intencional aunque simple)
