import { useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { useSectionProgress, span } from '../lib/scene'
import { useReducedMotion } from '../lib/motion'
import './experiments.css'

export interface TechNote {
  stack: string
  points: string[]
}

interface Props {
  id: string
  index: number
  name: string
  line: string
  tech: TechNote
  theme: string
  /** section height in viewport units: longer = slower scroll story */
  length?: number
  onProgress?: (p: number) => void
  children: (stageRef: RefObject<HTMLDivElement | null>) => ReactNode
  /** a status label rendered over the stage (loading, fallback) */
  status?: ReactNode
  /** extra controls (interactive experiments) */
  controls?: ReactNode
}

export default function ExperimentFrame({
  id,
  index,
  name,
  line,
  tech,
  theme,
  length = 360,
  onProgress,
  children,
  status,
  controls,
}: Props) {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useSectionProgress(root, (p) => {
    const el = root.current
    if (el) {
      // entry: the stage opens from a letterbox; exit: it closes again
      const open = reduced ? 1 : span(p, 0, 0.08)
      const close = reduced ? 0 : span(p, 0.94, 1)
      el.style.setProperty('--open', String(open))
      el.style.setProperty('--close', String(close))
      el.style.setProperty('--p', String(p))
    }
    onProgress?.(p)
  })

  return (
    <section
      ref={root}
      id={id}
      className={`exp ${theme}`}
      style={{ '--len': `${length}vh` } as CSSProperties}
      aria-labelledby={`${id}-name`}
    >
      <div className="exp-sticky">
        <div className="exp-stage" ref={stage}>
          {children(stage)}
          {status}
        </div>
        <header className="exp-head">
          <p className="exp-num" aria-hidden="true">
            {String(index).padStart(2, '0')}
            <span>/05</span>
          </p>
          <h3 className="display exp-name" id={`${id}-name`}>
            {name}
          </h3>
          <p className="exp-line">{line}</p>
        </header>
        {controls && <div className="exp-controls">{controls}</div>}
        <details className="exp-tech">
          <summary>Cómo está hecho</summary>
          <p className="exp-stack">{tech.stack}</p>
          <ul>
            {tech.points.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
        <div className="exp-progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  )
}

export function SceneStatus({ status, fallback }: { status: string; fallback: ReactNode }) {
  if (status === 'ready') return null
  if (status === 'unsupported' || status === 'error')
    return <div className="exp-fallback">{fallback}</div>
  return (
    <div className="exp-loading" role="status">
      Cargando escena…
    </div>
  )
}
