import { useRef } from 'react'
import { useLazyScene } from '../lib/scene'
import ExperimentFrame, { SceneStatus } from './ExperimentFrame'

const load = () => import('./three/jungleScene')

export default function Jungle() {
  const host = useRef<HTMLDivElement>(null)
  const canvasHost = useRef<HTMLDivElement>(null)
  const scene = useLazyScene(host, canvasHost, load)
  return (
    <ExperimentFrame
      id="exp-jungla"
      index={1}
      name="La jungla"
      line="Algo se mueve entre las hojas. Baja despacio."
      theme="exp-jungle"
      length={420}
      onProgress={scene.setProgress}
      tech={{
        stack: 'three.js · AnimationMixer · InstancedMesh · sombras · HDRI',
        points: [
          'Tigre con esqueleto y 6 animaciones (kenchoo, CC BY 4.0). El ciclo de andar avanza según la distancia recorrida, medida en las patas: no patina.',
          'Al detenerse, el rugido se reproduce fotograma a fotograma con tu scroll.',
          'Árboles de jungla (gelmi.com.br, CC BY 4.0) y sotobosque escaneado de Poly Haven (CC0), instanciados.',
          'Iluminación de bosque real (HDRI) y un amanecer que recorta la silueta del animal.',
        ],
      }}
      status={
        <SceneStatus
          status={scene.status}
          fallback={<p>Tu navegador no tiene WebGL: esta escena necesita la GPU.</p>}
        />
      }
    >
      {() => (
        <div ref={host} style={{ position: 'absolute', inset: 0 }}>
          <div ref={canvasHost} style={{ position: 'absolute', inset: 0 }} />
        </div>
      )}
    </ExperimentFrame>
  )
}
