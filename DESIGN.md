# Design

## Idea

Cinco mundos visuales encadenados por cortes diseñados. La broma del Acto I funciona por contraste: estética de campaña presidencial al máximo, contenido que la desmonta. A partir de ahí, cada acto cambia de material: mármol y bandera → metal → señal roja → cinco escenarios → fuego.

## Tipografía

| Rol | Familia | Por qué |
|---|---|---|
| Display (todos los actos) | **Big Shoulders Display** 700/900 (SIL OFL) | Grotesca condensada inspirada en la rotulación industrial de Chicago: americana sin ser una parodia, y lo bastante estrecha para titulares de 20vw. |
| Texto | **Instrument Sans** 400/600 (OFL) | Neutra y legible, no Inter. |
| Voz | **Instrument Serif** itálica (OFL) | Las frases dichas «en voz baja» (bylines, entradillas, el cierre). Contraste claro con la display. |
| Técnico | **JetBrains Mono** (OFL) | Solo en notas técnicas y contadores de los experimentos, donde sí es dato. |

Escala fluida en `src/index.css` (`--t-mega`, `--t-huge`, `--t-big`, `--t-mid`, `--t-body`).

## Paletas (tokens en `src/index.css`)

- **I** `--usa-red #B22234`, `--usa-blue #3C3B6E`, blanco — los valores de la especificación de la bandera, no aproximaciones.
- **II** `--metal-0 #08090A`, `--metal-1 #121316`, `--graphite #1D1F23`, `--steel #8C919A`, `--chrome #E9EBEE` — **provisional** (ver RESEARCH §1).
- **III** `--signal #D7261E`, `--signal-deep #A3160F`, `--signal-ink #FFF4EF`.
- **IV** cada experimento tiene su tema: jungla `#050806/#F3E6C4`, producto verde botella → hueso → ámbar, ciudad azul hora → noche, colisión cobalto `#1F37FF` sobre papel, objeto grafito.
- **V** `--void #050403`, `--ember #FF5A12`, `--flare #FFC36B`, `--ash #B9AEA3`.

## Composición

- Margen lateral único `--gutter: clamp(16px, 4vw, 56px)`; retícula de 12 columnas en II y IV; 6 columnas por panel en III.
- Cada sección tiene **un** elemento protagonista: el nombre (I), el titular metálico (II), el apellido de cada referente (III), la escena (IV), «Hablemos.» (V).
- Ancho de lectura ≤ 46ch en párrafos.
- Sin tarjetas redondeadas, sin eyebrows, sin gradientes decorativos. Esquinas a 90°.

## Movimiento

- Todo el movimiento de narración está atado al scroll y es reversible. Lo único que se mueve solo: el indicador de scroll del inicio, partículas ambientales y la respiración del tigre.
- Entradas de experimento: letterbox que se abre (clip-path) y se cierra al salir.
- `prefers-reduced-motion`: actos I, II, III, V y la colisión pasan a versiones estáticas apiladas; las escenas 3D no tienen animación autónoma y siguen respondiendo solo al scroll del usuario.

## Decisiones conscientes contra el detector (Impeccable)

- *gradient-text* en el título del Acto II: es la «iluminación blanca discreta» del brief, una banda de luz que recorre el metal con el scroll; no es decoración estática.
- *glow* naranja en «Hablemos.»: luz de fuego motivada por la escena del Acto V.
- *repeating stripes* en el Acto I: son las franjas de la bandera.
