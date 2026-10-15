import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { SceneApi, SceneFactory } from '../../lib/scene'
import { asset } from '../../lib/asset'
import { THREE, makeRenderer, makePipeline, loadGLTF, disposeObject, canvasTexture, damp, lerp, seg, smooth } from './common'

/*
 * ACT I — Times Square at night.
 * Street model: "Cyberpunk City" by mortalityrexotable (CC BY 4.0). The avenue runs along Z, x ≈ 1.5…2.8.
 * Gabriel's portrait and name are hung as billboards on the facades; the flag and the eagle are real scans
 * (CC BY 4.0, see ASSET_MANIFEST). At the turn every screen in the street switches off, one by one.
 */

const STREET_X = 2.15
const IMG = asset('/media/gabriel-cut.webp')
const RED = '#c8102e'
const BLUE = '#1b2a6b'

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = src
  })
}

function display(ctx: CanvasRenderingContext2D, text: string, size: number, x: number, y: number, color: string, align: CanvasTextAlign = 'left') {
  ctx.font = `900 ${size}px "Big Shoulders Display", "Arial Narrow", sans-serif`
  ctx.textAlign = align
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

function stars(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, n: number) {
  ctx.fillStyle = '#fff'
  const cols = Math.ceil(Math.sqrt((n * w) / h))
  const rows = Math.ceil(n / cols)
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cx = x0 + ((c + (r % 2) * 0.5 + 0.5) / cols) * w
      const cy = y0 + ((r + 0.5) / rows) * h
      const R = Math.min(w / cols, h / rows) * 0.32
      ctx.beginPath()
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5
        const rr = k % 2 ? R * 0.42 : R
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
      }
      ctx.fill()
    }
}

/** The billboards: each one is a self-lit plane that can be switched off. */
function makeBoards(portrait: HTMLImageElement) {
  const hero = canvasTexture(1024, 1536, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#0d1640')
    g.addColorStop(1, '#030512')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // stripes behind the figure
    for (let i = 0; i < 13; i++) {
      ctx.fillStyle = i % 2 ? '#f3f1ec' : RED
      ctx.globalAlpha = 0.9
      ctx.fillRect(0, h * 0.18 + i * h * 0.035, w, h * 0.035)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = BLUE
    ctx.fillRect(0, h * 0.18, w * 0.46, h * 0.035 * 7)
    stars(ctx, 0, h * 0.18, w * 0.46, h * 0.035 * 7, 30)
    const ph = h * 0.66
    const pw = (portrait.width / portrait.height) * ph
    ctx.drawImage(portrait, (w - pw) / 2, h * 0.17, pw, ph)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, h * 0.83, w, h * 0.17)
    display(ctx, 'GABRIEL ANDREESCU', 132, w / 2, h * 0.915, '#fff', 'center')
    display(ctx, 'THE AMERICAN DREAM', 54, w / 2, h * 0.968, RED, 'center')
  })
  const name = canvasTexture(1536, 512, (ctx, w, h) => {
    ctx.fillStyle = RED
    ctx.fillRect(0, 0, w, h)
    display(ctx, 'ANDREESCU', 330, w / 2, h * 0.8, '#fff', 'center')
  })
  const face = canvasTexture(768, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#f3f1ec'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = BLUE
    ctx.fillRect(0, 0, w, h * 0.16)
    stars(ctx, 0, 0, w, h * 0.16, 24)
    const ph = h * 0.7
    const pw = (portrait.width / portrait.height) * ph
    ctx.drawImage(portrait, (w - pw) / 2, h * 0.2, pw, ph)
    ctx.fillStyle = RED
    ctx.fillRect(0, h * 0.86, w, h * 0.14)
    display(ctx, 'VOTE GABRIEL', 110, w / 2, h * 0.965, '#fff', 'center')
  })
  const talavera = canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = BLUE
    ctx.fillRect(0, 0, w, h)
    display(ctx, 'MADE IN', 120, w / 2, h * 0.36, '#fff', 'center')
    display(ctx, 'TALAVERA', 230, w / 2, h * 0.86, '#fff', 'center')
  })
  const ticker = canvasTexture(2048, 128, (ctx, w, h) => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    display(ctx, '★ GABRIEL ANDREESCU ★ NOW LIVE ★ SOLD OUT ★ GABRIEL ANDREESCU ★ NOW LIVE ★ SOLD OUT ★', 96, 0, h * 0.82, '#ffcf3d')
  })
  ticker.wrapS = THREE.RepeatWrapping
  return { hero, name, face, talavera, ticker }
}

