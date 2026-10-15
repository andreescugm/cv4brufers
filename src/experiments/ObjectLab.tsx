import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useLazyScene } from '../lib/scene'
import ExperimentFrame, { SceneStatus } from './ExperimentFrame'
import type { ObjectSceneApi } from './three/objectScene'

const load = () => import('./three/objectScene')
const MODES = ['Mármol', 'Cromo', 'Calor', 'Malla']

export default function ObjectLab() {
  const host = useRef<HTMLDivElement>(null)
  const canvasHost = useRef<HTMLDivElement>(null)
  const scene = useLazyScene(host, canvasHost, load)
  const [mode, setMode] = useState(0)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const api = () => scene.apiRef.current as ObjectSceneApi | null

  const pointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    scene.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
    if (drag.current) {
      const dx = (e.clientX - drag.current.x) / r.width
      const dy = (e.clientY - drag.current.y) / r.height
      api()?.drag(dx * 5, dy * 2)
      drag.current = { x: e.clientX, y: e.clientY }
    }
  }
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]
    if (!k) return
    e.preventDefault()
    api()?.nudge(k[0], k[1])
  }
  const choose = (i: number) => {
    setMode(i)
    api()?.setMode(i)
  }

  return (
    <ExperimentFrame
      id="exp-objeto"
      index={5}
      name="El objeto"
      line="Ahora mandas tú. Arrástralo, gíralo, cámbiale el material."
      theme="exp-object"
      length={240}
      onProgress={scene.setProgress}
      tech={{
        stack: 'three.js · MeshPhysicalMaterial · planos de recorte · Pointer Events',
        points: [
          'Busto de mármol escaneado (Poly Haven, CC0).',
          'Arrastre con inercia; funciona con ratón, dedo y flechas del teclado.',
          'La luz principal sigue al cursor o al dedo.',
          'El cambio de material es un barrido con un plano de recorte, no un fundido.',
        ],
      }}
      status={<SceneStatus status={scene.status} />}
      controls={
        <div className="obj-modes" role="radiogroup" aria-label="Material del busto">
          {MODES.map((m, i) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === i}
              className={`obj-mode ${mode === i ? 'is-on' : ''}`}
              onClick={() => choose(i)}
            >
              {m}
            </button>
          ))}
        </div>
      }
    >
      {() => (
        <div
          ref={host}
          className="obj-host"
          tabIndex={0}
          role="img"
          aria-label="Busto de mármol en 3D. Arrástralo o usa las flechas del teclado para girarlo."
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY }
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={pointer}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={key}
        >
          <div ref={canvasHost} style={{ position: 'absolute', inset: 0 }} />
        </div>
      )}
    </ExperimentFrame>
  )
}
