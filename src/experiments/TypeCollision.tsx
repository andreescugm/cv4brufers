import { useEffect, useRef } from 'react'
import { gsap, setNavTone, useReducedMotion } from '../lib/motion'
import ExperimentFrame from './ExperimentFrame'
import './type.css'

const TOP = 'AUTOMATIZA'
const BOTTOM = 'LO ABURRIDO'
const FINAL = ['Y dedica', 'el tiempo', 'a lo que', 'importa.']

export default function TypeCollision() {
  const stage = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const q = gsap.utils.selector(stage)
    const t = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    t.fromTo(q('.tc-top'), { xPercent: -110 }, { xPercent: 4, duration: 0.18, ease: 'power3.in' }, 0)
      .fromTo(q('.tc-bot'), { xPercent: 110 }, { xPercent: -4, duration: 0.18, ease: 'power3.in' }, 0)
      // impact: both words squash against each other
      .to(q('.tc-top'), { scaleX: 0.86, scaleY: 1.12, transformOrigin: '100% 50%', duration: 0.03, ease: 'power2.out' }, 0.18)
      .to(q('.tc-bot'), { scaleX: 0.86, scaleY: 1.12, transformOrigin: '0% 50%', duration: 0.03, ease: 'power2.out' }, 0.18)
      .to(q('.tc-top, .tc-bot'), { scaleX: 1, scaleY: 1, duration: 0.05, ease: 'elastic.out(1, 0.4)' }, 0.21)
      .to(q('.tc-flash'), { opacity: 1, duration: 0.005 }, 0.18)
      .to(q('.tc-flash'), { opacity: 0, duration: 0.04 }, 0.185)
      // the boring part is cut into slices and falls apart
      .to(q('.tc-slice-0'), { xPercent: -18, duration: 0.1, ease: 'power2.inOut' }, 0.26)
      .to(q('.tc-slice-1'), { xPercent: 14, duration: 0.1, ease: 'power2.inOut' }, 0.26)
      .to(q('.tc-slice-2'), { xPercent: -8, duration: 0.1, ease: 'power2.inOut' }, 0.26)
      .to(q('.tc-bot-letter'), { yPercent: 260, rotate: () => gsap.utils.random(-40, 40), opacity: 0, stagger: 0.003, duration: 0.1, ease: 'power2.in' }, 0.34)
      // the rest of the headline steps aside, the O comes for the camera
      .to(q('.tc-top-letter:not(.is-o)'), { opacity: 0, yPercent: (i) => (i % 2 ? -60 : 60), duration: 0.08 }, 0.42)
      .to(q('.is-o'), { scale: 90, duration: 0.18, ease: 'power3.in' }, 0.44)
      .to(q('.tc-inside'), { opacity: 1, duration: 0.02 }, 0.6)
      // inside the O: the new message, then the hierarchy flips
      .fromTo(q('.tc-final-line > span'), { yPercent: 105 }, { yPercent: 0, stagger: 0.03, duration: 0.07, ease: 'power4.out' }, 0.62)
      .to(q('.tc-final-line:not(:last-child)'), { fontSize: '4.2vw', opacity: 0.55, duration: 0.1, ease: 'power2.inOut' }, 0.8)
      .to(q('.tc-final-line:last-child'), { fontSize: '19vw', duration: 0.1, ease: 'power2.inOut' }, 0.8)
    t.set({}, {}, 1) // pin the timeline length to 1 so progress == scroll position
    tl.current = t
    return () => {
      t.revert()
    }
  }, [reduced])

  return (
    <ExperimentFrame
      id="exp-tipografia"
      index={4}
      name="Colisión"
      line="Solo HTML, CSS y tipografía. Ni una imagen."
      theme="exp-type"
      length={380}
      onProgress={(p) => {
        tl.current?.progress(p)
        const inside = !reduced && p > 0.6
        stage.current?.closest('.exp')?.classList.toggle('is-inside', inside)
        if (p > 0 && p < 1) setNavTone(inside ? 'light' : 'dark')
      }}
      tech={{
        stack: 'HTML · CSS clip-path · GSAP timeline dirigido por scroll',
        points: [
          'Una única línea de tiempo cuyo avance es tu scroll: hacia arriba se rebobina exactamente igual.',
          'El texto es texto real, seleccionable y legible por lectores de pantalla.',
          'La transición final escala una sola letra hasta atravesarla.',
        ],
      }}
    >
      {() => (
        <div ref={stage} className={`tc ${reduced ? 'is-static' : ''}`}>
          <p className="sr-only">Automatiza lo aburrido y dedica el tiempo a lo que importa.</p>
          <div className="tc-words" aria-hidden="true">
            <div className="display tc-top">
              {TOP.split('').map((c, i) => (
                <span key={i} className={`tc-top-letter ${i === 3 ? 'is-o' : ''}`}>
                  {c}
                </span>
              ))}
            </div>
            <div className="tc-bot-wrap">
              {[0, 1, 2].map((s) => (
                <div key={s} className={`display tc-bot tc-slice tc-slice-${s}`}>
                  {BOTTOM.split('').map((c, i) => (
                    <span key={i} className="tc-bot-letter">
                      {c === ' ' ? ' ' : c}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="tc-flash" aria-hidden="true" />
          <div className="tc-inside" aria-hidden="true">
            {FINAL.map((l) => (
              <p className="display tc-final-line" key={l}>
                <span>{l}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </ExperimentFrame>
  )
}
