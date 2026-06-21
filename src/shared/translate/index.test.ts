import { h, render } from 'preact'
import { act } from 'preact/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	currentUser: null as { lang?: string } | null,
	cachedTranslations: new Map<string, { translationId: number; value: string | null } | null>(),
	fetchTranslationWithRemoteMock: vi.fn(),
	fetchRemoteTranslationMock: vi.fn(),
	isDev: false,
	apiClientMutationMock: vi.fn(),
	mutationToPromiseMock: vi.fn(),
}))

vi.mock('@/models/user', () => ({
	getUser: vi.fn(),
}))

vi.mock('@/models/translations', () => ({
	getTranslation: vi.fn(),
	getTranslationValue: vi.fn(),
	getPluralForms: vi.fn(),
	upsertTranslation: vi.fn(),
	upsertTranslationValue: vi.fn(),
}))

vi.mock('@/models/translationService', () => ({
	fetchTranslationWithRemote: mocks.fetchTranslationWithRemoteMock,
	fetchPluralWithRemote: vi.fn(),
	fetchRemoteTranslation: mocks.fetchRemoteTranslationMock,
	getUserLanguage: (user: { lang?: string } | null, supportedLangs: readonly string[]) => {
		if (user?.lang) {
			const normalizedLang = user.lang.toLowerCase().substring(0, 2)
			if (supportedLangs.includes(normalizedLang)) {
				return normalizedLang
			}
		}
		return 'en'
	},
}))

vi.mock('@/isDev', () => ({
	default: () => mocks.isDev,
}))

vi.mock('@/api', () => ({
	apiClient: {
		mutation: (...args: unknown[]) => mocks.apiClientMutationMock(...args),
	},
}))

vi.mock('@/config/languages', () => ({
	SUPPORTED_LANGUAGES: ['en', 'ru', 'et'],
	normalizeSupportedLanguage: (lang?: string | null, supportedLangs: readonly string[] = ['en', 'ru', 'et']) => {
		if (!lang) return null
		const normalizedLang = lang.trim().toLowerCase().substring(0, 2)
		return supportedLangs.includes(normalizedLang) ? normalizedLang : null
	},
	getQueryParamLanguage: (supportedLangs: readonly string[] = ['en', 'ru', 'et'], search?: string) => {
		const rawSearch = search ?? window.location.search
		const lang = new URLSearchParams(rawSearch).get('lang')
		if (!lang) return null
		const normalizedLang = lang.trim().toLowerCase().substring(0, 2)
		return supportedLangs.includes(normalizedLang) ? normalizedLang : null
	},
	getPreferredLanguage: (supportedLangs: readonly string[] = ['en', 'ru', 'et'], search?: string) => {
		const rawSearch = search ?? window.location.search
		const lang = new URLSearchParams(rawSearch).get('lang')
		if (!lang) return 'en'
		const normalizedLang = lang.trim().toLowerCase().substring(0, 2)
		return supportedLangs.includes(normalizedLang) ? normalizedLang : 'en'
	},
}))

import T, { useTranslation } from './index'
import { getUser } from '@/models/user'
import {
	getTranslation,
	getTranslationValue,
	getPluralForms,
	upsertTranslation,
	upsertTranslationValue,
} from '@/models/translations'

function TranslationProbe({ tick }: { tick: number }) {
	const value = useTranslation('Delete')
	return h('div', { 'data-tick': tick }, value)
}

