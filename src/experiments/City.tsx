import { useRef } from 'react'
import { useLazyScene } from '../lib/scene'
import ExperimentFrame, { SceneStatus } from './ExperimentFrame'

const load = () => import('./three/cityScene')

export default function City() {
  const host = useRef<HTMLDivElement>(null)
  const canvasHost = useRef<HTMLDivElement>(null)
  const scene = useLazyScene(host, canvasHost, load)
  return (
    <ExperimentFrame
      id="exp-ciudad"
      index={3}
      name="La ciudad"
      line="Una ciudad real, escaneada de noche. Vuela por encima."
      theme="exp-city"
      length={400}
      onProgress={scene.setProgress}
      tech={{
        stack: 'three.js · fotogrametría · shader de emisión · UnrealBloom',
        points: [
          'Osaka escaneada con fotogrametría (matousekfoto, CC BY 4.0): 5 MB tras comprimir los 61 MB originales con meshopt y WebP.',
          'Las luces son las de la ciudad real: un shader eleva solo los píxeles más brillantes de la textura y el bloom los recoge.',
          'Cámara tipo dron: plano general, descenso entre las torres y salida.',
        ],
      }}
      status={<SceneStatus status={scene.status} />}
    >
      {() => (
        <div ref={host} style={{ position: 'absolute', inset: 0 }}>
          <div ref={canvasHost} style={{ position: 'absolute', inset: 0 }} />
        </div>
      )}
    </ExperimentFrame>
  )
}
