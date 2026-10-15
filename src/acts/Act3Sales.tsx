import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useReducedMotion } from '../lib/motion'
import { span, useSectionProgress } from '../lib/scene'
import './act3.css'

/* ── Micro-interactions, one per panel, each one a working model of the idea ── */

function SubyHeadline() {
  const [after, setAfter] = useState(false)
  return (
    <div className="m-suby">
      <p className="m-suby-line" aria-live="polite">
        {after ? 'Tu equipo deja de copiar datos a mano el lunes que viene.' : 'Soluciones de inteligencia artificial para empresas.'}
      </p>
      <button type="button" className="m-btn" aria-pressed={after} onClick={() => setAfter((v) => !v)}>
        {after ? 'Ver el titular genérico' : 'Reescribir como respuesta directa'}
      </button>
    </div>
  )
}

function BelfortLine() {
  const [v, setV] = useState({ producto: 4, vendedor: 6, empresa: 3 })
  const avg = (v.producto + v.vendedor + v.empresa) / 30
  // the less certainty, the more the line wanders
  const wobble = (1 - avg) * 34
  const d = `M0 40 C 60 ${40 - wobble}, 120 ${40 + wobble}, 180 ${40 - wobble * 0.6} S 300 ${40 + wobble * 0.8}, 360 40`
  return (
    <div className="m-belfort">
      <svg viewBox="0 0 360 80" className="m-belfort-svg" role="img" aria-label={`Certeza media ${Math.round(avg * 10)} de 10`}>
        <path d={d} />
        <circle cx="360" cy="40" r="6" />
      </svg>
      {(Object.keys(v) as (keyof typeof v)[]).map((k) => (
        <label key={k} className="m-range">
          <span>Certeza en {k === 'producto' ? 'el producto' : k === 'vendedor' ? 'quien vende' : 'la empresa'}</span>
          <input type="range" min={0} max={10} value={v[k]} onChange={(e) => setV({ ...v, [k]: +e.target.value })} />
          <output>{v[k]}</output>
        </label>
      ))}
    </div>
  )
}

type Factors = { outcome: number; likelihood: number; time: number; effort: number }

function Factor({ value, label, onStep }: { value: number; label: string; onStep: (d: number) => void }) {
  return (
    <div className="m-factor">
      <span>{label}</span>
      <div>
        <button type="button" className="m-step" aria-label={`Bajar ${label}`} onClick={() => onStep(-1)}>
          −
        </button>
        <b aria-label={`${label}: ${value}`}>{value}</b>
        <button type="button" className="m-step" aria-label={`Subir ${label}`} onClick={() => onStep(1)}>
          +
        </button>
      </div>
    </div>
  )
}

function HormoziEquation() {
  const [f, setF] = useState<Factors>({ outcome: 6, likelihood: 5, time: 6, effort: 7 })
  const value = (f.outcome * f.likelihood) / (f.time * f.effort)
  const pct = Math.min(100, (value / 4) * 100)
  const step = (k: keyof Factors) => (d: number) =>
    setF((s) => ({ ...s, [k]: Math.min(10, Math.max(1, s[k] + d)) }))
  const F = (k: keyof Factors, label: string) => <Factor value={f[k]} label={label} onStep={step(k)} />
  return (
    <div className="m-hormozi">
      <div className="m-frac">
        <div className="m-row">
          {F('outcome', 'Resultado soñado')}
          {F('likelihood', 'Probabilidad percibida')}
        </div>
        <div className="m-bar-line" />
        <div className="m-row">
          {F('time', 'Tiempo de espera')}
          {F('effort', 'Esfuerzo y sacrificio')}
        </div>
      </div>
      <div className="m-value" aria-live="polite">
        <span>Valor percibido</span>
        <div className="m-meter">
          <i style={{ width: `${pct}%` }} />
        </div>
        <b>{value.toFixed(2)}</b>
      </div>
    </div>
  )
}

