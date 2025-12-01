import Helmet from 'react-helmet'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'urql'

import { apiClient } from './api'
import Page from './page'
import Paywall from './page/paywall'
import { isLoggedIn } from './user'
import isDev from './isDev'

import initErrorReporting from './error_reporter'
import GlobalErrorHandler from './error_handler'
import { syncGraphqlSchemaToIndexDB } from './models/db'
import { schemaObject } from './api/schema'
import { UploadProvider } from './contexts/UploadContext'

initErrorReporting()

// create index db schema out of graphql schema
syncGraphqlSchemaToIndexDB(schemaObject)

export default function App() {
	if (typeof window === 'undefined') {
		return
	}

	return (
		<GlobalErrorHandler>
			<Provider value={apiClient}>
				<UploadProvider>
					<Helmet
					htmlAttributes={{ lang: 'en', amp: undefined }} // amp takes no value
					title="App"
					titleTemplate="Gratheon.com - %s"
					defaultTitle="Gratheon"
					titleAttributes={{ itemprop: 'name', lang: 'en' }}
					// base={{ target: '_blank', href: 'https://app.gratheon.com/' }}
					meta={[
						{
							name: 'description',
							content: 'Swarm management application',
						},
						{ property: 'og:type', content: 'article' },
					]}
					link={[
						{ rel: 'canonical', href: 'https://app.gratheon.com/' },
						// { rel: 'apple-touch-icon', href: 'http://mysite.com/img/apple-touch-icon-57x57.png' },
						// { rel: 'apple-touch-icon', sizes: '72x72', href: 'http://mysite.com/img/apple-touch-icon-72x72.png' }
					]}
					script={
						[
							// { src: 'http://include.com/pathtojs.js', type: 'text/javascript' },
							// { type: 'application/ld+json', innerHTML: `{ "@context": "http://schema.org" }` }
						]
					}
					noscript={
						[
							// { innerHTML: `<link rel="stylesheet" type="text/css" href="foo.css" />` }
						]
					}
					style={
						[
							// { type: 'text/css', cssText: 'body {background-color: blue;} p {font-size: 12px;}' }
						]
					}
					// onChangeClientState={(newState) => console.log(newState)}
				/>

				<BrowserRouter>
					<Paywall isLoggedIn={isLoggedIn()} />
					<Page />
				</BrowserRouter>
				</UploadProvider>
			</Provider>
		</GlobalErrorHandler>
	)
}
