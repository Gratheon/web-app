import { h } from 'preact'
import { useEffect, useState, useRef, useMemo, useCallback } from 'preact/hooks'
import { useLiveQuery } from 'dexie-react-hooks'

import { getUser } from '@/models/user'
import {
	getTranslation,
	getTranslationValue,
	getPluralForms,
	upsertTranslationValue,
} from '@/models/translations'
import {
	fetchTranslationWithRemote,
	fetchPluralWithRemote,
	getUserLanguage,
	fetchRemoteTranslation,
	type TranslationData,
} from '@/models/translationService'
import { getPluralForm } from './pluralRules'
import isDev from '@/isDev'
import { useMutation } from '@/api'
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

function getCacheKey(key: string, lang: string, ctx?: string, ns?: string): string {
	return `${lang}|${ns || ''}|${ctx || ''}|${key}`
}

function useStableUserLanguage() {
	const user = useLiveQuery(() => getUser(), [], null)
	const [lang, setLang] = useState(() => getUserLanguage(user, SUPPORTED_LANGUAGES))

	useEffect(() => {
		if (user?.lang) {
			setLang(getUserLanguage(user, SUPPORTED_LANGUAGES))
		}
	}, [user?.lang])

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

	const [updateTranslationMutation] = useMutation(`
		mutation updateTranslationValue($key: String!, $lang: String!, $value: String!, $namespace: String) {
			updateTranslationValue(key: $key, lang: $lang, value: $value, namespace: $namespace) {
				id
				key
				namespace
				values
			}
		}
	`)

	let translationData = useLiveQuery(
		async () => {
			const trans = await getTranslation(children, ns, ctx)

			if (!trans) {
				return { exists: false, value: null }
			}

			const value = await getTranslationValue(trans.id, lang)
			return { exists: true, value }
		},
		[children, lang, ns, ctx],
		null
	)

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
			const trans = await getTranslation(children, ns, ctx)
			const translationId = trans?.id

			await updateTranslationMutation({
				key: children,
				lang: lang,
				value: editValue,
				namespace: ns || null,
			})

			if (translationId) {
				await upsertTranslationValue({
					translationId,
					lang,
					value: editValue,
				})
			}

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
	const lang = useStableUserLanguage()
	const cacheKey = getCacheKey(key, lang, ctx, ns)

	let cachedTranslation = useLiveQuery(
		async () => {
			const translation = await getTranslation(key, ns, ctx)
			if (!translation) return null

			const value = await getTranslationValue(translation.id, lang)
			return { translationId: translation.id, value }
		},
		[key, lang, ns, ctx],
		null
	)

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
			(cachedTranslation === null || cachedTranslation?.value === null) &&
			!hasAttemptedFetch
		) {
			debugTranslation('cache miss, fetching remote', { key, context: ctx, namespace: ns, lang })
			setHasAttemptedFetch(true)

			let cancelled = false

				fetchTranslationWithRemote(key, lang, ctx, ns)
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
	}, [cachedTranslation, key, lang, ctx, ns, hasAttemptedFetch, cacheKey])

	return translatedText
}

export function usePlural(count: number, key: string, ns?: string) {
	const [translatedText, setTranslatedText] = useState(key)
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
	const lang = useStableUserLanguage()
	const pluralForm = getPluralForm(count, lang)

	let cachedPlural = useLiveQuery(
		async () => {
			const translation = await getTranslation(key, ns)
			if (!translation) return null

			const pluralData = await getPluralForms(translation.id, lang)
			return { translationId: translation.id, pluralData }
		},
		[key, lang, ns],
		null
	)

	useEffect(() => {
		setHasAttemptedFetch(false)
	}, [key, lang, ns])

	useEffect(() => {
		if (cachedPlural?.pluralData?.[pluralForm]) {
			setTranslatedText(cachedPlural.pluralData[pluralForm])
			return
		}

		if (
			(cachedPlural === null || cachedPlural?.pluralData === null) &&
			!hasAttemptedFetch
		) {
			setHasAttemptedFetch(true)

			let cancelled = false

			fetchPluralWithRemote(key, lang, pluralForm, ns)
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
	}, [cachedPlural, key, lang, pluralForm, ns, hasAttemptedFetch])

	return translatedText
}