function HughesLens() {
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [open, setOpen] = useState(false)
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  return (
    <div
      className={`m-hughes ${open ? 'is-open' : ''}`}
      onPointerMove={move}
      style={{ '--mx': `${pos.x}%`, '--my': `${pos.y}%` } as CSSProperties}
    >
      <p className="m-hughes-say">“Nos interesa automatizar procesos.”</p>
      <p className="m-hughes-mean" aria-hidden={!open}>
        Llevan dos semanas cerrando el mes a mano y el gerente está agotado.
      </p>
      <button type="button" className="m-btn" aria-pressed={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Ocultar lo que no dicen' : 'Ver lo que no dicen'}
      </button>
    </div>
  )
}

const PANELS = [
  {
    name: ['Sabri', 'Suby'],
    field: 'Copy de respuesta directa',
    learn:
      'Escribir para quien todavía no está buscando: un dolor concreto, una oferta que da vergüenza rechazar y un siguiente paso evidente.',
    apply:
      'Una landing para un servicio de automatización que no hable de “IA”, sino del lunes en que el cliente deja de perder horas.',
    demo: <SubyHeadline />,
  },
  {
    name: ['Jordan', 'Belfort'],
    field: 'Venta en línea recta',
    learn:
      'Su sistema de venta reduce la decisión a tres certezas: en el producto, en quien lo vende y en la empresa. Si una flojea, la conversación se tuerce.',
    apply:
      'Llamadas de descubrimiento para proyectos de IA que avanzan sin rodeos de la primera pregunta a la propuesta.',
    demo: <BelfortLine />,
  },
  {
    name: ['Alex', 'Hormozi'],
    field: 'Construcción de ofertas',
    learn:
      'La ecuación de valor: subir el resultado y la probabilidad percibida, bajar la espera y el esfuerzo. El precio pasa a segundo plano.',
    apply:
      'Empaquetar automatizaciones como resultados con plazo, no como horas de desarrollo.',
    demo: <HormoziEquation />,
  },
  {
    name: ['Chase', 'Hughes'],
    field: 'Comportamiento y comunicación',
    learn:
      'Observar antes de hablar: qué necesita la otra persona, cómo decide y qué no está diciendo con palabras.',
    apply:
      'Detectar en una reunión el problema real de un cliente antes de proponerle tecnología.',
    demo: <HughesLens />,
  },
]

export default function Act3Sales() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useSectionProgress(root, (p) => {
    const t = track.current
    if (!t || reduced || window.innerWidth < 860) {
      if (t) t.style.transform = ''
      return
    }
    const max = t.scrollWidth - window.innerWidth
    t.style.transform = `translate3d(${-span(p, 0.04, 0.92) * max}px,0,0)`
  })

  return (
    <section ref={root} id="acto-3" className={`act3 ${reduced ? 'is-static' : ''}`} aria-labelledby="a3-title">
      <div className="a3-sticky">
        <div className="a3-track" ref={track}>
          <header className="a3-intro">
            <h2 id="a3-title" className="display">
              Ventas,
              <br />
              marketing
              <br />y psicología
            </h2>
            <p>
              La parte que no se ve en un perfil técnico. Cuatro personas a las que he estudiado y lo que me llevo de cada
              una. No son certificados: son ideas que sé aplicar.
            </p>
          </header>
          {PANELS.map((pnl, i) => (
            <article className={`a3-panel a3-panel-${i}`} key={pnl.name[1]} aria-label={pnl.name.join(' ')}>
              <h3 className="display a3-name">
                <span>{pnl.name[0]}</span>
                <span>{pnl.name[1]}</span>
              </h3>
              <p className="a3-field">{pnl.field}</p>
              <div className="a3-copy">
                <p>
                  <em>Lo que me llevo.</em> {pnl.learn}
                </p>
                <p>
                  <em>Cómo lo aplicaría.</em> {pnl.apply}
                </p>
              </div>
              <div className="a3-demo">{pnl.demo}</div>
            </article>
          ))}
          <footer className="a3-outro">
            <p className="display">
              Podría seguir intentando convenceros con palabras.
              <span> Prefiero enseñaros lo que sé construir.</span>
            </p>
          </footer>
        </div>
      </div>
    </section>
  )
}
