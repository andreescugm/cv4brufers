import type { SceneApi, SceneFactory } from '../../lib/scene'
import { THREE, makeRenderer, makePipeline, loadGLTF, disposeObject, damp, lerp, seg, smooth } from './common'

/*
 * La ciudad — a real city at night.
 * "Osaka downtown" by matousekfoto (CC BY 4.0): a photogrammetry scan captured at dusk.
 * The texture already holds the city's lights; a shader lifts only the brightest pixels into emission,
 * so the bloom catches real windows and streets, not painted ones. The camera flies it like a drone.
 */

const create: SceneFactory = async (canvas, opts) => {
  const renderer = makeRenderer(canvas, opts)
  renderer.toneMappingExposure = 1.15
  const scene = new THREE.Scene()
  const sky = new THREE.Color('#070a14')
  scene.background = sky.clone()
  scene.fog = new THREE.Fog(sky.clone(), 30, 95)
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400)
  const pipe = makePipeline(renderer, scene, camera, opts, { strength: 1.1, radius: 0.6, threshold: 0.55 })

  const gltf = await loadGLTF(opts.tier === 'high' ? '/models/sf/osaka_downtown.glb' : '/models/sf/osaka_downtown_lo.glb')
  const city = gltf.scene
  const glow = { value: 0 }
  city.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const src = m.material as THREE.MeshStandardMaterial
    // unlit: the scan's texture is the light of the city
    const mat = new THREE.MeshBasicMaterial({ map: src.map, fog: true })
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uGlow = glow
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uGlow;')
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
           float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
           float lit = smoothstep(0.42, 0.85, lum);
           diffuseColor.rgb = diffuseColor.rgb * (0.55 + 0.45 * (1.0 - uGlow * 0.5)) + diffuseColor.rgb * lit * uGlow * 2.6;`,
        )
    }
    m.material = mat
    src.dispose()
  })
  scene.add(city)
  const box = new THREE.Box3().setFromObject(city)
  const c = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())

  // a thin layer of haze above the rooftops
  const hazeMat = new THREE.MeshBasicMaterial({ color: '#4a5c9a', transparent: true, opacity: 0.12, depthWrite: false, fog: false })
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 2, size.z * 2), hazeMat)
  haze.rotation.x = -Math.PI / 2
  haze.position.set(c.x, box.max.y + 0.5, c.z)
  scene.add(haze)

  let target = 0
  let p = 0
  const look = new THREE.Vector3()
  const R = Math.max(size.x, size.z)

  const api: SceneApi = {
    setProgress(v) {
      target = v
      if (opts.reduced) p = v
    },
    resize(w, h) {
      pipe.setSize(Math.max(1, w), Math.max(1, h))
      camera.aspect = w / Math.max(1, h)
      camera.fov = w < h ? 62 : 42
      camera.updateProjectionMatrix()
    },
    frame(t, dt) {
      p = opts.reduced ? target : damp(p, target, 5, dt)
      // drone: stays inside the scan so its edges are never seen; the far side dissolves into the night haze
      const dive = smooth(seg(p, 0.1, 0.65))
      const out = smooth(seg(p, 0.75, 1))
      const ang = lerp(-1.1, 1.2, smooth(p)) + Math.sin(t * 0.05) * 0.02
      const radius = lerp(R * 0.3, R * 0.14, dive) + out * R * 0.12
      const height = lerp(size.y * 1.9, size.y * 0.62, dive) + out * size.y * 1.4
      camera.position.set(c.x + Math.sin(ang) * radius, box.min.y + height + Math.sin(t * 0.6) * 0.05, c.z + Math.cos(ang) * radius)
      // look across the city, past its centre, toward a horizon swallowed by the haze
      const ahead = ang + Math.PI + 0.35
      look.set(c.x + Math.sin(ahead) * R * 0.35, box.min.y + lerp(size.y * 0.1, size.y * 0.35, dive), c.z + Math.cos(ahead) * R * 0.35)
      camera.lookAt(look)
      camera.rotation.z += Math.sin(dive * Math.PI) * 0.04

      // the city turns its lights up as the drone descends
      glow.value = lerp(0.25, 1, smooth(seg(p, 0.05, 0.55)))
      const fog = scene.fog as THREE.Fog
      fog.near = lerp(R * 0.18, R * 0.1, dive)
      fog.far = lerp(R * 0.62, R * 0.5, dive) + out * R * 0.15
      hazeMat.opacity = 0.12 * (1 - dive) + 0.05
      if (pipe.bloom) pipe.bloom.strength = lerp(0.6, 1.25, glow.value)

      pipe.render()
    },
    dispose() {
      disposeObject(scene)
      pipe.dispose()
      renderer.dispose()
    },
  }
  return api
}

export default create
