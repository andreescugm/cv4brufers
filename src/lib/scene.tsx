import { useEffect, useRef, useState, type RefObject } from 'react'
import { hasWebGL, prefersReducedMotion, qualityTier } from './motion'

export interface SceneOptions {
  tier: 'low' | 'high'
  reduced: boolean
}

export interface SceneApi {
  /** 0..1 scroll progress of the owning section */
  setProgress(p: number): void
  /** normalised pointer -1..1 */
  setPointer?(x: number, y: number): void
  resize(w: number, h: number): void
  frame(t: number, dt: number): void
  dispose(): void
}

export type SceneFactory = (canvas: HTMLCanvasElement, opts: SceneOptions) => Promise<SceneApi>
export type SceneLoader = () => Promise<{ default: SceneFactory }>

type Status = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error'

/**
 * Mounts a WebGL scene lazily:
 *  - the scene module (and three.js) is only downloaded when the host is within ~1 viewport,
 *  - the render loop only runs while the host is on screen,
 *  - GPU resources are released when the host is far away again.
 */
export function useLazyScene(
  hostRef: RefObject<HTMLElement | null>,
  canvasHostRef: RefObject<HTMLElement | null>,
  loader: SceneLoader,
) {
  const apiRef = useRef<SceneApi | null>(null)
  const progressRef = useRef(0)
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    const host = hostRef.current
    const canvasHost = canvasHostRef.current
    if (!host || !canvasHost) return
    if (!hasWebGL()) {
      setStatus('unsupported')
      return
    }

    let disposed = false
    let canvas: HTMLCanvasElement | null = null
    let raf = 0
    let visible = false
    let last = performance.now()
    let loadToken = 0

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      apiRef.current?.frame(now / 1000, dt)
    }
    const start = () => {
      if (raf || !apiRef.current) return
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const mount = async () => {
      if (apiRef.current || canvas) return
      const token = ++loadToken
      setStatus('loading')
      canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      canvasHost.appendChild(canvas)
      try {
        const mod = await loader()
        if (disposed || token !== loadToken) return
        const api = await mod.default(canvas, { tier: qualityTier(), reduced: prefersReducedMotion() })
        if (disposed || token !== loadToken) {
          api.dispose()
          return
        }
        apiRef.current = api
        const r = canvasHost.getBoundingClientRect()
        api.resize(r.width, r.height)
        api.setProgress(progressRef.current)
        api.frame(performance.now() / 1000, 0)
        setStatus('ready')
        if (visible) start()
      } catch (e) {
        console.error('[scene] failed to load', e)
        if (!disposed) setStatus('error')
      }
    }

    const unmount = () => {
      loadToken++
      stop()
      apiRef.current?.dispose()
      apiRef.current = null
      canvas?.remove()
      canvas = null
      setStatus('idle')
    }

    // Distance-to-viewport is computed from scroll events (cheap, and it never lags behind a busy GPU
    // the way IntersectionObserver notifications can): mount near, render on screen, release far.
    const section = (host.closest('section') as HTMLElement | null) ?? host
    let checkRaf = 0
    const check = () => {
      checkRaf = 0
      const r = section.getBoundingClientRect()
      const vh = window.innerHeight
      const dist = r.top > vh ? r.top - vh : r.bottom < 0 ? -r.bottom : 0
      if (dist < vh * 1.2) void mount()
      else if (dist > vh * 3.2) unmount()
      const nowVisible = dist === 0
      if (nowVisible !== visible) {
        visible = nowVisible
        if (visible) start()
        else stop()
      }
    }
    const requestCheck = () => {
      if (!checkRaf) checkRaf = requestAnimationFrame(check)
    }
    window.addEventListener('scroll', requestCheck, { passive: true })
    window.addEventListener('resize', requestCheck)
    check()

    const ro = new ResizeObserver(() => {
      const r = canvasHost.getBoundingClientRect()
      apiRef.current?.resize(r.width, r.height)
    })
    ro.observe(canvasHost)

    return () => {
      disposed = true
      cancelAnimationFrame(checkRaf)
      window.removeEventListener('scroll', requestCheck)
      window.removeEventListener('resize', requestCheck)
      ro.disconnect()
      unmount()
    }
  }, [hostRef, canvasHostRef, loader])

  const setProgress = (p: number) => {
    progressRef.current = p
    apiRef.current?.setProgress(p)
  }
  const setPointer = (x: number, y: number) => apiRef.current?.setPointer?.(x, y)

  return { status, setProgress, setPointer, apiRef }
}

/** Progress (0..1) of a tall section scrolling past a sticky viewport. Native scroll, no pinning. */
export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  onProgress: (p: number) => void,
) {
  const cb = useRef(onProgress)
  useEffect(() => {
    cb.current = onProgress
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let lastP = -1
    const compute = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = total <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / total))
      if (Math.abs(p - lastP) > 0.0001) {
        lastP = p
        cb.current(p)
      }
    }
    const req = () => {
      if (!raf) raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', req, { passive: true })
    window.addEventListener('resize', req)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', req)
      window.removeEventListener('resize', req)
    }
  }, [ref])
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** maps p from [a,b] to [0,1] clamped */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
