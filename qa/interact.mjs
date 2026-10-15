// Functional checks: micro-interactions, object lab, links, keyboard, resize, scroll-back.
import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
const log = (k, v) => console.log(k.padEnd(48), v)
const scrollToSection = async (id, f) => page.evaluate(([id, f]) => { const el = document.getElementById(id); const top = el.getBoundingClientRect().top + scrollY; scrollTo(0, top + f * (el.offsetHeight - innerHeight)) }, [id, f])

// Act III — Suby headline toggle
await scrollToSection('acto-3', 0.2); await page.waitForTimeout(300)
const before = await page.textContent('.m-suby-line')
await page.click('.m-suby .m-btn'); const after = await page.textContent('.m-suby-line')
log('Suby toggle changes headline', before !== after ? 'PASS' : 'FAIL')
// Belfort sliders
await scrollToSection('acto-3', 0.35); await page.waitForTimeout(300)
const d0 = await page.getAttribute('.m-belfort-svg path', 'd')
await page.fill('.m-range >> nth=0 >> input', '10').catch(async () => { await page.locator('.m-range input').first().evaluate((el) => { el.value = '10'; el.dispatchEvent(new Event('input', { bubbles: true })) }) })
await page.locator('.m-range input').nth(1).focus(); await page.keyboard.press('End')
const d1 = await page.getAttribute('.m-belfort-svg path', 'd')
log('Belfort sliders reshape the line', d0 !== d1 ? 'PASS' : 'FAIL')
// Hormozi stepper keeps focus and updates
await scrollToSection('acto-3', 0.6); await page.waitForTimeout(300)
const v0 = await page.textContent('.m-value b')
const up = page.getByRole('button', { name: 'Subir Resultado soñado' }); await up.click(); await up.click()
const v1 = await page.textContent('.m-value b')
const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
log('Hormozi value updates', v0 !== v1 ? `PASS (${v0}→${v1})` : 'FAIL')
log('Hormozi button keeps focus after click', focused === 'Subir Resultado soñado' ? 'PASS' : `FAIL (${focused})`)
// Hughes reveal
await scrollToSection('acto-3', 0.85); await page.waitForTimeout(300)
await page.click('.m-hughes .m-btn'); log('Hughes reveal toggles', (await page.getAttribute('.m-hughes .m-btn', 'aria-pressed')) === 'true' ? 'PASS' : 'FAIL')

// Object lab
await scrollToSection('exp-objeto', 0.4); await page.waitForTimeout(3500)
const canvasOk = await page.evaluate(() => !!document.querySelector('#exp-objeto canvas'))
log('Object lab canvas mounted', canvasOk ? 'PASS' : 'FAIL')
const shot1 = await page.screenshot({ clip: { x: 520, y: 150, width: 400, height: 600 } })
await page.getByRole('radio', { name: 'Cromo' }).click(); await page.waitForTimeout(1500)
const shot2 = await page.screenshot({ clip: { x: 520, y: 150, width: 400, height: 600 } })
log('Material switch changes render', Buffer.compare(shot1, shot2) !== 0 ? 'PASS' : 'FAIL')
await page.screenshot({ path: 'qa/interact-chrome.png' })
await page.mouse.move(720, 450); await page.mouse.down(); await page.mouse.move(900, 460, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(400)
const shot3 = await page.screenshot({ clip: { x: 520, y: 150, width: 400, height: 600 } })
log('Drag rotates the bust', Buffer.compare(shot2, shot3) !== 0 ? 'PASS' : 'FAIL')
await page.focus('.obj-host'); await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(400)
const shot4 = await page.screenshot({ clip: { x: 520, y: 150, width: 400, height: 600 } })
log('Arrow keys rotate the bust', Buffer.compare(shot3, shot4) !== 0 ? 'PASS' : 'FAIL')
await page.getByRole('radio', { name: 'Calor' }).click(); await page.waitForTimeout(1500); await page.screenshot({ path: 'qa/interact-heat.png' })
await page.getByRole('radio', { name: 'Malla' }).click(); await page.waitForTimeout(1500); await page.screenshot({ path: 'qa/interact-wire.png' })

// Tech notes open
const det = page.locator('#exp-objeto details'); await det.locator('summary').click()
log('Tech note expands', (await det.getAttribute('open')) !== null ? 'PASS' : 'FAIL')

// Contact links
const hrefs = await page.$$eval('#contacto a', (as) => as.map((a) => a.getAttribute('href')))
log('Footer contact links', hrefs.join(' | '))
log('No placeholder phone/WhatsApp rendered', hrefs.every((h) => !h.startsWith('tel:') && !h.includes('wa.me')) ? 'PASS (phone not set yet)' : 'phone set')
// Nav anchor and skip link
const fresh = await b.newPage({ viewport: { width: 1440, height: 900 } })
await fresh.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await fresh.waitForTimeout(300); await fresh.keyboard.press('Tab')
log('First Tab lands on skip link', (await fresh.evaluate(() => document.activeElement?.textContent)) === 'Saltar al contacto' ? 'PASS' : 'FAIL')
await fresh.keyboard.press('Enter'); await fresh.waitForTimeout(300)
const inView = await fresh.evaluate(() => { const r = document.getElementById('contacto').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 })
await fresh.close()
log('Skip link reaches contact', inView ? 'PASS' : 'FAIL')
// Scroll back up: Act I timeline rewinds to the poster
await page.evaluate(() => scrollTo(0, document.getElementById('acto-2').offsetTop)); await page.waitForTimeout(300)
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500)
const posterOpacity = await page.evaluate(() => getComputedStyle(document.querySelector('.a1-name-top')).opacity)
log('Scrolling back to top restores the poster', posterOpacity === '1' ? 'PASS' : `FAIL (${posterOpacity})`)
// Resize mid-scene
await scrollToSection('exp-ciudad', 0.5); await page.waitForTimeout(2500)
await page.setViewportSize({ width: 820, height: 1000 }); await page.waitForTimeout(800)
const cw = await page.evaluate(() => { const c = document.querySelector('#exp-ciudad canvas'); return c ? [c.clientWidth, c.width] : null })
log('Canvas follows resize', cw && cw[0] === 820 ? `PASS ${cw}` : `FAIL ${cw}`)
await page.screenshot({ path: 'qa/interact-resize.png' })
// Far-away scenes are released
const mounted = await page.evaluate(() => [...document.querySelectorAll('.exp')].map((e) => e.id + ':' + !!e.querySelector('canvas')))
log('Mounted canvases near city', mounted.join(' '))
console.log('errors:', errs.length ? errs : 'none')
await b.close()
