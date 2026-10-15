import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 400, height: 300 } })
await p.goto('http://localhost:5173/qa/viewer/index.html?m=/models/sf/tiger_rebuilt.glb')
await p.waitForFunction(() => document.title === 'ready', null, { timeout: 240000 })
console.log(await p.evaluate(() => {
  const T = window.THREE, root = window.ROOT, out = []
  for (const name of ['Walk', 'Walk Fast', 'Run', 'Howl']) {
    const clip = window.ANIMS.find(a => a.name === name)
    const mixer = new T.AnimationMixer(root); const act = mixer.clipAction(clip); act.play()
    const get = (n) => { let x; root.traverse(o => { if (o.name.startsWith(n)) x = o }); return x }
    const pel = get('Bip01_Pelvis'), hand = get('Bip01_L_Finger0_'), foot = get('Bip01_L_Toe0_')
    const v = new T.Vector3(), rows = []
    const N = 24
    for (let i = 0; i <= N; i++) {
      mixer.setTime(clip.duration * i / N); root.updateMatrixWorld(true)
      const pw = pel.getWorldPosition(v.clone()), hw = hand.getWorldPosition(v.clone()), fw = foot.getWorldPosition(v.clone())
      rows.push([i, pw.x, pw.z, hw.x, hw.y, hw.z, fw.x, fw.y].map(n => +(+n).toFixed(3)).join(' '))
    }
    out.push('== ' + name + ' dur ' + clip.duration.toFixed(3) + '\n i pelX pelZ handX handY handZ footX footY\n' + rows.join('\n'))
    mixer.stopAllAction(); mixer.uncacheRoot(root)
  }
  return out.join('\n')
}))
await b.close()
