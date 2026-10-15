import { useRef, type CSSProperties } from 'react'
import { span, useLazyScene } from '../lib/scene'
import ExperimentFrame, { SceneStatus } from './ExperimentFrame'

const load = () => import('./three/productScene')

/** Background and type layers behind the transparent WebGL canvas. */
export default function Product() {
  const host = useRef<HTMLDivElement>(null)
  const canvasHost = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const scene = useLazyScene(host, canvasHost, load)

  const onProgress = (p: number) => {
    scene.setProgress(p)
    const el = layer.current
    if (!el) return
    el.style.setProperty('--s1', String(span(p, 0.2, 0.42))) // green
    el.style.setProperty('--s2', String(span(p, 0.42, 0.52) - span(p, 0.68, 0.78))) // bone, exploded view
    el.style.setProperty('--s3', String(span(p, 0.74, 0.92))) // hero
    el.style.setProperty('--labels', String(span(p, 0.48, 0.55) - span(p, 0.64, 0.7)))
    const light = span(p, 0.42, 0.52) - span(p, 0.68, 0.78) > 0.5
    el.closest('.exp')?.classList.toggle('is-light', light)
  }

  return (
    <ExperimentFrame
      id="exp-producto"
      index={2}
      name="Producto"
      line="Un objeto, cuatro luces, una campaña."
      theme="exp-product"
      length={420}
      onProgress={onProgress}
      tech={{
        stack: 'three.js · PBR · HDRI (PMREM) · SpotLight',
        points: [
          'Reloj de bolsillo escaneado (Poly Haven, CC0) con materiales PBR iluminados por un HDRI de estudio.',
          'Las agujas son piezas independientes: marcan la hora real de tu dispositivo y se separan en la vista despiezada.',
          'Canvas transparente: los fondos y la tipografía son HTML detrás del objeto 3D.',
        ],
      }}
      status={<SceneStatus status={scene.status} />}
    >
      {() => (
        <div ref={host} className="prod" style={{ position: 'absolute', inset: 0 }}>
          <div ref={layer} className="prod-layer" style={{ '--s1': 0, '--s2': 0, '--s3': 0 } as CSSProperties}>
            <div className="prod-bg prod-bg-1" />
            <div className="prod-bg prod-bg-2" />
            <div className="prod-bg prod-bg-3" />
            <p className="display prod-hero" aria-hidden="true">
              Hecho
              <br />a tiempo.
            </p>
            <ul className="prod-labels" aria-hidden="true">
              <li>Segundero</li>
              <li>Minutero</li>
              <li>Horario</li>
            </ul>
          </div>
          <div ref={canvasHost} style={{ position: 'absolute', inset: 0 }} />
        </div>
      )}
    </ExperimentFrame>
  )
}
