import { chromium } from 'playwright'
const [sel, frac] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: 960, height: 600 } })
p.on('console', (m) => console.log('C', m.type(), m.text().slice(0, 300)))
p.on('pageerror', (e) => console.log('ERR', e.message))
p.on('requestfailed', (r) => console.log('FAIL', r.url()))
await p.addInitScript(() => { window.__dbg = [] }); await p.goto('http://localhost:4173/')
await p.evaluate(([id, f]) => { const el = document.getElementById(id); scrollTo(0, el.getBoundingClientRect().top + scrollY + f * (el.offsetHeight - innerHeight)) }, [sel, +frac])
for (let i = 0; i < 12; i++) {
  await p.waitForTimeout(5000)
  console.log(i * 5, await p.evaluate((id) => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); return [JSON.stringify(window.__dbg), document.querySelectorAll('canvas').length, Math.round(r.top), Math.round(r.bottom), scrollY, !!e.querySelector('canvas'), e.querySelector('.exp-loading,.exp-fallback')?.textContent] }, sel))
}
await b.close()
