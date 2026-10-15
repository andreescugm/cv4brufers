# Research

## 1. Brufers Club — identidad pública

**Resultado: no verificada.** Lo que se intentó (15/10/2026):

| Fuente | Resultado |
|---|---|
| Búsqueda web «Brufers Club Talavera», «"Brufers" inteligencia artificial automatización», «brufers club web» | Sin resultados relevantes (Google corrige a «Buffers Club», un salón de uñas en Yakarta). |
| `brufers.club`, `brufersclub.com` (WebFetch y navegador) | El fetch responde con bloqueo de robots; el navegador no carga ninguno de los dos dominios. No confirma que sean de la empresa. |
| DuckDuckGo «brufers» | Una cuenta de Instagram `@brufers_____` (179 seguidores, 1 publicación) y un usuario de GitHub `Brufers` sin repositorios públicos. Nada vincula ninguno con la empresa. |

**Decisión.** No se inventa la identidad: no hay logo, colores ni tipografía de Brufers en la web. El Acto II usa la paleta provisional del brief (negro metálico, grafito, blanco), definida como tokens `--metal-*`, `--graphite`, `--steel`, `--chrome` en `src/index.css`, para sustituirla en un sitio cuando Gabriel pase la URL real. El nombre «Brufers Club» aparece solo como texto en la tipografía del proyecto.

**Pendiente para Gabriel:** facilitar la web/Instagram oficial; con eso se ajustan los tokens del Acto II y, si procede, se cita algún proyecto suyo en las razones.

## 2. Skills y herramientas evaluadas

| Herramienta | Repo verificado | Licencia | Compatibilidad | Qué aporta | Decisión |
|---|---|---|---|---|---|
| UI/UX Pro Max | `nextlevelbuilder/ui-ux-pro-max-skill` (clonado) | MIT | Ya instalada en el entorno como skill `ui-ux-pro-max` | Base de datos de estilos/paletas/tipografías por sector | No reinstalada (duplicaría). Sus patrones son genéricos para SaaS; el brief fija la dirección por actos, así que no aportaba una decisión que faltara. |
| Anthropic frontend-design | `anthropics/skills` (clonado) | Ver LICENSE del repo | Ya disponible en `/mnt/skills/public/frontend-design` | Proceso plan → revisión contra defaults → build → crítica | **Usada.** Copiada a `.claude/skills/frontend-design`. Aplicada: lista de «tells» de IA, una sola idea fuerte por sección, sin eyebrow labels. |
| Impeccable 4.5.2 | `pbakaus/impeccable` (clonado) | Apache-2.0 | Skill para Claude Code + CLI npm (`impeccable`), Node ≥18 | `craft-floor` (suelo de calidad) y **detector determinista de 59 reglas** | **Instalada y usada.** Skill copiada a `.claude/skills/impeccable`. El lanzador de la skill descarga un binario remoto en el primer uso: no se ejecutó; en su lugar se usó el CLI publicado en npm (`npx impeccable@4.5.2 detect`). Resultados en QA_REPORT. |
| Taste Skill | `leonxlnx/taste-skill` (clonado) | MIT | 14 sub-skills en `skills/` | Variantes de dirección (brutalist, minimalist, soft…) | **Instalada parcialmente:** solo `brutalist-skill` → `.claude/skills/industrial-brutalist-ui`. Usada para la retícula y escala tipográfica de Actos II–III. Las demás duplicaban frontend-design. `install.sh` no se ejecutó (copia manual de la carpeta revisada). |
| design-taste-frontend | Ya instalada en el entorno | — | — | Anti-slop | Solapa con frontend-design + Impeccable: no usada. |
| visual-asset-intelligence | Ya instalada en el entorno | — | — | Método para assets 3D y su búsqueda en bibliotecas CC0 | **Usada** para localizar modelos (índice `Jpalmer95/cc0-asset-index` → Poly Haven). |
| Playwright 1.56 + Chromium | npm / navegador preinstalado | Apache-2.0 | Chromium headless con SwiftShader (WebGL por software) | Capturas por escena, consola, pruebas de interacción | **Instalado y usado** (`qa/shoot.mjs`, `qa/interact.mjs`). |

## 3. Referencias de diseño y técnica (patrones extraídos, no copiados)

- **Scroll como línea de tiempo** (patrón de las presentaciones de producto tipo Apple): `position: sticky` + progreso de sección → timeline GSAP en pausa con `progress(p)`. Rebobina exactamente al subir, sin «pin spacers» que rompan el layout.
- **Pasillo en perspectiva CSS 3D**: planos con `transform-style: preserve-3d` y `perspective`; una cámara que solo es `translateZ`. Barato y nítido frente a una escena WebGL para el Acto I.
- **Zoom a través de una letra** (transiciones tipográficas editoriales): escalar un solo glifo hasta que su trazo llena la pantalla y se convierte en el siguiente fondo.
- **Disolución de texto en partículas**: muestrear los píxeles del texto en un canvas y convertir cada uno en una partícula cuya posición es función pura del scroll (determinista y reversible).
- **Composición de canvas transparente sobre HTML** (campañas de producto 3D): fondos y tipografía en DOM detrás del objeto WebGL.
- **Ciudad procedural con instancing y fachadas en shader** (demoscene / generadores de ciudades): una caja unitaria, cientos de instancias, ventanas calculadas en el fragment shader.
- **Barrido de material con plano de recorte** (configuradores de producto): dos mallas, un plano que avanza; una línea marca la frontera.
