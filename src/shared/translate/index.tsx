import { h } from 'preact'
import { useEffect, useState, useRef, useMemo, useCallback } from 'preact/hooks'

import type { TranslationData } from '@/models/translationService'
import { getPluralForm } from './pluralRules'
import isDev from '@/isDev'
import { SUPPORTED_LANGUAGES } from '@/config/languages'

function isTranslationDebugEnabled(): boolean {
	return typeof window !== 'undefined' && Boolean((window as any).__DEBUG_TRANSLATIONS__)
}

function debugTranslation(...args: any[]) {
	if (isTranslationDebugEnabled()) {
		console.debug('[translate]', ...args)
	}
}

const runtimeTranslationCache = new Map<string, string>()
const translationCacheDelayMs = import.meta.env.MODE === 'test' ? 0 : 500
const translationIdleTimeoutMs = import.meta.env.MODE === 'test' ? 0 : 1_000
const shouldWaitForPaint = import.meta.env.MODE !== 'test'
let userLanguagePromise: Promise<string> | null = null
let cachedUserLanguage: string | null = null

function getCacheKey(key: string, lang: string, ctx?: string, ns?: string): string {
	return `${lang}|${ns || ''}|${ctx || ''}|${key}`
}

function getUserLanguage(
	user: { lang?: string } | null,
	supportedLangs: readonly string[] = SUPPORTED_LANGUAGES
): string {
	if (user && user.lang) {
		const normalizedUserLang = user.lang.toLowerCase().substring(0, 2)
		if (supportedLangs.includes(normalizedUserLang)) {
			return normalizedUserLang
		}
	}

	if (typeof navigator !== 'undefined') {
		const browserLang = navigator.language.toLowerCase().substring(0, 2)
		if (supportedLangs.includes(browserLang)) {
			return browserLang
		}
	}

	return 'en'
}

function readUserLanguageOnce(): Promise<string> {
	if (cachedUserLanguage) {
		return Promise.resolve(cachedUserLanguage)
	}

	if (!userLanguagePromise) {
		userLanguagePromise = import('@/models/user')
			.then(({ getUser }) => getUser())
			.then((user) => {
				cachedUserLanguage = getUserLanguage(user, SUPPORTED_LANGUAGES)
				return cachedUserLanguage
			})
			.catch((error) => {
				userLanguagePromise = null
				throw error
			})
	}

	return userLanguagePromise
}

function scheduleAfterInitialRender(callback: () => void) {
	if (typeof window === 'undefined') {
		return () => {}
	}

	let cancelled = false
	let timeoutId: ReturnType<typeof setTimeout> | undefined
	let animationFrameId: number | undefined
	let idleId: number | undefined

	const runWhenIdle = () => {
		if (cancelled) return

		if ('requestIdleCallback' in window) {
			idleId = window.requestIdleCallback(() => {
				if (!cancelled) callback()
			}, { timeout: translationIdleTimeoutMs })
			return
		}

		timeoutId = globalThis.setTimeout(() => {
			if (!cancelled) callback()
		}, 0)
	}

	const runAfterDelay = () => {
		timeoutId = globalThis.setTimeout(runWhenIdle, translationCacheDelayMs)
	}

	const runAfterPaint = () => {
		if (shouldWaitForPaint && 'requestAnimationFrame' in window) {
			animationFrameId = window.requestAnimationFrame(() => {
				if (!cancelled) {
					animationFrameId = window.requestAnimationFrame(runAfterDelay)
				}
			})
			return
		}

		runAfterDelay()
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', runAfterPaint, { once: true })
	} else {
		runAfterPaint()
	}

	return () => {
		cancelled = true
		document.removeEventListener('DOMContentLoaded', runAfterPaint)
		if (timeoutId) globalThis.clearTimeout(timeoutId)
		if (animationFrameId && 'cancelAnimationFrame' in window) {
			window.cancelAnimationFrame(animationFrameId)
		}
		if (idleId && 'cancelIdleCallback' in window) {
			window.cancelIdleCallback(idleId)
		}
	}
}

