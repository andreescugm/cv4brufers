import { useEffect, useRef } from 'react'
import { profile, whatsappHref } from '../content/profile'
import { qualityTier, useReducedMotion } from '../lib/motion'
import { span, useSectionProgress } from '../lib/scene'
import './act5.css'

/** CC BY 4.0 requires naming the author and linking the work. */
const CREDITS = [
  { title: 'Cyberpunk City', author: 'mortalityrexotable', url: 'https://sketchfab.com/3d-models/cyberpunk-city-3f24e5c5bf924f46b30d9a392afa9624' },
  { title: 'The American Flag', author: 'ognuogaan135', url: 'https://sketchfab.com/3d-models/the-american-flag-34ce3deaa5da482893f546307e5a223a' },
  { title: 'Bald Eagle', author: 'ucdavisterc', url: 'https://sketchfab.com/3d-models/bald-eagle-8874cfcf83a54575ba8068376f8a63a8' },
  { title: 'Tiger rebuilt', author: 'kenchoo', url: 'https://sketchfab.com/3d-models/tiger-rebuilt-6b5d14b2de984ffcb00ee00e404ad208' },
  { title: 'Jungle Tree', author: 'gelmi.com.br', url: 'https://sketchfab.com/3d-models/jungle-tree-b760147faadf41eabb2bb6cb85274d8a' },
  { title: 'Osaka downtown', author: 'matousekfoto', url: 'https://sketchfab.com/3d-models/osaka-downtown-53e0980d555a4af6b921cc00c208e4a3' },
]

interface Grain {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  delay: number
}

