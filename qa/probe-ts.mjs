import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 400, height: 300 } })
await p.goto('http://localhost:5173/qa/viewer/index.html?m=/models/sf/cyberpunk_city.glb')
await p.waitForFunction(() => document.title === 'ready', null, { timeout: 240000 })
console.log(await p.evaluate(() => {
  const T = window.THREE, rc = new T.Raycaster(), out = []
  for (let z = -8; z <= 8; z += 2) {
    const o = new T.Vector3(2.2, 1.0, z)
    const hit = (dx) => { rc.set(o, new T.Vector3(dx, 0, 0)); const h = rc.intersectObject(window.ROOT, true)[0]; return h ? +h.point.x.toFixed(2) + ' ' + h.object.name : '-' }
    const up = () => { rc.set(new T.Vector3(2.2, 0.5, z), new T.Vector3(0, -1, 0)); const h = rc.intersectObject(window.ROOT, true)[0]; return h ? +h.point.y.toFixed(2) : '-' }
    out.push(`z=${z} left:${hit(-1)} right:${hit(1)} ground:${up()}`)
  }
  return out.join('\n')
}))
await b.close()