function useStableUserLanguage() {
	const [lang, setLang] = useState(() => getUserLanguage(null, SUPPORTED_LANGUAGES))

	useEffect(() => {
		let cancelled = false

		const cleanup = scheduleAfterInitialRender(() => {
			void readUserLanguageOnce()
				.then((userLang) => {
					if (!cancelled) {
						setLang(userLang)
					}
				})
				.catch((error) => {
					if (!cancelled) {
						console.warn('[translate] Failed to read user language', error)
					}
				})
		})

		return () => {
			cancelled = true
			cleanup()
		}
	}, [])

	return lang
}

function TRemote({
	lang,
	children,
	ctx,
	ns,
	onFetched,
}: {
	lang: string
	children: string
	ctx?: string
	ns?: string
	onFetched?: () => void
}) {
	const [translation, setTranslation] = useState<TranslationData | null>(null)
	const [fetched, setFetched] = useState(false)

	useEffect(() => {
		if (fetched) return

		let cancelled = false

		const fetchTranslation = async () => {
			try {
				const { fetchRemoteTranslation } = await import('@/models/translationService')
				const trans = await fetchRemoteTranslation(children, lang, ctx, ns)
				if (!cancelled) {
					setTranslation(trans)
					setFetched(true)
					onFetched?.()
				}
			} catch (error) {
				if (!cancelled) {
					console.error(
						`[TRemote] Translation fetch error for "${children}":`,
						error
					)
					setFetched(true)
					onFetched?.()
				}
			}
		}

		fetchTranslation()

		return () => {
			cancelled = true
		}
	}, [children, ctx, ns, fetched, lang])

	if (!fetched || !translation) return <>{children}</>

	const value = translation.values?.[lang]
	return <>{value || children}</>
}

interface TProps {
	children: string
	ctx?: string
	ns?: string
}

