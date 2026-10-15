import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { SceneOptions } from '../../lib/scene'

export { THREE }

export function makeRenderer(canvas: HTMLCanvasElement, opts: SceneOptions, extra: Partial<THREE.WebGLRendererParameters> = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: opts.tier === 'high', powerPreference: 'high-performance', ...extra })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.tier === 'high' ? 1.75 : 1.25))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  return renderer
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
export const loadGLTF = (url: string) => loader.loadAsync(url) as Promise<GLTF>

/** Render path with an optional bloom pass (high tier only). Bloom is used where light sources are the subject: neon, embers, city lights. */
export function makePipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  opts: SceneOptions,
  bloom: { strength: number; radius: number; threshold: number },
) {
  if (opts.tier !== 'high') {
    return {
      bloom: null as UnrealBloomPass | null,
      setSize: (w: number, h: number) => renderer.setSize(w, h, false),
      render: () => renderer.render(scene, camera),
      dispose: () => {},
    }
  }
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const pass = new UnrealBloomPass(new THREE.Vector2(256, 256), bloom.strength, bloom.radius, bloom.threshold)
  composer.addPass(pass)
  composer.addPass(new OutputPass())
  return {
    bloom: pass as UnrealBloomPass | null,
    setSize: (w: number, h: number) => {
      renderer.setSize(w, h, false)
      composer.setPixelRatio(renderer.getPixelRatio())
      composer.setSize(w, h)
    },
    render: () => composer.render(),
    dispose: () => {
      pass.dispose()
      composer.dispose()
    },
  }
}

/** A canvas-drawn texture (billboards, signage). */
export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!, w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose()
      mat.dispose()
    }
  })
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt))
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)))

/** deterministic PRNG so scenes are identical on every visit */
export function rng(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