const create: SceneFactory = async (canvas, opts) => {
  const renderer = makeRenderer(canvas, opts)
  renderer.toneMappingExposure = 1.35
  const scene = new THREE.Scene()
  const night = new THREE.Color('#05070f')
  scene.background = night.clone()
  scene.fog = new THREE.FogExp2(night.clone(), 0.028)
  const camera = new THREE.PerspectiveCamera(58, 1, 0.02, 200)
  const pipe = makePipeline(renderer, scene, camera, opts, { strength: 0.85, radius: 0.55, threshold: 0.62 })

  await document.fonts.load('900 64px "Big Shoulders Display"').catch(() => undefined)
  const [city, flag, eagle, portrait] = await Promise.all([
    loadGLTF(asset('/models/sf/cyberpunk_city.glb')),
    loadGLTF(asset('/models/sf/the_american_flag.glb')),
    loadGLTF(asset('/models/sf/bald_eagle.glb')),
    loadImage(IMG),
  ])

  // glass and chrome need something to reflect
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  scene.environment = env
  scene.environmentIntensity = 0.22

  // ── lighting: a sodium/neon night, the street lit by its own screens
  const hemi = new THREE.HemisphereLight('#6d7fc4', '#2a1410', 1.1)
  scene.add(hemi)
  const moon = new THREE.DirectionalLight('#9fb4ff', 0.9)
  moon.position.set(-6, 14, 4)
  scene.add(moon)

  // ── the city: night-grade every material; screens and neon emit their own texture
  const glowMats: THREE.MeshStandardMaterial[] = []
  city.scene.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const mats = (Array.isArray(m.material) ? m.material : [m.material]) as THREE.MeshStandardMaterial[]
    for (const mat of mats) {
      const n = (mat.name || '').toLowerCase()
      if (n.includes('advertising') || n.includes('neon')) {
        mat.emissive = new THREE.Color('#ffffff')
        mat.emissiveMap = mat.map
        mat.emissiveIntensity = 1.6
        glowMats.push(mat)
      } else {
        mat.envMapIntensity = 0.4
        mat.color.multiplyScalar(0.85)
      }
    }
  })
  scene.add(city.scene)

  // ── street lamps: warm pools of light down the avenue
  const lamps: THREE.PointLight[] = []
  const lampN = opts.tier === 'high' ? 3 : 2
  for (let i = 0; i < lampN; i++) {
    const L = new THREE.PointLight(i % 2 ? '#ffb46a' : '#7aa7ff', 3, 3.2, 1.6)
    L.position.set(STREET_X + (i % 2 ? 0.45 : -0.45), 0.55, 6.5 - i * (13 / lampN))
    scene.add(L)
    lamps.push(L)
  }

  // ── Gabriel's billboards
  const tx = makeBoards(portrait)
  const boards: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; light: THREE.PointLight | null; on: number }[] = []
  const addBoard = (tex: THREE.Texture, w: number, h: number, pos: [number, number, number], rotY: number, lightColor: string | null) => {
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: true })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    mesh.position.set(...pos)
    mesh.rotation.y = rotY
    scene.add(mesh)
    // only the big boards cast real light: every extra point light costs every pixel
    const light = lightColor ? new THREE.PointLight(lightColor, 2.2, 4.5, 1.4) : null
    if (light) {
      light.position.copy(mesh.position).add(new THREE.Vector3(Math.sin(rotY) * 0.6, 0, Math.cos(rotY) * 0.6))
      scene.add(light)
    }
    boards.push({ mesh, mat, light, on: 1 })
  }
  // hero board at the end of the avenue, facing the camera
  addBoard(tx.hero, 2.1, 3.15, [STREET_X, 2.6, -7.4], 0, '#6c86ff')
  // facades
  addBoard(tx.face, 0.95, 1.27, [1.53, 1.6, -3.0], Math.PI / 2, '#ffffff')
  addBoard(tx.name, 1.8, 0.6, [2.55, 2.3, -4.6], -Math.PI / 2, RED)
  addBoard(tx.talavera, 1.2, 0.6, [1.47, 1.15, 2.4], Math.PI / 2, null)
  addBoard(tx.face, 0.8, 1.07, [2.98, 1.4, 1.6], -Math.PI / 2, null)
  addBoard(tx.ticker, 3.0, 0.19, [1.52, 0.72, -1.2], Math.PI / 2, null)

  // ── the flag: real model on its pole, cloth animated with a travelling wave
  const flagRoot = flag.scene
  flagRoot.scale.setScalar(0.12)
  flagRoot.position.set(STREET_X + 0.5, 0, 1.2)
  flagRoot.rotation.y = -Math.PI / 2
  const flagUniform = { value: 0 }
  flagRoot.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || !(m.name || '').toLowerCase().includes('plane')) return
    const mat = m.material as THREE.MeshStandardMaterial
    mat.side = THREE.DoubleSide
    m.geometry.computeBoundingBox()
    const bb = m.geometry.boundingBox!
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = flagUniform
      sh.uniforms.uMinX = { value: bb.min.x }
      sh.uniforms.uSpanX = { value: bb.max.x - bb.min.x }
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uMinX; uniform float uSpanX;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float fx = clamp((position.x - uMinX) / uSpanX, 0.0, 1.0); // 0 at the pole
           transformed.z += sin(position.x * 2.4 - uTime * 3.2) * 0.22 * fx + sin(position.y * 1.7 - uTime * 2.1) * 0.06 * fx;`,
        )
    }
  })
  scene.add(flagRoot)

  // ── the eagle: a real rigged scan with its own wing cycle, flying across the avenue
  const eagleRoot = eagle.scene
  eagleRoot.scale.setScalar(0.0042)
  scene.add(eagleRoot)
  const mixer = new THREE.AnimationMixer(eagleRoot)
  if (eagle.animations[0]) mixer.clipAction(eagle.animations[0]).play()

  // ── haze cards in the light of the boards (atmosphere, cheap)
  const hazeMat = new THREE.MeshBasicMaterial({
    map: canvasTexture(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
      g.addColorStop(0, 'rgba(120,140,255,0.35)')
      g.addColorStop(1, 'rgba(120,140,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const hazes: THREE.Mesh[] = []
  for (let i = 0; i < 6; i++) {
    const hz = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), hazeMat)
    hz.position.set(STREET_X, 1.2 + (i % 3) * 0.6, 4 - i * 2.2)
    scene.add(hz)
    hazes.push(hz)
  }

  let target = 0
  let p = 0
  let aspect = 1
  const look = new THREE.Vector3()

  const api: SceneApi = {
    setProgress(v) {
      target = v
      if (opts.reduced) p = v
    },
    resize(w, h) {
      aspect = w / Math.max(1, h)
      pipe.setSize(Math.max(1, w), Math.max(1, h))
      camera.aspect = aspect
      camera.fov = aspect < 1 ? 74 : 58
      camera.updateProjectionMatrix()
    },
    frame(t, dt) {
      p = opts.reduced ? target : damp(p, target, 5, dt)
      // camera: low hero angle up at the end board → dolly down the avenue → crane up as the street dies
      const walk = smooth(seg(p, 0.1, 0.72))
      const rise = smooth(seg(p, 0.7, 1))
      const z = lerp(7.6, -3.2, walk)
      camera.position.set(STREET_X + Math.sin(t * 0.4) * 0.015 + Math.sin(walk * 5) * 0.08, lerp(0.22, 0.42, walk) + rise * 1.4, z + rise * 1.2)
      const tilt = lerp(1.9, 1.4, walk) - rise * 0.5
      look.set(STREET_X + Math.sin(walk * 3.2) * 0.25, tilt, z - 6)
      camera.lookAt(look)
      camera.rotation.z += Math.sin(walk * Math.PI) * 0.025

      // eagle: crosses the frame in the first third of the walk
      const fly = seg(p, 0.02, 0.5)
      eagleRoot.position.set(lerp(-1.5, 6, fly), lerp(2.4, 1.6, fly) + Math.sin(t * 1.4) * 0.05, lerp(4.5, -1, fly))
      eagleRoot.rotation.set(0, Math.PI / 2 - 0.5, Math.sin(t * 1.2) * 0.12)
      eagleRoot.visible = fly > 0 && fly < 1
      mixer.update(dt)
      flagUniform.value = t

      // the turn: screens die one by one, then the street lights
      const off = seg(p, 0.66, 0.82)
      boards.forEach((b, i) => {
        const k = seg(off, i / (boards.length + 2), (i + 1) / (boards.length + 2))
        // brief flicker as it dies
        const flick = k > 0 && k < 1 ? (Math.sin(t * 60 + i) > 0 ? 1 : 0.15) : 1
        b.on = (1 - k) * flick
        b.mat.color.setScalar(0.04 + 0.96 * b.on)
        if (b.light) b.light.intensity = 2.2 * b.on
      })
      const cityOff = seg(p, 0.76, 0.9)
      glowMats.forEach((m, i) => (m.emissiveIntensity = 1.6 * (1 - seg(cityOff, (i % 5) * 0.12, (i % 5) * 0.12 + 0.4))))
      lamps.forEach((L, i) => (L.intensity = 3 * (1 - seg(cityOff, 0.3 + i * 0.08, 0.5 + i * 0.08))))
      hemi.intensity = lerp(1.1, 0.12, cityOff)
      scene.environmentIntensity = lerp(0.22, 0.02, cityOff)
      moon.intensity = lerp(0.9, 0.08, cityOff)
      hazeMat.opacity = 1 - cityOff
      hazes.forEach((hz) => hz.lookAt(camera.position))
      tx.ticker.offset.x = (t * 0.06) % 1
      if (pipe.bloom) pipe.bloom.strength = lerp(0.85, 0.3, cityOff)

      pipe.render()
    },
    dispose() {
      disposeObject(scene)
      Object.values(tx).forEach((t) => t.dispose())
      env.dispose()
      pipe.dispose()
      renderer.dispose()
    },
  }
  return api
}

export default create
