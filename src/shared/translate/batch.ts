import { gql, apiClient } from '@/api'
import { updateLocale } from '@/models/locales'

const translateBatchQuery = gql`query translateBatch($requests: [TranslateRequest!]!){
	translateBatch(requests: $requests){
		__typename
		id
		en
		ru
		et
		tr
		pl
		de
		fr
		key
	}
}`

interface TranslationRequest {
	en: string
	tc: string
	resolve: (value: any) => void
	reject: (error: any) => void
}

class TranslationBatcher {
	private queue: TranslationRequest[] = []
	private timer: NodeJS.Timeout | null = null
	private batchDelay: number = 50

	async request(en: string, tc: string = ''): Promise<any> {
		return new Promise((resolve, reject) => {
			this.queue.push({ en, tc, resolve, reject })

			if (this.timer) {
				clearTimeout(this.timer)
			}

			this.timer = setTimeout(() => this.flush(), this.batchDelay)
		})
	}

	private async flush() {
		if (this.queue.length === 0) return

		const batch = [...this.queue]
		this.queue = []
		this.timer = null

		try {
			const uniqueRequests = this.deduplicateRequests(batch)

			const requests = uniqueRequests.map(req => {
				// Only use composite keys for plural forms
				if (req.tc && req.tc.startsWith('plural:')) {
					// Extract simple form from detailed context
					// "plural:few (genitive singular...)" -> "plural:few"
					const simpleContext = req.tc.split(' (')[0]
					const shortKey = `${req.en}__ctx__${simpleContext}`

					return {
						en: req.en,
						tc: req.tc,  // Full detailed context for LLM
						key: shortKey  // Short key for DB (only for plural forms)
					}
				} else {
					// Regular translation (with or without context)
					return {
						en: req.en,
						tc: req.tc || ''
						// No key field - will use 'en' for lookup
					}
				}
			})

			const result = await apiClient.query(translateBatchQuery, { requests }).toPromise()

			if (result.data?.translateBatch) {
				const translationMap = new Map()

				for (const locale of result.data.translateBatch) {
					const request = requests.find(r => r.en === locale.en)

					// Use the short key that was already calculated, not the full context
					const localeWithKey = {
						...locale,
						key: request?.key || locale.en
					}

					translationMap.set(locale.en, locale)
					await updateLocale(localeWithKey)
				}

				batch.forEach(req => {
					const translation = translationMap.get(req.en)
					if (translation) {
						req.resolve(translation)
					} else {
						req.reject(new Error('Translation not found'))
					}
				})
			} else {
				batch.forEach(req => req.reject(new Error('No translation data')))
			}
		} catch (error) {
			batch.forEach(req => req.reject(error))
		}
	}

	private deduplicateRequests(requests: TranslationRequest[]): TranslationRequest[] {
		const seen = new Map<string, TranslationRequest>()

		for (const req of requests) {
			const key = `${req.en}|${req.tc}`
			if (!seen.has(key)) {
				seen.set(key, req)
			}
		}

		return Array.from(seen.values())
	}
}

export const translationBatcher = new TranslationBatcher()
