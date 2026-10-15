# Gabriel Andreescu → Brufers Club

Presentación web interactiva en cinco actos, construida para pedir una conversación profesional con Brufers Club.

## Ejecutar

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # build de producción en dist/
npm run preview    # sirve dist/ en http://localhost:4173
```

## Lo único que tienes que editar

`src/content/profile.ts`:

| Campo | Estado | Qué hacer |
|---|---|---|
| `photo` | **pendiente** | Copia tu foto con traje a `public/media/gabriel.jpg` y pon `'/media/gabriel.jpg'`. Mientras sea `null` se ve un marco rayado marcado como hueco. |
| `contact.phone` | **pendiente** | Tu móvil en formato `'+34600000000'`. Al rellenarlo aparecen automáticamente los botones de WhatsApp y llamada. |
| `contact.email` | rellenado | `andreescugm@proton.me`. Confirma que quieres que sea público o cámbialo. |
| `builtClaim` | revisar | «Todo esto se construyó en un día.» Es cierto para esta versión (15/10/2026). Si sigues editando otros días, ajústala. |

Las tres razones del Acto II están en `src/acts/Act2Why.tsx` (`REASONS`): son las únicas frases que hablan por ti; revísalas.

## QA

```bash
npm run build && npm run preview &
node qa/shoot.mjs qa/shots desktop full     # capturas por escena + consola
node qa/shoot.mjs qa/mobile mobile full
node qa/shoot.mjs qa/reduced desktop reduced
node qa/interact.mjs                        # pruebas funcionales
npx impeccable detect dist/index.html       # detector de patrones genéricos
```

Documentación interna: `PROJECT_BRIEF.md`, `RESEARCH.md`, `DESIGN.md`, `IMPLEMENTATION_PLAN.md`, `ASSET_MANIFEST.md`, `QA_REPORT.md`.
