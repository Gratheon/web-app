import {apiClient, gql} from '@/api'
import {upsertPluralForm, upsertTranslation, upsertTranslationValue} from '@/models/translations'

const getTranslationsQuery = gql`query getTranslations($inputs: [TranslationInput!]!, $langs: [String!]){
    getTranslations(inputs: $inputs, langs: $langs){
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

const legacyTranslateQuery = gql`query translate($en: String!, $tc: String){
    translate(en: $en, tc: $tc){
        __typename
        id
        en
        ru
        et
        tr
        pl
        de
        fr
        lv
        lt
        hu
        uk
        it
        ro
        key
    }
}`

const legacyLocaleLangs = ['en', 'ru', 'et', 'tr', 'pl', 'de', 'fr', 'lv', 'lt', 'hu', 'uk', 'it', 'ro'] as const

interface TranslationRequest {
  key: string
  context?: string
  namespace?: string
  isPlural?: boolean
  lang?: string
  resolve: (value: any) => void
  reject: (error: any) => void
}

class NewTranslationBatcher {
  private queue: TranslationRequest[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private batchDelay: number = 150
  private shouldUseLegacyTranslate = false

  private isDebugEnabled(): boolean {
    return typeof window !== 'undefined' && Boolean((window as any).__DEBUG_TRANSLATIONS__)
  }

  private debugLog(...args: any[]) {
    if (this.isDebugEnabled()) {
      console.debug('[newTranslationBatcher]', ...args)
    }
  }

  async request(
    key: string,
    isPlural: boolean = false,
    context?: string,
    namespace?: string,
    lang?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({key, context, namespace, isPlural, lang, resolve, reject})

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
      const translations = this.shouldUseLegacyTranslate
        ? await this.fetchLegacyTranslations(uniqueRequests)
        : await this.fetchTranslations(uniqueRequests)

      await this.resolveBatch(batch, translations)
    } catch (error) {
      batch.forEach(req => req.reject(error))
    }
  }

  private async fetchTranslations(uniqueRequests: TranslationRequest[]): Promise<any[]> {
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

    const requestedLangs = Array.from(
      new Set(
        uniqueRequests
          .map((req) => req.lang?.trim().toLowerCase())
          .filter((lang): lang is string => Boolean(lang))
      )
    )

    const variables: any = { inputs }
    if (requestedLangs.length > 0) {
      variables.langs = requestedLangs
    }

    const result = await apiClient.query(getTranslationsQuery, variables).toPromise()

    if (result.data?.getTranslations) {
      return result.data.getTranslations
    }

    this.shouldUseLegacyTranslate = true
    this.debugLog('getTranslations unavailable, falling back to legacy translate query', {
      error: result.error,
      variables,
    })

    return await this.fetchLegacyTranslations(uniqueRequests)
  }

  private async fetchLegacyTranslations(uniqueRequests: TranslationRequest[]): Promise<any[]> {
    const translations: any[] = []

    for (const req of uniqueRequests) {
      const result = await apiClient.query(legacyTranslateQuery, {
        en: req.key,
        tc: req.context || '',
      }).toPromise()

      if (result.data?.translate) {
        translations.push(this.mapLegacyLocaleToTranslation(req, result.data.translate))
      } else {
        this.debugLog('legacy translate returned no data', {
          key: req.key,
          context: req.context,
          namespace: req.namespace,
          error: result.error,
        })
      }
    }

    return translations
  }

  private mapLegacyLocaleToTranslation(req: TranslationRequest, locale: any): any {
    const values: Record<string, string> = {}

    for (const lang of legacyLocaleLangs) {
      if (typeof locale?.[lang] === 'string' && locale[lang]) {
        values[lang] = locale[lang]
      }
    }

    return {
      __typename: 'Translation',
      id: locale.id,
      key: req.key,
      namespace: req.namespace ?? null,
      context: req.context ?? null,
      values,
      plurals: null,
      isPlural: false,
    }
  }

  private async resolveBatch(batch: TranslationRequest[], translations: any[]) {
    if (translations.length === 0) {
      batch.forEach(req => req.reject(new Error('No translation data')))
      return
    }

    const persistedRecords = new Set<string>()

    for (const req of batch) {
      const translation = translations.find((trans: any) =>
        this.isTranslationMatch(req, trans)
      )

      if (!translation) {
        req.reject(new Error('Translation not found'))
        continue
      }

      await this.persistTranslationForRequest(req, translation, persistedRecords)
      req.resolve(translation)
    }
  }

  private deduplicateRequests(requests: TranslationRequest[]): TranslationRequest[] {
    const seen = new Map<string, TranslationRequest>()

    for (const req of requests) {
      const key = `${req.key}|${req.context || ''}|${req.namespace || ''}|${req.isPlural}|${req.lang || ''}`
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
        if (req.lang && lang !== req.lang) {
          continue
        }
        await upsertTranslationValue({
          translationId: persistedTranslationId,
          lang,
          value: value as string
        })
      }
    } else if (trans.plurals && !trans.values) {
      for (const [lang, pluralData] of Object.entries(trans.plurals)) {
        if (req.lang && lang !== req.lang) {
          continue
        }
        const pd = pluralData as any
        const rawValue = pd?.other || pd?.few || pd?.many || pd?.one || pd?.zero || pd?.two || req.key
        const capitalizedValue = rawValue.charAt(0) + rawValue.slice(1)

        await upsertTranslationValue({
          translationId: persistedTranslationId,
          lang,
          value: capitalizedValue as string
        })
      }
    }

    if (trans.plurals) {
      for (const [lang, pluralData] of Object.entries(trans.plurals)) {
        if (req.lang && lang !== req.lang) {
          continue
        }
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
