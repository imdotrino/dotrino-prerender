// The apps of the ecosystem are single-page apps: the HTML they serve has an empty body,
// so whoever reads it without running JavaScript (the first pass of a search engine, and
// every reader that runs none) finds no text and no links.
//
// `prerenderHtml` writes, right after <body>, what the page already says about itself
// —its <title> and its <meta name="description">— plus links back to the ecosystem. The
// block removes itself as soon as it is parsed: the app shows exactly what it showed
// before, and nothing here depends on how each app mounts.
//
// It is the public shell of the tool. Nothing of the user ever goes in here.

const OPEN = '<!--dotrino-prerender-->'
const CLOSE = '<!--/dotrino-prerender-->'
const ID = 'dotrino-prerender'

const COPY = {
  es: { home: 'https://dotrino.com/', apps: 'Todas las aplicaciones de Dotrino', wiki: 'https://wiki.dotrino.com/', docs: 'Documentación' },
  en: { home: 'https://dotrino.com/en/', apps: 'All Dotrino apps', wiki: 'https://wiki.dotrino.com/en/', docs: 'Documentation' },
}

export class PrerenderError extends Error {
  constructor (code, message) {
    super(message)
    this.name = 'PrerenderError'
    this.code = code
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
  return m ? (m[2] ?? m[3]) : null
}

const metaDescription = (html) => {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if ((attr(tag, 'name') || '').toLowerCase() === 'description') return attr(tag, 'content')
  }
  return null
}

/**
 * Returns `html` with the static block written after <body>. Running it again on its own
 * output replaces the block instead of adding a second one.
 *
 * @param {string} html
 * @param {object} [opts]
 * @param {string|string[]} [opts.text]   extra paragraphs (plain text) under the description
 * @param {{href: string, text: string}[]} [opts.links]   extra links, before the ecosystem ones
 */
export function prerenderHtml (html, opts = {}) {
  if (typeof html !== 'string') throw new PrerenderError('bad-html', 'prerender: html must be a string')

  // What the page says about itself is still text inside an HTML document: it goes in as is.
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()
  if (!title) throw new PrerenderError('no-title', 'prerender: the page has no <title>')
  const description = metaDescription(html)?.trim()
  if (!description) throw new PrerenderError('no-description', 'prerender: the page has no <meta name="description">')

  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0]
  const lang = (htmlTag && attr(htmlTag, 'lang')) || null
  if (!lang) throw new PrerenderError('no-lang', 'prerender: <html> has no lang')
  const copy = COPY[lang.toLowerCase().startsWith('en') ? 'en' : 'es']

  const paragraphs = [].concat(opts.text ?? []).map((p) => `<p>${esc(p)}</p>`).join('')
  const links = [
    ...(opts.links ?? []).map((l) => `<a href="${esc(l.href)}">${esc(l.text)}</a>`),
    `<a href="${copy.home}">${copy.apps}</a>`,
    `<a href="${copy.wiki}">${copy.docs}</a>`,
  ].join(' · ')

  const block =
    `${OPEN}<main id="${ID}"><h1>${title}</h1><p>${description}</p>${paragraphs}<p>${links}</p></main>` +
    `<script>document.getElementById('${ID}').remove()</script>${CLOSE}`

  const from = html.indexOf(OPEN)
  if (from !== -1) {
    const to = html.indexOf(CLOSE, from)
    if (to === -1) throw new PrerenderError('broken-block', 'prerender: the page has an opening marker without its closing one')
    return html.slice(0, from) + block + html.slice(to + CLOSE.length)
  }

  const body = html.match(/<body\b[^>]*>/i)
  if (!body) throw new PrerenderError('no-body', 'prerender: the page has no <body>')
  const at = body.index + body[0].length
  return html.slice(0, at) + '\n    ' + block + html.slice(at)
}
