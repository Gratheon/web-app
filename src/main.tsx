import './style/index.module.css'
import App from './components/app.tsx'

import { hydrate, prerender as ssr } from 'preact-iso';

if (typeof window !== "undefined") {
    hydrate(<App />, document.getElementById("app"));
}

export async function prerender(data: any) {
    // @ts-ignore
    const { html, links: discoveredLinks } = ssr(<App />);

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
            title: 'My cool page',
            // Sets any additional elements you want injected into the `<head>`:
            //   <link rel="stylesheet" href="foo.css">
            //   <meta property="og:title" content="Social media title">
            elements: new Set([
                { type: 'link', props: { rel: 'stylesheet', href: 'foo.css' } },
                { type: 'meta', props: { property: 'og:title', content: 'Social media title' } }
            ])
        }
    };
}