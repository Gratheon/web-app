import './index.css'
import App from './app'

import { hydrate, prerender as ssr } from 'preact-iso'
import { initializeEnvironment } from './env'
import metrics from './metrics'

const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;

function scheduleAfterPageLoad(callback: () => void) {
	if (typeof window === 'undefined') {
		return
	}

	const runWhenIdle = () => {
		if ('requestIdleCallback' in window) {
			window.requestIdleCallback(callback, { timeout: 2_000 })
			return
		}

		globalThis.setTimeout(callback, 0)
	}

	const runAfterLoad = () => {
		globalThis.setTimeout(runWhenIdle, 3_000)
	}

	if (document.readyState === 'complete') {
		runAfterLoad()
		return
	}

	window.addEventListener('load', runAfterLoad, { once: true })
}

if (typeof window !== 'undefined') {
	;(async () => {
		await initializeEnvironment()

		const appElement = <App />;

		hydrate(appElement, document.getElementById('app'))

		if (!isDev) {
			scheduleAfterPageLoad(() => {
				void metrics.init()
			})
		}
	})()
}

export async function prerender(data: any) {
	const appElement = <App />;

	// @ts-ignore
	const { html, links: discoveredLinks } = ssr(appElement)

	return {
		html,
		// Optionally add additional links that should be
		// prerendered (if they haven't already been)
		links: new Set([...discoveredLinks, '/foo', '/bar']),
		// Optionally configure and add elements to the `<head>` of
		// the prerendered HTML document
		head: {
			// Sets the "lang" attribute: `<html lang="en">`
			lang: 'en',
			// Sets the title for the current page: `<title>My cool page</title>`
			title: 'Gratheon',
			// Sets any additional elements you want injected into the `<head>`:
			//   <link rel="stylesheet" href="foo.css">
			//   <meta property="og:title" content="Social media title">
			elements: new Set([
				{ type: 'link', props: { rel: 'stylesheet', href: 'foo.css' } },
				{
					type: 'meta',
					props: { property: 'og:title', content: 'Modular robotic beehive' },
				},
			]),
		},
	}
}
