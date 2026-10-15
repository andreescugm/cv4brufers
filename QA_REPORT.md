# QA report — 15/10/2026

Entorno: build de producción (`vite preview`), Chromium headless de Playwright 1.56 con WebGL por software (SwiftShader). Las capturas están en `qa/` (`final/`, `mobile/`, `reduced/`, `interact-*.png`).

## Comprobaciones ejecutadas

| Prueba | Resultado |
|---|---|
| `npm install` + `tsc -b` + `vite build` | OK, sin errores de tipos |
| oxlint | 1 aviso menor (setState en efecto al detectar falta de WebGL), sin errores |
| Consola en recorrido completo (escritorio, móvil, movimiento reducido) | 0 errores, 0 avisos tras las correcciones |
| Capturas por escena: escritorio 1440×900, móvil 390×844, reduced-motion | Revisadas a ojo, 3 pasadas |
| Microinteracciones Acto III (titular, sliders, ecuación, lente) | PASS |
| Botón de la ecuación conserva el foco tras pulsarlo | PASS |
| Objeto: montaje, cambio de material, arrastre, flechas | PASS |
| Nota técnica desplegable | PASS |
| Skip link (primer Tab) y llegada al contacto | PASS |
| Volver arriba restaura el póster del Acto I | PASS |
| Redimensionar con una escena 3D activa | PASS (canvas se adapta) |
| Liberación de escenas lejanas | PASS (solo la escena cercana tiene canvas) |
| Enlaces de contacto | `mailto:` funciona; WhatsApp/teléfono no se renderizan hasta tener el número |
| Detector Impeccable (`dist/index.html`) | 3 hallazgos, los 3 deliberados (ver DESIGN.md) |
| Carga inicial | JS 124 kB gzip + CSS 7 kB + fuentes; three.js (~160 kB gzip) y modelos (~7,4 MB) solo bajo demanda |

## Problemas encontrados y corregidos

1. Shader del tigre no compilaba (variable de niebla) → corregido.
2. El mensaje «Pero no he venido a venderos eso» nunca aparecía: GSAP leía el `translateY` del CSS como px y lo sumaba al `yPercent` → transform inicial movido a GSAP.
3. El suelo del pasillo se extendía hacia la cámara → rotación invertida; ahora el damero da la profundidad.
4. Banda de estrellas visible sobre el pasillo y costura entre franjas del telón → corregidas.
5. Nombre tapado por el retrato → póster en retícula nombre/retrato.
6. Tigre oculto tras el follaje → claro en la vegetación donde se detiene; giro adelantado antes del cierre.
7. Línea de tiempo de la colisión y del Acto I más corta que el scroll → normalizada a 1.
8. Nav con mezcla «difference» se volvía cian sobre rojo → color por sección; los actos que cambian de fondo lo controlan ellos.
9. Móvil: título de experimento bajo el botón «Hablemos», botones del objeto sobre el busto, etiquetas del reloj fuera de pantalla → recolocados/ocultos.
10. Componente de la ecuación se remontaba en cada render (perdía el foco) → extraído.
11. Fondo crema marcado por el detector → blanco puro en el Acto I.

## Limitaciones conocidas

- **Rendimiento real en GPU no medido**: las pruebas usan WebGL por software, que no refleja FPS reales. Hay que abrirla en un portátil y un móvil reales.
- **Identidad de Brufers Club sin verificar** (ver RESEARCH §1): paleta del Acto II provisional.
- **Tigre estilizado**: legible como silueta con rayas y ojos, no fotorrealista.
- Sin foto ni teléfono hasta que se rellenen en `profile.ts`.
- No probado en Safari/iOS ni Firefox (solo Chromium).