/** Hash noise: every particle's path is a pure function of scroll, so scrolling back re-forms the sentence. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

function ContactLinks() {
  const wa = whatsappHref()
  const { phone, email } = profile.contact
  return (
    <ul className="a5-links">
      {wa && (
        <li>
          <a className="a5-btn is-primary" href={wa} target="_blank" rel="noopener noreferrer">
            Escribir por WhatsApp
          </a>
        </li>
      )}
      {phone && (
        <li>
          <a className="a5-btn" href={`tel:${phone}`}>
            Llamar al {phone.replace(/^\+34/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
          </a>
        </li>
      )}
      {email && (
        <li>
          <a className={`a5-btn ${wa ? '' : 'is-primary'}`} href={`mailto:${email}?subject=${encodeURIComponent('Hablemos — Brufers Club')}`}>
            {email}
          </a>
        </li>
      )}
    </ul>
  )
}

export default function Act5Close() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const step = qualityTier() === 'high' ? 3 : 4
    let grains: Grain[] = []
    let w = 0
    let h = 0
    let dpr = 1
    let textBox = { x: 0, y: 0, w: 0, h: 0 }
    let raf = 0
    let visible = false

    const sample = () => {
      dpr = Math.min(window.devicePixelRatio, 2)
      w = cv.clientWidth
      h = cv.clientHeight
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      // lay out the claim in the display face, then sample its pixels into grains
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const o = off.getContext('2d')!
      const words = profile.builtClaim.toUpperCase().split(' ')
      const size = Math.min(w / 6.2, h / 4.2)
      o.font = `900 ${size}px "Big Shoulders Display"`
      o.textBaseline = 'alphabetic'
      const lines: string[] = []
      let line = ''
      for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (o.measureText(test).width > w * 0.86 && line) {
          lines.push(line)
          line = word
        } else line = test
      }
      lines.push(line)
      const lh = size * 0.88
      const top = h / 2 - (lines.length * lh) / 2 + size * 0.78
      const left = w * 0.07
      o.fillStyle = '#fff'
      lines.forEach((l, i) => o.fillText(l, left, top + i * lh))
      textBox = { x: left, y: top - size * 0.78, w: w * 0.86, h: lines.length * lh }
      const data = o.getImageData(0, 0, w, h).data
      grains = []
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (data[(y * w + x) * 4 + 3] > 128) {
            const i = grains.length
            grains.push({
              x,
              y,
              vx: (hash(i) - 0.5) * 220,
              vy: -(160 + hash(i + 0.37) * 520),
              r: step * (0.55 + hash(i + 0.71) * 0.5),
              delay: (x - textBox.x) / textBox.w * 0.35 + hash(i + 0.13) * 0.15,
            })
          }
        }
      }
    }

    const draw = (time: number) => {
      const p = progress.current
      const t = time / 1000
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // ambient embers rising from below the frame, calmer as the page ends
      const calm = span(p, 0.75, 1)
      ctx.globalCompositeOperation = 'lighter'
      const embers = 70
      for (let i = 0; i < embers; i++) {
        const life = (t * (0.05 + hash(i) * 0.08) + hash(i + 5)) % 1
        const x = hash(i + 9) * w + Math.sin(t * 0.8 + i) * 30
        const y = h * (1.05 - life * 1.1)
        const a = Math.sin(life * Math.PI) * (0.55 - calm * 0.35)
        ctx.fillStyle = `rgba(255,${Math.round(110 + 100 * (1 - life))},40,${a})`
        ctx.fillRect(x, y, 2.2, 2.2)
      }

      // the claim: lit from below, then it burns away grain by grain
      const burn = span(p, 0.26, 0.6)
      const appear = 1
      for (let i = 0; i < grains.length; i++) {
        const g = grains[i]
        const k = Math.max(0, Math.min(1, (burn - g.delay) / 0.45))
        if (k >= 1) continue
        const e = k * k
        const wob = Math.sin(t * 2 + i) * 6 * k
        const x = g.x + g.vx * e + wob
        const y = g.y + g.vy * e
        // white-hot → ember → ash
        const heat = 1 - k
        // white-hot (255,236,200) → orange (255,120,30) → deep red ash (150,40,20)
        const rr = Math.round(heat > 0.5 ? 255 : 150 + 210 * heat)
        const gg = Math.round(heat > 0.5 ? 120 + 232 * (heat - 0.5) : 40 + 160 * heat)
        const bb = Math.round(heat > 0.5 ? 30 + 340 * (heat - 0.5) : 20 + 20 * heat)
        const alpha = appear * (k > 0 ? 1 - k : 0.92 + 0.08 * Math.sin(t * 6 + i * 0.1))
        ctx.fillStyle = k > 0 ? `rgba(${rr},${gg},${bb},${alpha})` : `rgba(255,${Math.round(150 + 90 * (1 - (g.y - textBox.y) / textBox.h))},${Math.round(70 + 90 * (1 - (g.y - textBox.y) / textBox.h))},${alpha})`
        const s = g.r * (1 - k * 0.6)
        ctx.fillRect(x, y, s, s)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const loop = (time: number) => {
      raf = requestAnimationFrame(loop)
      draw(time)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(loop)
    })
    io.observe(cv)
    let ro: ResizeObserver | null = null
    document.fonts.load('900 64px "Big Shoulders Display"').then(() => {
      sample()
      ro = new ResizeObserver(() => sample())
      ro.observe(cv)
    })
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro?.disconnect()
    }
  }, [reduced])

  useSectionProgress(track, (p) => {
    progress.current = p
    const el = root.current
    if (!el || reduced) return
    el.style.setProperty('--why', String(span(p, 0.5, 0.6) - span(p, 0.72, 0.78)))
    el.style.setProperty('--talk', String(span(p, 0.76, 0.86)))
    el.classList.toggle('talk-on', p > 0.76)
    el.style.setProperty('--glow', String(span(p, 0.1, 0.5) * (1 - span(p, 0.75, 1) * 0.6)))
  })

  return (
    <section ref={root} id="acto-5" className={`act5 ${reduced ? 'is-static' : ''}`} aria-labelledby="a5-title">
      <div className="a5-track" ref={track}>
      <div className="a5-sticky">
        <div className="a5-glow" aria-hidden="true" />
        <canvas ref={canvas} className="a5-canvas" aria-hidden="true" />
        <p className="a5-claim">{profile.builtClaim}</p>
        <p className="a5-why">
          No para presumir de velocidad, sino para enseñaros cómo trabajo: decido, ejecuto, compruebo y corrijo.
          Me interesa especialmente Brufers Club y estoy disponible para hablar de una posible incorporación.
        </p>
        <div className="a5-talk">
          <h2 id="a5-title" className="display">
            Hablemos.
          </h2>
          <ContactLinks />
        </div>
      </div>
      </div>
      <footer className="a5-footer" id="contacto">
        <p className="display">
          {profile.firstName} {profile.lastName}
        </p>
        <ContactLinks />
        <p className="a5-credits">
          Hecho con React, TypeScript, GSAP y three.js. Tipografías Big Shoulders, Instrument Sans e Instrument Serif
          (SIL OFL).
        </p>
        <p className="a5-credits">
          Modelos 3D bajo CC BY 4.0, con modificaciones (compresión, iluminación, animación):{' '}
          {CREDITS.map((c, i) => (
            <span key={c.url}>
              <a href={c.url} target="_blank" rel="noopener noreferrer">
                {c.title}
              </a>{' '}
              de {c.author}
              {i < CREDITS.length - 1 ? ' · ' : '. '}
            </span>
          ))}
          Vegetación, reloj, busto e iluminación HDRI de Poly Haven (CC0).
        </p>
      </footer>
    </section>
  )
}
