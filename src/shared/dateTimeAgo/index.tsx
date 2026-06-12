import React from 'react'
import { useEffect, useMemo, useState } from 'preact/hooks'

import formatDistance from 'date-fns/formatDistance'
import type { Locale } from 'date-fns'

const dateLocaleLoaders = {
	ar: () => import('date-fns/esm/locale/ar/index.js'),
	bn: () => import('date-fns/esm/locale/bn/index.js'),
	de: () => import('date-fns/esm/locale/de/index.js'),
	es: () => import('date-fns/esm/locale/es/index.js'),
	et: () => import('date-fns/esm/locale/et/index.js'),
	fr: () => import('date-fns/esm/locale/fr/index.js'),
	hi: () => import('date-fns/esm/locale/hi/index.js'),
	ja: () => import('date-fns/esm/locale/ja/index.js'),
	pl: () => import('date-fns/esm/locale/pl/index.js'),
	pt: () => import('date-fns/esm/locale/pt/index.js'),
	ru: () => import('date-fns/esm/locale/ru/index.js'),
	tr: () => import('date-fns/esm/locale/tr/index.js'),
	zh: () => import('date-fns/esm/locale/zh-CN/index.js'),
}

const dateLocaleCache = new Map<string, Locale | undefined>()
const dateLocalePromises = new Map<string, Promise<Locale | undefined>>()

function normalizeDateLocale(lang?: string | null): string {
	const normalized = lang?.toLowerCase().split('-')[0] || 'en'
	return normalized in dateLocaleLoaders ? normalized : 'en'
}

function getCachedDateLocale(lang: string): Locale | undefined {
	return dateLocaleCache.get(lang)
}

function loadDateLocale(lang: string): Promise<Locale | undefined> {
	if (lang === 'en') {
		return Promise.resolve(undefined)
	}

	if (dateLocaleCache.has(lang)) {
		return Promise.resolve(dateLocaleCache.get(lang))
	}

	const existingPromise = dateLocalePromises.get(lang)
	if (existingPromise) {
		return existingPromise
	}

	const loader = dateLocaleLoaders[lang as keyof typeof dateLocaleLoaders]
	if (!loader) {
		return Promise.resolve(undefined)
	}

	const promise = loader()
		.then((module) => {
			dateLocaleCache.set(lang, module.default)
			return module.default
		})
		.catch((error) => {
			console.warn(`[DateTimeAgo] Failed to load date-fns locale "${lang}"`, error)
			dateLocaleCache.set(lang, undefined)
			return undefined
		})

	dateLocalePromises.set(lang, promise)
	return promise
}

export default function DateTimeAgo({ dateString, lang = 'en' }) {
	const normalizedLang = useMemo(() => normalizeDateLocale(lang), [lang])
	const [dateLocale, setDateLocale] = useState(() => getCachedDateLocale(normalizedLang))

	useEffect(() => {
		let cancelled = false
		setDateLocale(getCachedDateLocale(normalizedLang))

		void loadDateLocale(normalizedLang).then((locale) => {
			if (!cancelled) {
				setDateLocale(locale)
			}
		})

		return () => {
			cancelled = true
		}
	}, [normalizedLang])

	const dateLangOptions = dateLocale ? { locale: dateLocale } : undefined

	if(!dateString) return null

	return <>{formatDistance(new Date(dateString), new Date(), dateLangOptions)}</>
}
