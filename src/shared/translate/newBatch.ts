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

  private isDebugEnabled(): boolean {
    return typeof window !== 'undefined' && Boolean((window as any).__DEBUG_TRANSLATIONS__)
  }

  private debugLog(...args: any[]) {
    if (this.isDebugEnabled()) {
      console.debug('[newTranslationBatcher]', ...args)
    }
  }

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
        const persistedRecords = new Set<string>()

        for (const req of batch) {
          const translation = result.data.getTranslations.find((trans: any) =>
            this.isTranslationMatch(req, trans)
          )

          if (!translation) {
            req.reject(new Error('Translation not found'))
            continue
          }

          await this.persistTranslationForRequest(req, translation, persistedRecords)
          req.resolve(translation)
        }
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
      const key = `${req.key}|${req.context || ''}|${req.namespace || ''}|${req.isPlural}`
      if (!seen.has(key)) {
        seen.set(key, req)
      }
    }

    return Array.from(seen.values())
  }

  private isTranslationMatch(req: TranslationRequest, trans: any): boolean {
    const requestKey = req.key.toLowerCase()
    const translationKey = String(trans?.key || '').toLowerCase()
    if (requestKey !== translationKey) {
      return false
    }

    const requestContext = req.context ?? null
    const translationContext = trans?.context ?? null
    if (requestContext !== translationContext) {
      return false
    }

    const requestNamespace = req.namespace ?? null
    const translationNamespace = trans?.namespace ?? null
    return requestNamespace === translationNamespace
  }

  private async persistTranslationForRequest(
    req: TranslationRequest,
    trans: any,
    persistedRecords: Set<string>
  ) {
    const translationId = +trans.id
    if (!translationId || isNaN(translationId)) {
      return
    }

    const cacheKey = `${translationId}|${req.key}|${req.context || ''}|${req.namespace || ''}`
    if (persistedRecords.has(cacheKey)) {
      return
    }
    persistedRecords.add(cacheKey)

    const persistedTranslationId = await upsertTranslation({
      id: translationId,
      key: req.key,
      namespace: req.namespace,
      context: req.context
    })

    if (persistedTranslationId !== translationId) {
      this.debugLog('translation id remapped', {
        key: req.key,
        context: req.context,
        namespace: req.namespace,
        remoteId: translationId,
        localId: persistedTranslationId
      })
    }

    if (trans.values) {
      for (const [lang, value] of Object.entries(trans.values)) {
        await upsertTranslationValue({
          translationId: persistedTranslationId,
          lang,
          value: value as string
        })
      }
    } else if (trans.plurals && !trans.values) {
      for (const [lang, pluralData] of Object.entries(trans.plurals)) {
        const pd = pluralData as any
        const rawValue = pd?.other || pd?.few || pd?.many || pd?.one || pd?.zero || pd?.two || req.key
        const capitalizedValue = rawValue.charAt(0).toUpperCase() + rawValue.slice(1)

        await upsertTranslationValue({
          translationId: persistedTranslationId,
          lang,
          value: capitalizedValue as string
        })
      }
    }

    if (trans.plurals) {
      for (const [lang, pluralData] of Object.entries(trans.plurals)) {
        await upsertPluralForm({
          translationId: persistedTranslationId,
          lang,
          pluralData
        })
      }
    }
  }
}

export const newTranslationBatcher = new NewTranslationBatcher()
