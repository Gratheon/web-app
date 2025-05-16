import './index.css'
import App from './app'
import { PostHogProvider } from 'posthog-js/react'

import { hydrate, prerender as ssr } from 'preact-iso'
import { initializeEnvironment } from './env'

if (typeof window !== 'undefined') {
	// Initialize environment check before hydrating the app
	;(async () => {
		await initializeEnvironment()
		hydrate(
			<PostHogProvider
				apiKey={'phc_cYQZSQ8ZJ8PjGGiT67gLusRp55EjZT41z2pHX6xtPZv'}
				options={{
					api_host: 'https://eu.i.posthog.com',
					debug: import.meta.env.MODE === 'development',
				}}
			>
				<App />
			</PostHogProvider>,
			document.getElementById('app')
		)
	})()
}

export async function prerender(data: any) {
	// @ts-ignore
	const { html, links: discoveredLinks } = ssr(
		<PostHogProvider
			apiKey={'phc_cYQZSQ8ZJ8PjGGiT67gLusRp55EjZT41z2pHX6xtPZv'}
			options={{
				api_host: 'https://eu.i.posthog.com',
				debug: import.meta.env.MODE === 'development',
			}}
		>
			<App />
		</PostHogProvider>
	)

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
