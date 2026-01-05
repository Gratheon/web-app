import Helmet from 'react-helmet'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'urql'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'preact/hooks'

import { apiClient } from './api'
import Page from './page'
import initErrorReporting from './error_reporter'
import GlobalErrorHandler from './error_handler'
import { syncGraphqlSchemaToIndexDB } from './models/db'
import { schemaObject } from './api/schema'
import { UploadProvider } from './contexts/UploadContext'
import { getUser } from './models/user'
import { getUserLanguage } from './models/translationService'
import { SUPPORTED_LANGUAGES } from './config/languages'
import metrics from './metrics'

initErrorReporting()

syncGraphqlSchemaToIndexDB(schemaObject)

export default function App() {
	if (typeof window === 'undefined') {
		return
	}

	const user = useLiveQuery(() => getUser(), [], null)
	const lang = getUserLanguage(user, SUPPORTED_LANGUAGES)

	useEffect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('lang', lang)
		}
	}, [lang])

	useEffect(() => {
		if (user?.id) {
			metrics.setUser(user)
		}
	}, [user])

	return (
		<GlobalErrorHandler>
			<Provider value={apiClient}>
				<UploadProvider>
					<Helmet
					htmlAttributes={{ amp: undefined }}
					title="App"
					titleTemplate="Gratheon.com - %s"
					defaultTitle="Gratheon"
					titleAttributes={{ itemprop: 'name' }}
					meta={[
						{
							name: 'description',
							content: 'Swarm management application',
						},
						{ property: 'og:type', content: 'article' },
					]}
					link={[
						{ rel: 'canonical', href: 'https://app.gratheon.com/' },
					]}
					script={[]}
					noscript={[]}
					style={[]}
				/>

				<BrowserRouter>
					<Page />
				</BrowserRouter>
				</UploadProvider>
			</Provider>
		</GlobalErrorHandler>
	)
}

