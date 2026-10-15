import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { SceneApi, SceneFactory } from '../../lib/scene'
import { THREE, makeRenderer, loadGLTF, disposeObject, damp, lerp } from './common'

export interface ObjectSceneApi extends SceneApi {
  setMode(i: number): void
  nudge(dx: number, dy: number): void
  drag(dx: number, dy: number): void
}

export const MODES = ['Mármol', 'Cromo', 'Calor', 'Malla'] as const

function thermal() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); vY = position.y;
        gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY;
      vec3 ramp(float t){ return t<0.33? mix(vec3(0.05,0.0,0.25), vec3(0.85,0.05,0.3), t/0.33)
        : t<0.66? mix(vec3(0.85,0.05,0.3), vec3(1.0,0.6,0.0), (t-0.33)/0.33) : mix(vec3(1.0,0.6,0.0), vec3(1.0,1.0,0.85), (t-0.66)/0.34); }
      void main(){ float f = clamp(dot(normalize(vN), normalize(vV)),0.,1.);
        float heat = f*0.85 + 0.15*sin(vY*30.0 - uTime*2.0);
        gl_FragColor = vec4(ramp(clamp(heat,0.,1.)), 1.); }`,
  })
}

const create: SceneFactory = async (canvas, opts) => {
  const renderer = makeRenderer(canvas, opts, { alpha: true })
  renderer.setClearColor(0, 0)
  renderer.localClippingEnabled = true
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  scene.environment = env
  scene.environmentIntensity = 0.5

  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 20)
  const gltf = await loadGLTF('/models/marble_bust_01/marble_bust_01_1k.gltf')
  const source = gltf.scene.getObjectByProperty('isMesh', true) as THREE.Mesh
  const geom = source.geometry
  geom.computeBoundingBox()
  const bb = geom.boundingBox!
  const centerY = (bb.max.y + bb.min.y) / 2
  const height = bb.max.y - bb.min.y

  const key = new THREE.PointLight('#fff1e0', 2.2, 4, 1.5)
  scene.add(key)
  scene.add(new THREE.AmbientLight('#404048', 0.6))

  // one mesh per look; a horizontal clipping plane wipes from one to the next
  const reveal = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0) // keeps below
  const hide = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // keeps above
  const marble = source.material as THREE.MeshStandardMaterial
  const chrome = new THREE.MeshPhysicalMaterial({ color: '#d9dde3', metalness: 1, roughness: 0.08, clearcoat: 1 })
  const heat = thermal()
  const wire = new THREE.MeshBasicMaterial({ color: '#9fd8ff', wireframe: true, transparent: true, opacity: 0.55 })
  const mats: THREE.Material[] = [marble, chrome, heat, wire]

  const pivot = new THREE.Group()
  scene.add(pivot)
  const meshes = mats.map((m) => {
    const mesh = new THREE.Mesh(geom, m)
    mesh.position.y = -centerY
    mesh.visible = false
    pivot.add(mesh)
    return mesh
  })
  meshes[0].visible = true

  // scan line that marks the wipe
  const scan = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.205, 64),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, side: THREE.DoubleSide }),
  )
  scan.rotation.x = -Math.PI / 2
  scene.add(scan)

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.04, 64),
    new THREE.MeshStandardMaterial({ color: '#17171a', roughness: 0.4, metalness: 0.2 }),
  )
  pedestal.position.y = -height / 2 - 0.02
  scene.add(pedestal)

  let mode = 0
  let prev = 0
  let wipe = 1 // 0 → 1 while switching
  let rotY = -0.4
  let rotX = 0
  let velY = 0.0
  let velX = 0
  let px = 0.4
  let py = 0.3
  let lx = 0.4
  let ly = 0.3
  let progress = 0

  const api: ObjectSceneApi = {
    setProgress(v) {
      progress = v
    },
    setPointer(x, y) {
      px = x
      py = y
    },
    setMode(i) {
      if (i === mode) return
      prev = mode
      mode = i
      wipe = opts.reduced ? 1 : 0
    },
    nudge(dx, dy) {
      velY += dx
      velX += dy
    },
    drag(dx, dy) {
      rotY += dx
      rotX = Math.max(-0.5, Math.min(0.5, rotX + dy))
      velY = dx * 30
      velX = 0
    },
    resize(w, h) {
      renderer.setSize(Math.max(1, w), Math.max(1, h), false)
      camera.aspect = w / Math.max(1, h)
      camera.position.set(0, 0.02, (w < h ? 1.55 : 1.05) * (height / 0.5))
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    },
    frame(t, dt) {
      // inertia
      rotY += velY * dt
      rotX += velX * dt
      velY = damp(velY, opts.reduced ? 0 : 0.12, 2.5, dt)
      velX = damp(velX, 0, 3, dt)
      rotX = damp(rotX, 0, 1.2, dt)
      pivot.rotation.set(rotX, rotY + progress * 1.2, 0)

      // light follows the pointer / finger
      lx = damp(lx, px, 6, dt)
      ly = damp(ly, py, 6, dt)
      key.position.set(lx * 0.8, ly * 0.6 + 0.1, 0.6)

      // wipe between looks
      wipe = Math.min(1, wipe + dt * 1.4)
      const yCut = lerp(-height / 2 - 0.01, height / 2 + 0.01, wipe)
      reveal.constant = yCut // keep y < yCut
      hide.constant = -yCut // keep y > yCut
      meshes.forEach((m, i) => {
        const mat = m.material as THREE.Material
        if (i === mode) {
          m.visible = true
          mat.clippingPlanes = wipe < 1 ? [reveal] : null
        } else if (i === prev && wipe < 1) {
          m.visible = true
          mat.clippingPlanes = [hide]
        } else m.visible = false
      })
      const sm = scan.material as THREE.MeshBasicMaterial
      sm.opacity = wipe < 1 ? 0.9 : 0
      scan.position.y = yCut
      const r = 0.16
      scan.scale.setScalar(r / 0.2)
      heat.uniforms.uTime.value = t

      renderer.render(scene, camera)
    },
    dispose() {
      disposeObject(scene)
      mats.forEach((m) => m.dispose())
      env.dispose()
      renderer.dispose()
    },
  }
  return api
}

export default create