describe('useTranslation', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		vi.useFakeTimers()
		container = document.createElement('div')
		document.body.appendChild(container)

		mocks.currentUser = null
		mocks.isDev = false
		mocks.cachedTranslations.clear()
		mocks.cachedTranslations.set('en', { translationId: 1, value: 'Delete' })
		mocks.cachedTranslations.set('ru', { translationId: 1, value: 'Удалить' })
		window.history.replaceState({}, '', '/')
		window.localStorage.clear()
		mocks.fetchTranslationWithRemoteMock.mockReset()
		mocks.fetchRemoteTranslationMock.mockReset()
		mocks.apiClientMutationMock.mockReset()
		mocks.mutationToPromiseMock.mockReset()
		mocks.apiClientMutationMock.mockReturnValue({
			toPromise: mocks.mutationToPromiseMock,
		})
		mocks.mutationToPromiseMock.mockResolvedValue({
			data: {
				updateTranslationValue: {
					id: 1,
					key: 'Delete',
					namespace: null,
					values: { ru: 'Убрать' },
				},
			},
		})

		vi.mocked(getUser).mockImplementation(async () => mocks.currentUser)
		vi.mocked(getTranslation).mockResolvedValue({ id: 1, key: 'Delete' })
		vi.mocked(getTranslationValue).mockImplementation(async (_translationId, lang) => (
			mocks.cachedTranslations.get(String(lang))?.value || null
		))
		vi.mocked(getPluralForms).mockResolvedValue(null)
		vi.mocked(upsertTranslation).mockResolvedValue(1)
		vi.mocked(upsertTranslationValue).mockResolvedValue(undefined)
	})

	afterEach(() => {
		vi.useRealTimers()
		render(null, container)
		container.remove()
	})

	async function flushPostLoadQueries() {
		for (let i = 0; i < 4; i += 1) {
			await act(async () => {
				window.dispatchEvent(new Event('load'))
				await vi.runOnlyPendingTimersAsync()
				await Promise.resolve()
			})
		}
	}

	it('renders source text first, then resolves cached translation after post-load IndexedDB read', async () => {
		mocks.currentUser = { lang: 'ru' }

		await act(async () => {
			render(h(TranslationProbe, { tick: 0 }), container)
		})
		expect(container.textContent).toBe('Delete')

		await flushPostLoadQueries()
		expect(container.textContent).toBe('Удалить')

		mocks.currentUser = null
		await act(async () => {
			render(h(TranslationProbe, { tick: 2 }), container)
		})
		expect(container.textContent).toBe('Удалить')

		expect(mocks.fetchTranslationWithRemoteMock).not.toHaveBeenCalled()
	})

	it('uses query string language and fetches uncached public-page translations without auth delay', async () => {
		window.history.replaceState({}, '', '/account/authenticate/?lang=et')
		vi.mocked(getTranslation).mockResolvedValue(null)
		mocks.fetchRemoteTranslationMock.mockResolvedValue({
			id: 7,
			key: 'Log In',
			values: { et: 'Logi sisse' },
		})

		await act(async () => {
			render(h(T, null, 'Log In'), container)
		})
		expect(container.textContent).toBe('Log In')

		await flushPostLoadQueries()
		expect(mocks.fetchRemoteTranslationMock).toHaveBeenCalledWith('Log In', 'et', undefined, undefined)
		expect(container.textContent).toBe('Logi sisse')
	})

	it('keeps dev translation editing lazy and updates local text after save', async () => {
		mocks.isDev = true
		mocks.currentUser = { lang: 'ru' }

		await act(async () => {
			render(h(T, null, 'Delete'), container)
		})
		await flushPostLoadQueries()
		expect(container.textContent).toBe('Удалить')

		const translationSpan = container.querySelector('span')
		expect(translationSpan).not.toBeNull()

		await act(async () => {
			translationSpan?.dispatchEvent(new MouseEvent('click', {
				bubbles: true,
				ctrlKey: true,
			}))
		})

		const input = container.querySelector('input') as HTMLInputElement | null
		expect(input).not.toBeNull()

		await act(async () => {
			input!.value = 'Убрать'
			input!.dispatchEvent(new InputEvent('input', { bubbles: true }))
		})

		await act(async () => {
			input!.dispatchEvent(new KeyboardEvent('keydown', {
				bubbles: true,
				key: 'Enter',
			}))

			await vi.dynamicImportSettled()
			for (let i = 0; i < 4; i += 1) {
				await Promise.resolve()
			}
		})

		expect(mocks.apiClientMutationMock).toHaveBeenCalledWith(
			expect.stringContaining('updateTranslationValue'),
			{
				key: 'Delete',
				lang: 'ru',
				value: 'Убрать',
				namespace: null,
			}
		)
		expect(upsertTranslationValue).toHaveBeenCalledWith({
			translationId: 1,
			lang: 'ru',
			value: 'Убрать',
		})
		expect(container.textContent).toBe('Убрать')
	})
})
