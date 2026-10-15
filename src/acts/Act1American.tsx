import { useEffect, useRef } from 'react'
import { profile } from '../content/profile'
import { gsap, setNavTone, useReducedMotion } from '../lib/motion'
import { useLazyScene, useSectionProgress } from '../lib/scene'
import './act1.css'

const load = () => import('../experiments/three/americaScene')

const CAPTIONS = [
  { title: 'Madrid.', sub: 'Asesoría inmobiliaria prime y operaciones off-market.' },
  { title: 'A comisión.', sub: 'Años vendiendo en RE/MAX sin sueldo fijo.' },
  { title: 'Mi propia empresa.', sub: `${profile.company}: ${profile.companyWhat}.` },
  { title: 'Neón, traje y mi cara en Times Square.', sub: 'Podría contároslo así, con toda la pompa.' },
]

export default function Act1American() {
  const root = useRef<HTMLElement>(null)
  const sceneHost = useRef<HTMLDivElement>(null)
  const canvasHost = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const reduced = useReducedMotion()
  const scene = useLazyScene(sceneHost, canvasHost, load)

  useEffect(() => {
    if (reduced) return
    const q = gsap.utils.selector(root)
    const t = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
    // the poster dissolves into the street
    t.to(q('.a1-name-top'), { xPercent: -40, opacity: 0, duration: 0.12, ease: 'power2.in' }, 0.02)
      .to(q('.a1-name-bot'), { xPercent: -25, opacity: 0, duration: 0.12, ease: 'power2.in' }, 0.03)
      .to(q('.a1-portrait'), { yPercent: 30, scale: 1.08, opacity: 0, duration: 0.12, ease: 'power2.in' }, 0.03)
      .to(q('.a1-byline, .a1-cue'), { opacity: 0, duration: 0.04 }, 0.02)
      .to(q('.a1-vignette'), { opacity: 0.35, duration: 0.1 }, 0.04)
    CAPTIONS.forEach((_, i) => {
      const at = 0.16 + i * 0.12
      t.fromTo(q(`.a1-cap-${i}`), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.035, ease: 'power3.out' }, at)
      t.to(q(`.a1-cap-${i}`), { opacity: 0, y: -30, duration: 0.03, ease: 'power2.in' }, at + 0.09)
    })
    // the turn: the screens are switching off in the 3D scene (0.66 → 0.9) while the line rises
    t.fromTo(q('.a1-mask > span'), { yPercent: 110 }, { yPercent: 0, stagger: 0.012, duration: 0.05, ease: 'power4.out' }, 0.76)
      .to(q('.a1-curtain'), { opacity: 1, duration: 0.06 }, 0.9)
      .to(q('.a1-but'), { opacity: 0, duration: 0.04 }, 0.95)
    t.set({}, {}, 1) // timeline length = 1, so progress == scroll position
    tl.current = t
    return () => {
      t.revert()
    }
  }, [reduced])

  useSectionProgress(root, (p) => {
    const r = root.current?.getBoundingClientRect()
    if (r && r.top <= 0 && r.bottom > window.innerHeight * 0.5) setNavTone('light')
    scene.setProgress(p)
    if (reduced) return
    tl.current?.progress(p)
  })

  return (
    <section ref={root} id="acto-1" className={`act1 ${reduced ? 'is-static' : ''}`} aria-labelledby="a1-title">
      <div className="a1-sticky">
        <div ref={sceneHost} className="a1-scene" aria-hidden="true">
          <div ref={canvasHost} className="a1-canvas" />
          {scene.status !== 'ready' && <div className="a1-scene-fallback" />}
        </div>
        <div className="a1-vignette" aria-hidden="true" />

        <div className="a1-poster">
          <h1 id="a1-title" className="display a1-name">
            <span className="a1-name-top">{profile.firstName}</span>
            <span className="a1-name-bot">{profile.lastName}</span>
          </h1>
          {profile.photo && (
            <figure className="a1-portrait">
              <img src={profile.photo} alt={`${profile.firstName} ${profile.lastName}, retrato con traje`} />
            </figure>
          )}
          <p className="a1-byline">
            Una presentación hecha a medida para <strong>Brufers&nbsp;Club</strong>.
          </p>
          <div className="a1-cue" aria-hidden="true">
            <i />
          </div>
        </div>

        <div className="a1-captions">
          {CAPTIONS.map((h, i) => (
            <div className={`a1-cap a1-cap-${i}`} key={h.title}>
              <p className="display">{h.title}</p>
              <p className="a1-cap-sub">{h.sub}</p>
            </div>
          ))}
        </div>

        <p className="display a1-but" aria-label="Pero no he venido a venderos eso.">
          {'PERO NO HE VENIDO A VENDEROS ESO.'.split(' ').map((w, i) => (
            <span className="a1-mask" key={i}>
              <span>{w}</span>
            </span>
          ))}
        </p>
        <div className="a1-curtain" aria-hidden="true" />
      </div>
    </section>
  )
}
