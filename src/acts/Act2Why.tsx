import { useRef } from 'react'
import { profile } from '../content/profile'
import { useReducedMotion } from '../lib/motion'
import { span, useSectionProgress } from '../lib/scene'
import './act2.css'

/**
 * Las razones son el único texto que solo Gabriel puede confirmar:
 * edítalas aquí si quieres afinarlas.
 */
const REASONS = [
  {
    k: 'Lo que he construido',
    v: `Monté ${profile.company}: ${profile.companyWhat}. Sé lo que cuesta vender, entregar y mantener un proyecto de IA a una empresa real.`,
  },
  {
    k: 'Por qué vosotros',
    v: 'Llevo meses siguiendo lo que hacéis. Trabajáis en lo mismo que me obsesiona y lo hacéis desde Talavera, donde vivo.',
  },
  {
    k: 'Lo que traigo',
    v: 'Criterio técnico, ganas de construir y una parte comercial que no suele venir incluida en un perfil técnico.',
  },
]

export default function Act2Why() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useSectionProgress(root, (p) => {
    const el = root.current
    if (!el || reduced) return
    // a single sweep of white light crosses the title, then the reasons rise
    el.style.setProperty('--sweep', `${-30 + span(p, 0.02, 0.4) * 160}%`)
    el.style.setProperty('--title-y', `${(1 - span(p, 0, 0.25)) * 8}vh`)
    REASONS.forEach((_, i) => {
      el.style.setProperty(`--r${i}`, String(span(p, 0.3 + i * 0.13, 0.42 + i * 0.13)))
    })
    el.style.setProperty('--exit', String(span(p, 0.86, 1)))
  })

  return (
    <section ref={root} id="acto-2" className={`act2 ${reduced ? 'is-static' : ''}`} aria-labelledby="a2-title">
      <div className="a2-sticky">
        <h2 id="a2-title" className="display a2-title">
          <span>¿Por qué</span>
          <span className="a2-brand">Brufers Club?</span>
        </h2>
        <dl className="a2-reasons">
          {REASONS.map((r, i) => (
            <div className="a2-reason" key={r.k} style={{ ['--i' as string]: `var(--r${i}, 1)` }}>
              <dt>{r.k}</dt>
              <dd>{r.v}</dd>
            </div>
          ))}
        </dl>
        <p className="a2-foot">
          He construido esta web para enseñaros, en lugar de contaros, lo que puedo aportar.
        </p>
      </div>
    </section>
  )
}