export default function T({ children, ctx, ns }: TProps) {
	const lang = useStableUserLanguage()
	const cacheKey = getCacheKey(children, lang, ctx, ns)
	const [shouldShowRemote, setShouldShowRemote] = useState(false)
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [editValue, setEditValue] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const devMode = isDev()

	const [translationData, setTranslationData] = useState<{
		exists: boolean
		value: string | null
	} | null>(null)

	useEffect(() => {
		let cancelled = false

		setTranslationData(null)
		setShouldShowRemote(false)
		setHasAttemptedFetch(false)

		const cleanup = scheduleAfterInitialRender(() => {
			void import('@/models/translations')
				.then(async ({ getTranslation, getTranslationValue }) => {
					const trans = await getTranslation(children, ns, ctx)

					if (!trans) {
						return { exists: false, value: null }
					}

					const value = await getTranslationValue(trans.id, lang)
					return { exists: true, value }
				})
				.then((data) => {
					if (!cancelled) {
						setTranslationData(data)
					}
				})
				.catch((error) => {
					if (!cancelled) {
						console.warn('[translate] Failed to read cached translation', error)
						setTranslationData({ exists: false, value: null })
					}
				})
		})

		return () => {
			cancelled = true
			cleanup()
		}
	}, [children, lang, ns, ctx])

	const translation = translationData?.value || null
	const translationExists = translationData?.exists ?? false
	const cachedRuntimeValue = runtimeTranslationCache.get(cacheKey) || null

	if (translation) {
		runtimeTranslationCache.set(cacheKey, translation)
	}

	useEffect(() => {
		// Only fetch if translation record doesn't exist in IndexedDB at all
		if (!hasAttemptedFetch && translationData && !translationExists) {
			debugTranslation('rendering remote fallback', { key: children, context: ctx, namespace: ns, lang })
			setShouldShowRemote(true)
		}
	}, [
		translation,
		translationExists,
		translationData,
		hasAttemptedFetch,
		children,
	])

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus()
			inputRef.current.select()
		}
	}, [isEditing])

	const handleClick = (e: any) => {
		if (!devMode) return
		if (!e.ctrlKey && !e.metaKey) return
		e.preventDefault()
		e.stopPropagation()
		setEditValue(translation || children)
		setIsEditing(true)
	}

	const handleKeyDown = (e: any) => {
		e.stopPropagation()

		if (e.key === 'Enter') {
			e.preventDefault()
			handleSubmit()
		} else if (e.key === 'Escape') {
			e.preventDefault()
			setIsEditing(false)
		}
	}

	const handleSubmit = async () => {
		if (!editValue.trim() || isSaving) {
			setIsEditing(false)
			return
		}

		setIsSaving(true)

		try {
			const [{ apiClient }, { getTranslation, upsertTranslation, upsertTranslationValue }] = await Promise.all([
				import('@/api'),
				import('@/models/translations'),
			])
			const trans = await getTranslation(children, ns, ctx)

			await apiClient.mutation(`
				mutation updateTranslationValue($key: String!, $lang: String!, $value: String!, $namespace: String) {
					updateTranslationValue(key: $key, lang: $lang, value: $value, namespace: $namespace) {
						id
						key
						namespace
						values
					}
				}
			`, {
				key: children,
				lang: lang,
				value: editValue,
				namespace: ns || null,
			}).toPromise()

			const translationId = trans?.id ?? (await upsertTranslation({
				key: children,
				namespace: ns,
				context: ctx,
			}))

			await upsertTranslationValue({
				translationId,
				lang,
				value: editValue,
			})

			runtimeTranslationCache.set(cacheKey, editValue)
			setTranslationData({ exists: true, value: editValue })
			setShouldShowRemote(false)
			setHasAttemptedFetch(false)
			setIsEditing(false)
		} catch (error) {
			console.error('Failed to update translation:', error)
		} finally {
			setIsSaving(false)
		}
	}

	const handleBlur = () => {
		setIsEditing(false)
	}

	const wrapperStyle = useMemo(
		() =>
			devMode
				? {
						cursor: 'pointer',
						textDecoration: 'underline dotted',
						textDecorationColor: 'rgba(76, 175, 80, 0.3)',
				  }
				: {},
		[devMode]
	)

	const handleFetched = useCallback(() => {
		setShouldShowRemote(false)
		setHasAttemptedFetch(true)
	}, [])

	if (isEditing) {
		return (
			<span
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				onKeyUp={(e) => e.stopPropagation()}
				onKeyPress={(e) => e.stopPropagation()}
			>
				<input
					ref={inputRef}
					type="text"
					value={editValue}
					onInput={(e) => setEditValue((e.target as HTMLInputElement).value)}
					onKeyDown={handleKeyDown}
					onKeyPress={(e) => e.stopPropagation()}
					onKeyUp={(e) => e.stopPropagation()}
					onClick={(e) => e.stopPropagation()}
					onBlur={handleBlur}
					style={{
						font: 'inherit',
						border: '1px solid #4CAF50',
						padding: '2px 4px',
						borderRadius: '2px',
						outline: 'none',
						minWidth: '100px',
					}}
				/>
			</span>
		)
	}

	if (translation) {
		return (
			<span onClick={handleClick} style={wrapperStyle}>
				{translation}
			</span>
		)
	}

	if (cachedRuntimeValue && translationData === null) {
		return (
			<span onClick={handleClick} style={wrapperStyle}>
				{cachedRuntimeValue}
			</span>
		)
	}

	if (shouldShowRemote && !hasAttemptedFetch) {
		return (
			<TRemote lang={lang} ctx={ctx} ns={ns} onFetched={handleFetched}>
				{children}
			</TRemote>
		)
	}

	return (
		<span onClick={handleClick} style={wrapperStyle}>
			{children}
		</span>
	)
}

