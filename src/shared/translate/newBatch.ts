import {apiClient, gql} from '@/api'
import {upsertPluralForm, upsertTranslation, upsertTranslationValue} from '@/models/translations'

const getTranslationsQuery = gql`query getTranslations($inputs: [TranslationInput!]!){
    getTranslations(inputs: $inputs){
        __typename
        id
        key
        namespace
        context
        values
        plurals
        isPlural
    }
}`

interface TranslationRequest {
  key: string
  context?: string
  namespace?: string
  isPlural?: boolean
  resolve: (value: any) => void
  reject: (error: any) => void
}

class NewTranslationBatcher {
  private queue: TranslationRequest[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private batchDelay: number = 150

  async request(key: string, isPlural: boolean = false, context?: string, namespace?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({key, context, namespace, isPlural, resolve, reject})

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
      const inputs = uniqueRequests.map(req => {
        const input: any = {
          key: req.key
        }

        if (req.context) {
          input.context = req.context
        }

        // Only include namespace if it's actually set
        if (req.namespace) {
          input.namespace = req.namespace
        }

        return input
      })

      const result = await apiClient.query(getTranslationsQuery, {inputs}).toPromise()

      if (result.data?.getTranslations) {
        const translationMap = new Map()

        for (const trans of result.data.getTranslations) {
          const translationId = +trans.id;

          if (!translationId || isNaN(translationId)) {
            continue;
          }

          const requestKey = inputs.find(i => i.key.toLowerCase() === trans.key.toLowerCase())?.key || trans.key;

				await upsertTranslation({
				id: translationId,
				key: requestKey,
				namespace: trans.namespace,
				context: trans.context
			})

			if (trans.values) {
				for (const [lang, value] of Object.entries(trans.values)) {
					await upsertTranslationValue({
						translationId: translationId,
						lang,
						value: value as string
					})
				}
			} else if (trans.plurals && !trans.values) {

				for (const [lang, pluralData] of Object.entries(trans.plurals)) {
					const pd = pluralData as any;
					const rawValue = pd?.other || pd?.few || pd?.many || pd?.one || pd?.zero || pd?.two || requestKey;

						// Capitalize first letter for menu items
						const capitalizedValue = rawValue.charAt(0).toUpperCase() + rawValue.slice(1);

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
      const key = `${req.key}|${req.namespace || ''}|${req.isPlural}`
      if (!seen.has(key)) {
        seen.set(key, req)
      }
    }

    return Array.from(seen.values())
  }
}

export const newTranslationBatcher = new NewTranslationBatcher()
