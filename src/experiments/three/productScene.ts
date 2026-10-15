import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import type { SceneApi, SceneFactory } from '../../lib/scene'
import { asset } from '../../lib/asset'
import { THREE, makeRenderer, loadGLTF, disposeObject, damp, lerp, seg, smooth } from './common'

// angle (clockwise from 12) each hand is modelled at, measured from the mesh bounds
const BASE = { hour: 38, minute: 57, second: -50 }
const deg = THREE.MathUtils.degToRad

const create: SceneFactory = async (canvas, opts) => {
  const renderer = makeRenderer(canvas, opts, { alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMappingExposure = 1.1
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const [hdr, gltf] = await Promise.all([
    new HDRLoader().loadAsync(asset('/hdri/studio_small_09_1k.hdr')),
    loadGLTF(asset('/models/vintage_pocket_watch/vintage_pocket_watch_1k.gltf')),
  ])
  const env = pmrem.fromEquirectangular(hdr).texture
  hdr.dispose()
  pmrem.dispose()
  scene.environment = env
  scene.environmentIntensity = 0.6

  const key = new THREE.SpotLight('#fff3dc', 0, 20, 0.5, 0.6, 1.2)
  key.position.set(2.5, 4, 4)
  scene.add(key, key.target)
  const rim = new THREE.DirectionalLight('#ffb15c', 0)
  rim.position.set(-3, 1.5, -3)
  scene.add(rim)

  const watch = gltf.scene
  watch.scale.setScalar(30)
  const pivot = new THREE.Group()
  pivot.add(watch)
  scene.add(pivot)
  const hands = {
    hour: watch.getObjectByName('vintage_pocket_watch_hour_hand')!,
    minute: watch.getObjectByName('vintage_pocket_watch_minute_hand')!,
    second: watch.getObjectByName('vintage_pocket_watch_second_hand')!,
  }
  watch.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) (m.material as THREE.MeshStandardMaterial).envMapIntensity = 1
  })

  let target = 0
  let p = 0

  const api: SceneApi = {
    setProgress(v) {
      target = v
      if (opts.reduced) p = v
    },
    resize(w, h) {
      renderer.setSize(Math.max(1, w), Math.max(1, h), false)
      camera.aspect = w / Math.max(1, h)
      camera.position.set(0, 0, w < h ? 7.2 : 4.6)
      camera.updateProjectionMatrix()
    },
    frame(_t, dt) {
      p = opts.reduced ? target : damp(p, target, 5, dt)
      const reveal = smooth(seg(p, 0.0, 0.3)) // edge-on in the dark → face
      const explode = smooth(seg(p, 0.42, 0.56)) - smooth(seg(p, 0.66, 0.76))
      const hero = smooth(seg(p, 0.72, 0.95))

      // object choreography
      pivot.rotation.y = lerp(-1.45, 0, reveal) + lerp(0, -0.55, hero) + explode * 0.35
      pivot.rotation.x = lerp(0.5, 0, reveal) + lerp(0, 0.18, hero)
      pivot.rotation.z = lerp(-0.4, 0, reveal) + lerp(0, 0.08, hero)
      pivot.position.x = lerp(0.6, 0, reveal) + lerp(0, 0.95, hero) * (camera.aspect > 1 ? 1 : 0)
      pivot.position.y = lerp(-0.1, 0, reveal) + lerp(0, -0.12, hero)
      const s = lerp(1.35, 1, reveal) * lerp(1, 1.1, hero)
      pivot.scale.setScalar(s)

      // the movement keeps real time — the hands are live
      const now = new Date()
      const sec = now.getSeconds() + now.getMilliseconds() / 1000
      const min = now.getMinutes() + sec / 60
      const hr = (now.getHours() % 12) + min / 60
      hands.second.rotation.z = -deg(sec * 6 - BASE.second)
      hands.minute.rotation.z = -deg(min * 6 - BASE.minute)
      hands.hour.rotation.z = -deg(hr * 30 - BASE.hour)
      // exploded view: hands lift off the dial along its axis (local units ≈ 1/30 of world)
      hands.hour.position.z = explode * 0.012
      hands.minute.position.z = explode * 0.024
      hands.second.position.z = explode * 0.036

      // lighting states: rim only → key light → high key → warm hero
      key.intensity = lerp(0, 60, smooth(seg(p, 0.15, 0.4))) * lerp(1, 0.55, hero)
      key.position.x = lerp(4, 1.5, reveal)
      rim.intensity = lerp(3, 0.6, reveal) + hero * 5
      scene.environmentIntensity = lerp(0.12, 0.8, seg(p, 0.1, 0.5)) - hero * 0.25

      renderer.render(scene, camera)
    },
    dispose() {
      disposeObject(scene)
      env.dispose()
      renderer.dispose()
    },
  }
  return api
}

export default create