export function useTranslation(key: string, ctx?: string, ns?: string) {
	const [translatedText, setTranslatedText] = useState(key)
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
	const [cacheResolved, setCacheResolved] = useState(false)
	const lang = useStableUserLanguage()
	const cacheKey = getCacheKey(key, lang, ctx, ns)

	const [cachedTranslation, setCachedTranslation] = useState<{
		translationId: number
		value: string | null
	} | null>(null)

	useEffect(() => {
		let cancelled = false

		setCachedTranslation(null)
		setCacheResolved(false)

		const cleanup = scheduleAfterInitialRender(() => {
			void import('@/models/translations')
				.then(async ({ getTranslation, getTranslationValue }) => {
					const translation = await getTranslation(key, ns, ctx)
					if (!translation) return null

					const value = await getTranslationValue(translation.id, lang)
					return { translationId: translation.id, value }
				})
				.then((translation) => {
					if (!cancelled) {
						setCachedTranslation(translation)
						setCacheResolved(true)
					}
				})
				.catch((error) => {
					if (!cancelled) {
						console.warn('[translate] Failed to read cached translation', error)
						setCachedTranslation(null)
						setCacheResolved(true)
					}
				})
		})

		return () => {
			cancelled = true
			cleanup()
		}
	}, [key, lang, ns, ctx])

	useEffect(() => {
		const runtimeValue = runtimeTranslationCache.get(cacheKey)
		if (runtimeValue) {
			setTranslatedText(runtimeValue)
		}
		setHasAttemptedFetch(false)
	}, [key, lang, ns, ctx, cacheKey])

	useEffect(() => {
		if (cachedTranslation?.value) {
			runtimeTranslationCache.set(cacheKey, cachedTranslation.value)
			debugTranslation('cache hit', { key, context: ctx, namespace: ns, lang, value: cachedTranslation.value })
			setTranslatedText(cachedTranslation.value)
			return
		}

		if (
			cacheResolved &&
			(cachedTranslation === null || cachedTranslation?.value === null) &&
			!hasAttemptedFetch
		) {
			debugTranslation('cache miss, fetching remote', { key, context: ctx, namespace: ns, lang })
			setHasAttemptedFetch(true)

			let cancelled = false

			import('@/models/translationService')
				.then(({ fetchTranslationWithRemote }) =>
					fetchTranslationWithRemote(key, lang, ctx, ns)
				)
					.then((text) => {
						if (!cancelled) {
							runtimeTranslationCache.set(cacheKey, text)
							debugTranslation('remote resolved', { key, context: ctx, namespace: ns, lang, text })
							setTranslatedText(text)
						}
					})
				.catch((error) => {
					if (!cancelled) {
						console.error('Translation fetch error:', error)
					}
				})

			return () => {
				cancelled = true
			}
		}
	}, [cacheResolved, cachedTranslation, key, lang, ctx, ns, hasAttemptedFetch, cacheKey])

	return translatedText
}

export function usePlural(count: number, key: string, ns?: string) {
	const [translatedText, setTranslatedText] = useState(key)
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
	const [pluralCacheResolved, setPluralCacheResolved] = useState(false)
	const lang = useStableUserLanguage()
	const pluralForm = getPluralForm(count, lang)

	const [cachedPlural, setCachedPlural] = useState<{
		translationId: number
		pluralData: Record<string, string> | null
	} | null>(null)

	useEffect(() => {
		let cancelled = false

		setCachedPlural(null)
		setPluralCacheResolved(false)

		const cleanup = scheduleAfterInitialRender(() => {
			void import('@/models/translations')
				.then(async ({ getTranslation, getPluralForms }) => {
					const translation = await getTranslation(key, ns)
					if (!translation) return null

					const pluralData = await getPluralForms(translation.id, lang)
					return { translationId: translation.id, pluralData }
				})
				.then((plural) => {
					if (!cancelled) {
						setCachedPlural(plural)
						setPluralCacheResolved(true)
					}
				})
				.catch((error) => {
					if (!cancelled) {
						console.warn('[translate] Failed to read cached plural', error)
						setCachedPlural(null)
						setPluralCacheResolved(true)
					}
				})
		})

		return () => {
			cancelled = true
			cleanup()
		}
	}, [key, lang, ns])

	useEffect(() => {
		setHasAttemptedFetch(false)
	}, [key, lang, ns])

	useEffect(() => {
		if (cachedPlural?.pluralData?.[pluralForm]) {
			setTranslatedText(cachedPlural.pluralData[pluralForm])
			return
		}

		if (
			pluralCacheResolved &&
			(cachedPlural === null || cachedPlural?.pluralData === null) &&
			!hasAttemptedFetch
		) {
			setHasAttemptedFetch(true)

			let cancelled = false

			import('@/models/translationService')
				.then(({ fetchPluralWithRemote }) =>
					fetchPluralWithRemote(key, lang, pluralForm, ns)
				)
				.then((text) => {
					if (!cancelled) {
						setTranslatedText(text)
					}
				})
				.catch((error) => {
					if (!cancelled) {
						console.error('Plural fetch error:', error)
					}
				})

			return () => {
				cancelled = true
			}
		}
	}, [pluralCacheResolved, cachedPlural, key, lang, pluralForm, ns, hasAttemptedFetch])

	return translatedText
}
