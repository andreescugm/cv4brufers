# Implementation

**Stack:** Vite 8 · React 19 · TypeScript · GSAP 3 (ScrollTrigger registrado, timelines en pausa) · three.js r186 · Fontsource (fuentes autoalojadas). Sin smooth-scroll: el scroll es nativo.

```
src/
  content/profile.ts        ← datos personales editables (único sitio)
  lib/motion.ts             ← GSAP, reduced-motion, detección WebGL, calidad, tono del nav
  lib/scene.tsx             ← useSectionProgress (sticky + progreso), useLazyScene (carga/descarga 3D)
  components/Nav.tsx        ← índice de actos + «Hablemos», cambia de tono según el fondo
  acts/Act1American.tsx     ← póster + pasillo CSS 3D + giro (timeline GSAP)
  acts/Act2Why.tsx          ← titular metálico con barrido de luz + 3 razones
  acts/Act3Sales.tsx        ← pista horizontal de 4 paneles + 4 microinteracciones
  acts/Act4Proof.tsx        ← índice + 5 experimentos
  acts/Act5Close.tsx        ← partículas en canvas 2D + contacto + footer estático
  experiments/ExperimentFrame.tsx  ← marco común: letterbox, título, nota técnica, progreso
  experiments/{Jungle,Product,City,TypeCollision,ObjectLab}.tsx
  experiments/three/{jungle,product,city,object}Scene.ts  ← escenas (import dinámico)
```

**Patrón de scroll.** Cada sección es alta (240–640vh) y contiene un `position: sticky` de 100svh. `useSectionProgress` calcula 0..1 en un rAF por evento de scroll y lo entrega a la sección (variables CSS o `timeline.progress(p)`). Funciona igual bajando, subiendo y tras redimensionar.

**Ciclo de vida 3D (`useLazyScene`).**
- three.js y la escena se descargan cuando la sección está a ≤1,2 viewports (chunk separado de ~160 kB gzip; no entra en la carga inicial).
- El bucle de render corre solo mientras la sección está en pantalla.
- Geometrías, materiales, texturas y el renderer se liberan cuando la sección está a >3,2 viewports.
- Sin WebGL: mensaje alternativo dentro del escenario.
- Calidad `low` (móvil o ≤4 núcleos): menos instancias/partículas y DPR ≤1,25.

**Escenas.**
- *Jungla*: helechos/calatheas instanciados, FogExp2, haces de luz aditivos, polvo en Points, tigre procedural con shader de rayas, cambio de luz noche → amanecer.
- *Producto*: reloj glTF + HDRI vía PMREM, agujas con la hora real, vista despiezada, canvas transparente sobre capas HTML.
- *Ciudad*: InstancedMesh + ShaderMaterial (fachadas, ventanas, encendido progresivo), tráfico en GPU, plano de grúa final.
- *Colisión*: timeline GSAP con clip-path, escalado de glifo y cambio de jerarquía.
- *Objeto*: busto glTF, 4 materiales, barrido con plano de recorte, arrastre con inercia, luz que sigue al puntero, flechas de teclado.
