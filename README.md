# Gabriel Andreescu → Brufers Club

Presentación web interactiva en cinco actos, construida para pedir una conversación profesional con Brufers Club.

**Web publicada:** https://andreescugm.github.io/cv4brufers/ (se despliega sola con cada `push` a `main` mediante GitHub Actions).

## Ejecutar en local

Requiere Node 20.19 o superior.

```bash
git clone https://github.com/andreescugm/cv4brufers.git
cd cv4brufers
npm install
npm run dev        # http://localhost:5173
```

Producción:

```bash
npm run build      # genera dist/
npm run preview    # http://localhost:4173
```

## Datos personales

Todo está en `src/content/profile.ts`: retrato, teléfono (+34 642 117 961, activa los botones de WhatsApp y llamada), correo y la frase del cierre.

## Estructura

- `src/acts/` — los cinco actos.
- `src/experiments/` — los cinco experimentos del Acto IV; las escenas 3D están en `src/experiments/three/` y se cargan solo al acercarse.
- `public/models/` — modelos 3D comprimidos (meshopt + WebP). Créditos y licencias en `ASSET_MANIFEST.md` y `licenses/`.
- `qa/` — scripts de capturas y pruebas con Playwright (`npm i -D playwright` para usarlos).

Documentación interna: `PROJECT_BRIEF.md`, `RESEARCH.md`, `DESIGN.md`, `IMPLEMENTATION_PLAN.md`, `ASSET_MANIFEST.md`, `QA_REPORT.md`.
