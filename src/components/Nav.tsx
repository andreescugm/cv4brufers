import { useEffect, useState } from 'react'
import './nav.css'

const ACTS = [
  ['acto-1', 'I', 'Presentación'],
  ['acto-2', 'II', 'Por qué Brufers Club'],
  ['acto-3', 'III', 'Ventas y psicología'],
  ['acto-4', 'IV', 'La prueba'],
  ['acto-5', 'V', 'Cierre'],
] as const

/** sections whose background is light under the nav (Act I and the type experiment drive the tone themselves) */
const LIGHT = new Set<string>()
const SELF_DRIVEN = new Set(['acto-1', 'exp-tipografia'])

export default function Nav() {
  const [active, setActive] = useState('acto-1')
  const [tone, setTone] = useState<'dark' | 'light'>('light')
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    ACTS.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    // tone follows whatever section sits under the nav bar
    const top = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || SELF_DRIVEN.has(e.target.id)) continue
          setTone(LIGHT.has(e.target.id) ? 'dark' : 'light')
        }
      },
      { rootMargin: '0px 0px -96% 0px' },
    )
    document.querySelectorAll('main > section, .exp, .a4-intro').forEach((el) => top.observe(el))
    // scroll-driven scenes can override the tone while they own the screen
    const onTone = (e: Event) => setTone((e as CustomEvent<'dark' | 'light'>).detail)
    window.addEventListener('navtone', onTone)
    return () => {
      io.disconnect()
      top.disconnect()
      window.removeEventListener('navtone', onTone)
    }
  }, [])

  return (
    <nav className={`nav is-${tone}`} aria-label="Actos">
      <ol>
        {ACTS.map(([id, n, label]) => (
          <li key={id}>
            <a href={`#${id}`} aria-current={active === id ? 'step' : undefined} title={label}>
              <span aria-hidden="true">{n}</span>
              <span className="sr-only">{label}</span>
            </a>
          </li>
        ))}
      </ol>
      <a className="nav-cta" href="#contacto">
        Hablemos
      </a>
    </nav>
  )
}
