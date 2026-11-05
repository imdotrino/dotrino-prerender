import { prerenderHtml } from './index.js'

/**
 * Vite plugin: writes the static block into every HTML page of the build.
 *
 *   import prerender from '@dotrino/prerender/vite'
 *   export default defineConfig({ plugins: [prerender()] })
 *
 * Only on build: in dev the page is never read without JavaScript.
 *
 * @param {import('./index.js').PrerenderOptions} [opts]
 * @returns {{ name: string, apply: 'build', transformIndexHtml: (html: string) => string }}
 */
export default function prerender (opts = {}) {
  return {
    name: 'dotrino-prerender',
    apply: 'build',
    transformIndexHtml: (/** @type {string} */ html) => prerenderHtml(html, opts),
  }
}
