import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import type { SceneApi, SceneFactory } from '../../lib/scene'
import { asset } from '../../lib/asset'
import { THREE, makeRenderer, makePipeline, loadGLTF, disposeObject, damp, lerp, seg, smooth, rng } from './common'

/*
 * La jungla.
 * Tiger: "Tiger rebuilt" by kenchoo (CC BY 4.0) — rigged, 6 clips. The Walk clip is played with its time
 * driven by distance travelled (0.67 units/s measured from paw contact), so the paws never slide.
 * At the clearing it stops and the Howl clip is scrubbed by the scroll.
 * Trees: "Jungle Tree" by gelmi.com.br (CC BY 4.0). Undergrowth: Poly Haven scans (CC0).
 */

const GROUND_SPEED = 0.67 // world units per second of the Walk clip, measured from the paw contact phase
const TIGER_SCALE = 1.25

const create: SceneFactory = async (canvas, opts) => {
  const renderer = makeRenderer(canvas, opts)
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = opts.tier === 'high'
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  const scene = new THREE.Scene()
  const fogNight = new THREE.Color('#0b1a13')
  const fogDawn = new THREE.Color('#5b4526')
  scene.background = fogNight.clone()
  scene.fog = new THREE.FogExp2(fogNight.clone(), 0.05)
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 120)
  const pipe = makePipeline(renderer, scene, camera, opts, { strength: 0.45, radius: 0.7, threshold: 0.78 })

  const pmrem = new THREE.PMREMGenerator(renderer)
  const [hdr, tigerG, treeG, fern, calathea, anthurium, roots, moss] = await Promise.all([
    new HDRLoader().loadAsync(asset('/hdri/mossy_forest_1k.hdr')),
    loadGLTF(asset('/models/sf/tiger_rebuilt.glb')),
    loadGLTF(asset('/models/sf/jungle_tree.glb')),
    loadGLTF(asset('/models/jungle/fern_02.glb')),
    loadGLTF(asset('/models/jungle/calathea_orbifolia_01.glb')),
    loadGLTF(asset('/models/jungle/anthurium_botany_01.glb')),
    loadGLTF(asset('/models/jungle/root_cluster_01.glb')),
    loadGLTF(asset('/models/jungle/moss_01.glb')),
  ])
  const env = pmrem.fromEquirectangular(hdr).texture
  hdr.dispose()
  pmrem.dispose()
  scene.environment = env
  scene.environmentIntensity = 0.35

  // light: a low sun behind the canopy that warms up as the scene goes on
  const hemi = new THREE.HemisphereLight('#9cc7b0', '#1a1408', 0.5)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#ffe2a8', 2.2)
  sun.position.set(-6, 9, -14)
  sun.castShadow = opts.tier === 'high'
  sun.shadow.mapSize.set(1024, 1024)
  const sc = sun.shadow.camera as THREE.OrthographicCamera
  sc.left = -6
  sc.right = 6
  sc.top = 6
  sc.bottom = -6
  sc.near = 1
  sc.far = 40
  sun.shadow.bias = -0.0008
  scene.add(sun, sun.target)
  const rim = new THREE.PointLight('#ff9b45', 0, 8, 1.5)
  scene.add(rim)

  // ground: dark loam
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: '#1c2214', roughness: 1 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const rand = rng(21)
  const instanced = (src: THREE.Object3D, placements: { p: THREE.Vector3; s: number; r: number }[], shadow = false) => {
    src.updateMatrixWorld(true)
    const group = new THREE.Group()
    src.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.side = THREE.DoubleSide
      const im = new THREE.InstancedMesh(mesh.geometry, mat, placements.length)
      im.castShadow = shadow
      im.receiveShadow = true
      const m = new THREE.Matrix4()
      placements.forEach((pl, i) => {
        m.compose(pl.p, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pl.r, 0)), new THREE.Vector3().setScalar(pl.s)).multiply(mesh.matrixWorld)
        im.setMatrixAt(i, m)
      })
      im.instanceMatrix.needsUpdate = true
      group.add(im)
    })
    scene.add(group)
    return group
  }
  const scatter = (n: number, xSpread: number, z0: number, z1: number, s0: number, s1: number, keepPath = 1.2) =>
    Array.from({ length: n }, () => {
      let x = (rand() * 2 - 1) * xSpread
      const z = lerp(z0, z1, rand())
      if (Math.abs(x) < keepPath) x = Math.sign(x || 1) * (keepPath + rand() * 1.5)
      // the clearing where the tiger stops stays open toward the camera
      if (z < -4 && z > -11 && x > -2.5 && x < 3.5) x += x < 0.5 ? -3.5 : 3.5
      return { p: new THREE.Vector3(x, 0, z), s: lerp(s0, s1, rand()), r: rand() * Math.PI * 2 }
    })

  const hi = opts.tier === 'high'
  // canopy: real jungle trees, two depth layers
  instanced(treeG.scene, scatter(hi ? 18 : 10, 14, -36, 4, 0.6, 1.05, 3.2), true)
  // undergrowth
  instanced(calathea.scene, scatter(hi ? 60 : 26, 9, -28, 12, 1.4, 2.6, 1.6))
  instanced(fern.scene, scatter(hi ? 80 : 34, 10, -28, 12, 1.1, 2.2, 1.4))
  instanced(anthurium.scene, scatter(hi ? 30 : 14, 7, -22, 10, 1.2, 2.0, 1.6))
  instanced(roots.scene, scatter(hi ? 10 : 5, 6, -24, 6, 0.9, 1.5, 2))
  instanced(moss.scene, scatter(hi ? 40 : 16, 7, -22, 10, 2, 4, 0.4))

  // foreground leaves that brush past the lens
  const nearLeaves = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const c = calathea.scene.clone(true)
    c.scale.setScalar(4 + rand() * 2)
    c.position.set((i % 2 ? 1 : -1) * (1.1 + rand() * 0.5), -0.6, 9.2 - i * 2.6)
    c.rotation.y = rand() * Math.PI
    nearLeaves.add(c)
  }
  scene.add(nearLeaves)

  // ── the tiger
  const tiger = tigerG.scene
  tiger.scale.setScalar(TIGER_SCALE)
  tiger.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) {
      m.castShadow = true
      m.frustumCulled = false
    }
  })
  scene.add(tiger)
  const mixer = new THREE.AnimationMixer(tiger)
  const clip = (n: string) => tigerG.animations.find((a) => a.name === n)!
  const walk = mixer.clipAction(clip('Walk'))
  const howl = mixer.clipAction(clip('Howl'))
  howl.setLoop(THREE.LoopOnce, 1)
  howl.clampWhenFinished = true
  walk.play()
  howl.play()
  const walkDur = clip('Walk').duration
  const howlDur = clip('Howl').duration

  // god rays + dust in the light
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color('#fff1c9') }, uAmt: { value: 0.3 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uColor; uniform float uAmt; uniform float uTime; varying vec2 vUv;
      void main(){ float edge = smoothstep(0.,.4,vUv.x)*smoothstep(1.,.6,vUv.x); float fall = smoothstep(0.,0.85,vUv.y);
        float flick = 0.85 + 0.15*sin(uTime*0.6 + vUv.y*5.0); gl_FragColor = vec4(uColor, edge*fall*uAmt*flick*0.22); }`,
  })
  const shafts: THREE.Mesh[] = []
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 30), shaftMat)
    s.position.set(-7 + rand() * 14, 9, 6 - i * 4.5)
    s.rotation.set(0, rand() * 0.6 - 0.3, -0.42)
    scene.add(s)
    shafts.push(s)
  }
  const dustN = hi ? 1100 : 400
  const dustPos = new Float32Array(dustN * 3)
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (rand() * 2 - 1) * 7
    dustPos[i * 3 + 1] = rand() * 5
    dustPos[i * 3 + 2] = 12 - rand() * 32
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: '#ffe8b0', size: 0.028, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  scene.add(dust)

  let target = 0
  let p = 0
  const look = new THREE.Vector3()
  const head = new THREE.Vector3()
  let headBone: THREE.Object3D | null = null
  tiger.traverse((o) => {
    if (o.name.startsWith('Bip01_Head_')) headBone = o
  })

  // path: the tiger enters from the right and crosses toward the clearing at x≈0.6, z≈-7.5
  const START = new THREE.Vector3(7.5, 0, -9.2)
  const STOP = new THREE.Vector3(0.6, 0, -7.4)
  const pathLen = START.distanceTo(STOP)

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
      p = opts.reduced ? target : damp(p, target, 6, dt)
      const e = smooth(p)

      // tiger: distance-driven walk, then the roar
      const w = smooth(seg(p, 0.16, 0.7))
      const pos = START.clone().lerp(STOP, w)
      tiger.position.copy(pos)
      const dir = STOP.clone().sub(START).normalize()
      tiger.rotation.y = Math.atan2(dir.z, -dir.x) // model faces -x
      const roar = seg(p, 0.76, 0.96)
      walk.time = ((w * pathLen) / TIGER_SCALE / GROUND_SPEED) % walkDur
      walk.weight = 1 - smooth(seg(p, 0.7, 0.76))
      howl.weight = 1 - walk.weight
      howl.time = roar * howlDur * 0.98
      // the head turns toward the camera during the roar
      tiger.rotation.y += smooth(seg(p, 0.72, 0.8)) * 0.85
      mixer.update(0)

      // camera: crouched in the leaves, pushes in, then holds low on the animal
      camera.position.set(lerp(0.2, 0.0, e) + Math.sin(t * 0.33) * 0.05, lerp(1.25, 0.95, e) + Math.sin(t * 0.5) * 0.02, lerp(11, -0.6, smooth(seg(p, 0, 0.82))))
      headBone?.getWorldPosition(head)
      const gaze = smooth(seg(p, 0.12, 0.6))
      look.set(lerp(0.5, head.x || pos.x, gaze), lerp(1.7, (head.y || 1) * 0.9, gaze), lerp(camera.position.z - 8, head.z || pos.z, gaze))
      camera.lookAt(look)
      camera.fov = lerp(camera.aspect < 1 ? 62 : 42, camera.aspect < 1 ? 46 : 30, smooth(seg(p, 0.7, 0.95)))
      camera.updateProjectionMatrix()

      // light: blue night → shafts → warm dawn that rims the tiger
      const dawn = seg(p, 0.4, 0.95)
      const fogC = (scene.fog as THREE.FogExp2).color
      fogC.copy(fogNight).lerp(fogDawn, dawn)
      ;(scene.background as THREE.Color).copy(fogC)
      ;(scene.fog as THREE.FogExp2).density = lerp(0.05, 0.035, dawn)
      hemi.intensity = lerp(0.9, 1.1, e)
      sun.intensity = lerp(1.8, 3.4, dawn)
      sun.color.setHSL(lerp(0.12, 0.075, dawn), 0.85, 0.72)
      sun.target.position.copy(pos)
      scene.environmentIntensity = lerp(0.45, 0.7, dawn)
      rim.position.set(pos.x - 1.2, 1.6, pos.z - 1.6)
      rim.intensity = lerp(0, 9, dawn)
      shaftMat.uniforms.uTime.value = t
      shaftMat.uniforms.uAmt.value = lerp(0.4, 1.3, seg(p, 0.1, 0.6)) * (1 - dawn * 0.35)
      shaftMat.uniforms.uColor.value.setHSL(lerp(0.14, 0.08, dawn), 0.9, 0.82)
      dust.rotation.y = t * 0.01

      pipe.render()
    },
    dispose() {
      mixer.stopAllAction()
      disposeObject(scene)
      env.dispose()
      pipe.dispose()
      renderer.dispose()
    },
  }
  return api
}

export default create
