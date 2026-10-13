import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prerenderHtml, PrerenderError } from '../src/index.js'
import prerender from '../src/vite.js'

const page = ({ lang = 'es', head = '<title>Chat — Dotrino</title><meta name="description" content="Habla con quien quieras, sin cuenta.">' } = {}) =>
  `<!doctype html><html lang="${lang}"><head>${head}</head><body class="x"><div id="app"></div></body></html>`

test('writes the title, the description and the links right after <body>', () => {
  const out = prerenderHtml(page())
  const body = out.slice(out.indexOf('<body class="x">'))
  assert.match(body, /^<body class="x">\s*<!--dotrino-prerender--><main id="dotrino-prerender">/)
  assert.match(out, /<h1>Chat — Dotrino<\/h1><p>Habla con quien quieras, sin cuenta\.<\/p>/)
  assert.match(out, /<a href="https:\/\/dotrino\.com\/">Todas las aplicaciones de Dotrino<\/a>/)
  assert.match(out, /<a href="https:\/\/wiki\.dotrino\.com\/">Documentación<\/a>/)
  assert.ok(out.includes('<div id="app"></div>'), 'the mount point is untouched')
})

test('the block removes itself as soon as it is parsed', () => {
  const out = prerenderHtml(page())
  assert.match(out, /<\/main><script>document\.getElementById\('dotrino-prerender'\)\.remove\(\)<\/script><!--\/dotrino-prerender-->/)
})

test('an English page links to the English home and wiki', () => {
  const out = prerenderHtml(page({ lang: 'en-US' }))
  assert.match(out, /<a href="https:\/\/dotrino\.com\/en\/">All Dotrino apps<\/a>/)
  assert.match(out, /<a href="https:\/\/wiki\.dotrino\.com\/en\/">Documentation<\/a>/)
})

test('running it twice leaves one block', () => {
  const once = prerenderHtml(page())
  const twice = prerenderHtml(once.replace('sin cuenta', 'sin registro'))
  assert.equal(twice.split('<main id="dotrino-prerender">').length, 2)
  assert.ok(twice.includes('<p>Habla con quien quieras, sin registro.</p>'), 'the block follows the page')
})

test('reads the description whatever the order and the quotes of its attributes', () => {
  const out = prerenderHtml(page({ head: "<title>T</title><meta content='Una descripción' name='description'>" }))
  assert.ok(out.includes('<p>Una descripción</p>'))
})

test('extra text is escaped; extra links go first', () => {
  const out = prerenderHtml(page(), { text: ['a < b'], links: [{ href: 'https://wiki.dotrino.com/x/?a=1&b=2', text: 'Cómo se usa' }] })
  assert.ok(out.includes('<p>a &lt; b</p>'))
  assert.ok(out.includes('<a href="https://wiki.dotrino.com/x/?a=1&amp;b=2">Cómo se usa</a> · <a href="https://dotrino.com/">'))
})

test('a page that does not say what it is stops the build', () => {
  const code = (fn) => { try { fn() } catch (e) { assert.ok(e instanceof PrerenderError); return e.code } return null }
  assert.equal(code(() => prerenderHtml(page({ head: '<meta name="description" content="x">' }))), 'no-title')
  assert.equal(code(() => prerenderHtml(page({ head: '<title>T</title>' }))), 'no-description')
  assert.equal(code(() => prerenderHtml(page({ head: '<title>T</title><meta name="description" content="">' }))), 'no-description')
  assert.equal(code(() => prerenderHtml('<html><head><title>T</title><meta name="description" content="x"></head><body></body></html>')), 'no-lang')
  assert.equal(code(() => prerenderHtml('<html lang="es"><head><title>T</title><meta name="description" content="x"></head></html>')), 'no-body')
  assert.equal(code(() => prerenderHtml(page().replace('<div id="app">', '<!--dotrino-prerender--><div id="app">'))), 'broken-block')
})

test('the Vite plugin only runs on build and writes the block', () => {
  const plugin = prerender({ text: 'Más' })
  assert.equal(plugin.apply, 'build')
  assert.ok(plugin.transformIndexHtml(page()).includes('<p>Más</p>'))
})
