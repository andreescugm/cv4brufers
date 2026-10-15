import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)
export { gsap, ScrollTrigger }

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export const isCoarsePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

let webglCache: boolean | null = null
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache
  try {
    const c = document.createElement('canvas')
    webglCache = !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch {
    webglCache = false
  }
  return webglCache
}

/** Quality tier: phones and small screens get fewer particles/instances and a lower DPR. */
export function qualityTier(): 'low' | 'high' {
  if (typeof window === 'undefined') return 'high'
  const small = window.innerWidth < 760
  const cores = navigator.hardwareConcurrency ?? 4
  return small || cores <= 4 ? 'low' : 'high'
}

/** Lets a scroll scene recolor the fixed nav while it owns the screen (React bails out on unchanged state). */
export function setNavTone(tone: 'dark' | 'light') {
  window.dispatchEvent(new CustomEvent('navtone', { detail: tone }))
}
