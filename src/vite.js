import { prerenderHtml } from './index.js'

/**
 * Vite plugin: writes the static block into every HTML page of the build.
 *
 *   import prerender from '@dotrino/prerender/vite'
 *   export default defineConfig({ plugins: [prerender()] })
 *
 * Only on build: in dev the page is never read without JavaScript.
 */
export default function prerender (opts = {}) {
  return {
    name: 'dotrino-prerender',
    apply: 'build',
    transformIndexHtml: (html) => prerenderHtml(html, opts),
  }
}
