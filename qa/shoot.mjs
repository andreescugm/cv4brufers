// QA: walks the page section by section, screenshots each beat, collects console errors.
// usage: node qa/shoot.mjs <outDir> [mobile] [reduced] [filter]
import { chromium } from 'playwright'
const [out = 'qa/shots', mode = 'desktop', motion = 'full', filter = ''] = process.argv.slice(2)
const mobile = mode === 'mobile'
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: +(process.env.W || 960), height: +(process.env.H || 600) },
  deviceScaleFactor: 1,
  isMobile: mobile, hasTouch: mobile,
  reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference',
})
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.waitForFunction(() => !document.querySelector('.a1-scene-fallback'), null, { timeout: 120000 }).catch(() => console.log('act1 scene not ready'))
await page.waitForTimeout(1500)
const sections = await page.evaluate(() => {
  const ids = ['acto-1','acto-2','acto-3','exp-jungla','exp-producto','exp-ciudad','exp-tipografia','exp-objeto','acto-5']
  return ids.map((id) => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); return { id, top: r.top + scrollY, h: el.id === 'acto-5' ? el.querySelector('.a5-track').offsetHeight : r.height } })
})
const fs = await import('node:fs'); fs.mkdirSync(out, { recursive: true })
const beats = { 'acto-1': [0, .1, .25, .45, .6, .72, .8, .86, .97], 'acto-2': [.2, .6], 'acto-3': [.0, .3, .6, .95], 'exp-jungla': [.05, .3, .55, .72, .85, .97], 'exp-producto': [.1, .35, .55, .9], 'exp-ciudad': [.1, .5, .95], 'exp-tipografia': [.1, .2, .35, .55, .7, .9], 'exp-objeto': [.4], 'acto-5': [.05, .4, .6, .9] }
for (const s of sections) {
  if (filter && !s.id.includes(filter)) continue
  for (const b of beats[s.id]) {
    const y = s.top + b * Math.max(0, s.h - page.viewportSize().height)
    await page.evaluate((y) => window.scrollTo(0, y), y)
    await page.waitForTimeout(s.id.startsWith('exp') && !s.id.includes('tipo') ? 4000 : (s.id === 'acto-1' ? 4000 : 500))
    if (s.id.startsWith('exp') && b === beats[s.id][0]) await page.waitForFunction((id) => { const e = document.getElementById(id); return !e.querySelector('.exp-loading') }, s.id, { timeout: 120000 }).catch(() => console.log(s.id, 'not ready'))
    await page.screenshot({ timeout: 180000, path: `${out}/${s.id}-${String(Math.round(b*100)).padStart(3,'0')}.png` })
  }
}
// footer
await page.evaluate(() => document.getElementById('contacto').scrollIntoView())
await page.waitForTimeout(400)
if (!filter) await page.screenshot({ timeout: 180000, path: `${out}/zz-footer.png` })
fs.writeFileSync(`${out}/console.txt`, errors.join('\n') || 'no errors')
console.log(errors.length ? errors.slice(0, 20).join('\n') : 'no console errors/warnings')
await browser.close()
