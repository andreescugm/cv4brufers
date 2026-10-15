// usage: node qa/inspect.mjs out.png "<query string>"
import { chromium } from 'playwright'
const [out, qs] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 900, height: 600 } })
p.on('pageerror', (e) => console.log('ERR', e.message)); p.on('console', (m) => m.type() === 'error' && console.log('CERR', m.text().slice(0, 300)))
await p.goto('http://localhost:5173/qa/viewer/index.html?' + qs)
await p.waitForFunction(() => document.title === 'ready', null, { timeout: 240000 })
await p.screenshot({ path: out })
console.log(JSON.stringify(await p.evaluate(() => window.INFO)))
await b.close()
