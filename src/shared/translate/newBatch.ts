import {apiClient, gql} from '@/api'
import {upsertPluralForm, upsertTranslation, upsertTranslationValue} from '@/models/translations'

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
    console.log(`[Batcher] Request queued: key="${key}", isPlural=${isPlural}, context="${context}"`);
    return new Promise((resolve, reject) => {
      this.queue.push({key, context, isPlural, resolve, reject})

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

    console.log(`[Batcher] Flushing batch of ${batch.length} requests`);

    try {
      const uniqueRequests = this.deduplicateRequests(batch)
      const inputs = uniqueRequests.map(req => ({
        key: req.key,
        context: req.context || null
      }))

      console.log(`[Batcher] Fetching translations for inputs:`, inputs);
      const result = await apiClient.query(getTranslationsQuery, {inputs}).toPromise()
      console.log(`[Batcher] Received result:`, result);

      if (result.data?.getTranslations) {
        const translationMap = new Map()

        for (const trans of result.data.getTranslations) {
          console.log(`[Batcher] Processing translation:`, trans);
          const translationId = +trans.id;

          if (!translationId || isNaN(translationId)) {
            console.error('[Batcher] Invalid translation ID:', trans.id, 'for key:', trans.key);
            continue;
          }

          const requestKey = inputs.find(i => i.key.toLowerCase() === trans.key.toLowerCase())?.key || trans.key;

          // Special warning for "Hives" translation issue
          if (trans.key === 'Hives' && !trans.values) {
            console.warn(`[Batcher] 🚨 CRITICAL: "Hives" has no values field!`);
            console.warn(`[Batcher] 🚨 This is a MENU LABEL, not a count-based plural.`);
            console.warn(`[Batcher] 🚨 Backend should have: values: {ru: "Ульи", en: "Hives", ...}`);
            console.warn(`[Batcher] 🚨 See BACKEND-FIX-HIVES-TRANSLATION.md for fix`);
          }

			await upsertTranslation({
				id: translationId,
				key: requestKey,
				context: trans.context
			})

			if (trans.values) {
				console.log(`[Batcher] Upserting values for "${trans.key}":`, trans.values);
				for (const [lang, value] of Object.entries(trans.values)) {
					await upsertTranslationValue({
						translationId: translationId,
						lang,
						value: value as string
					})
				}
			} else if (trans.plurals && !trans.values) {
				console.log(`[Batcher] ⚠️ No values for "${trans.key}", deriving from plurals:`, trans.plurals);
				console.log(`[Batcher] ⚠️ WARNING: "${trans.key}" is using plural forms for a menu label - this should have proper values in backend!`);

				for (const [lang, pluralData] of Object.entries(trans.plurals)) {
					const pd = pluralData as any;
					const rawValue = pd?.other || pd?.few || pd?.many || pd?.one || pd?.zero || pd?.two || requestKey;

					// Capitalize first letter for menu items
					const capitalizedValue = rawValue.charAt(0).toUpperCase() + rawValue.slice(1);

					console.log(`[Batcher] Deriving for "${trans.key}" (lang=${lang}):`);
					console.log(`  - Available forms: ${Object.keys(pd || {}).join(', ')}`);
					console.log(`  - Selected form: ${rawValue}`);
					console.log(`  - Capitalized: ${capitalizedValue}`);
					console.log(`  - ⚠️ This is a WORKAROUND - proper fix needed in backend!`);

					await upsertTranslationValue({
						translationId: translationId,
						lang,
						value: capitalizedValue as string
					})
				}
			}

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
            console.log(`[Batcher] Resolving request for "${req.key}" with:`, translation);
            req.resolve(translation)
          } else {
            console.warn(`[Batcher] Translation not found for "${req.key}"`);
            req.reject(new Error('Translation not found'))
          }
        })
      } else {
        console.error('[Batcher] No translation data in result');
        batch.forEach(req => req.reject(new Error('No translation data')))
      }
    } catch (error) {
      console.error('[Batcher] Flush error:', error);
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

