import { gql, apiClient } from '@/api'
import {
	upsertTranslation,
	upsertTranslationValue,
	upsertPluralForm
} from '@/models/translations'

const getTranslationsQuery = gql`query getTranslations($inputs: [TranslationInput!]!){
	getTranslations(inputs: $inputs){
		__typename
		id
		key
		context
		values
		plurals
		isPlural
	}
}`

interface TranslationRequest {
	key: string
	context?: string
	isPlural?: boolean
	resolve: (value: any) => void
	reject: (error: any) => void
}

class NewTranslationBatcher {
	private queue: TranslationRequest[] = []
	private timer: ReturnType<typeof setTimeout> | null = null
	private batchDelay: number = 150

	async request(key: string, isPlural: boolean = false, context?: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.queue.push({ key, context, isPlural, resolve, reject })

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
			const inputs = uniqueRequests.map(req => ({
				key: req.key,
				context: req.context || null
			}))

			console.log('[Batcher] Requesting translations for inputs:', inputs);
			const result = await apiClient.query(getTranslationsQuery, { inputs }).toPromise()

			if (result.data?.getTranslations) {
				const translationMap = new Map()

				console.log('[Batcher] Received', result.data.getTranslations.length, 'translations');

				for (const trans of result.data.getTranslations) {
					const translationId = +trans.id;

					const requestedInput = inputs.find(i => i.key === trans.key || i.key.toLowerCase() === trans.key.toLowerCase());
					console.log('[Batcher] Processing translation - requested:', requestedInput, 'received key:', trans.key, 'id:', translationId);

					// ...existing code...

					// Validate that we have a valid translation ID
					if (!translationId || isNaN(translationId)) {
						console.error('[Batcher] ❌ Invalid translation ID:', trans.id, 'for key:', trans.key);
						continue; // Skip this translation
					}

					// Cache in IndexedDB - IMPORTANT: Use the key from the REQUEST, not the response
					// This ensures case-sensitive lookup works
					const requestKey = inputs.find(i => i.key.toLowerCase() === trans.key.toLowerCase())?.key || trans.key;
					console.log('[Batcher] Caching with key:', requestKey, '(original from backend:', trans.key, ')');

					await upsertTranslation({
						id: translationId,
						key: requestKey,  // Use the requested key to match lookups
						context: trans.context
					})

					// Cache translation values
					if (trans.values) {
						for (const [lang, value] of Object.entries(trans.values)) {
							await upsertTranslationValue({
								translationId: translationId,
								lang,
								value: value as string
							})
						}
					}

				// Cache plural forms
				if (trans.plurals) {
					for (const [lang, pluralData] of Object.entries(trans.plurals)) {
						await upsertPluralForm({
							translationId: translationId,
							lang,
							pluralData
						})
					}
				}

					translationMap.set(trans.key, trans)
				}


				batch.forEach(req => {
					const translation = translationMap.get(req.key)
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
			const key = `${req.key}|${req.isPlural}`
			if (!seen.has(key)) {
				seen.set(key, req)
			}
		}

		return Array.from(seen.values())
	}
}

export const newTranslationBatcher = new NewTranslationBatcher()

