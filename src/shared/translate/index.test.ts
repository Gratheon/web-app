import { h, render } from 'preact'
import { act } from 'preact/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	currentUser: null as { lang?: string } | null,
	cachedTranslations: new Map<string, { translationId: number; value: string | null } | null>(),
	useLiveQueryMock: vi.fn(),
	fetchTranslationWithRemoteMock: vi.fn(),
}))

vi.mock('dexie-react-hooks', () => ({
	useLiveQuery: (...args: unknown[]) => mocks.useLiveQueryMock(...args),
}))

vi.mock('@/models/user', () => ({
	getUser: vi.fn(),
}))

vi.mock('@/models/translations', () => ({
	getTranslation: vi.fn(),
	getTranslationValue: vi.fn(),
	getPluralForms: vi.fn(),
	upsertTranslationValue: vi.fn(),
}))

vi.mock('@/models/translationService', () => ({
	fetchTranslationWithRemote: mocks.fetchTranslationWithRemoteMock,
	fetchPluralWithRemote: vi.fn(),
	fetchRemoteTranslation: vi.fn(),
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
	default: () => false,
}))

vi.mock('@/api', () => ({
	useMutation: () => [vi.fn()],
}))

vi.mock('@/config/languages', () => ({
	SUPPORTED_LANGUAGES: ['en', 'ru'],
}))

import { useTranslation } from './index'

function TranslationProbe({ tick }: { tick: number }) {
	const value = useTranslation('Delete')
	return h('div', { 'data-tick': tick }, value)
}

describe('useTranslation', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)

		mocks.currentUser = null
		mocks.cachedTranslations.clear()
		mocks.cachedTranslations.set('en', { translationId: 1, value: 'Delete' })
		mocks.cachedTranslations.set('ru', { translationId: 1, value: 'Удалить' })
		mocks.fetchTranslationWithRemoteMock.mockReset()
		mocks.useLiveQueryMock.mockReset()

		mocks.useLiveQueryMock.mockImplementation(
			(query: unknown, deps: unknown[] | undefined, initialValue: unknown) => {
				if (Array.isArray(deps) && deps.length === 0) {
					return mocks.currentUser
				}

				const lang = Array.isArray(deps) ? String(deps[1] ?? '') : ''
				return mocks.cachedTranslations.get(lang) ?? initialValue
			}
		)
	})

	afterEach(() => {
		render(null, container)
		container.remove()
	})

	it('keeps resolved user language when user query temporarily returns null', async () => {
		await act(async () => {
			render(h(TranslationProbe, { tick: 0 }), container)
		})
		expect(container.textContent).toBe('Delete')

		mocks.currentUser = { lang: 'ru' }
		await act(async () => {
			render(h(TranslationProbe, { tick: 1 }), container)
		})
		expect(container.textContent).toBe('Удалить')

		mocks.currentUser = null
		await act(async () => {
			render(h(TranslationProbe, { tick: 2 }), container)
		})
		expect(container.textContent).toBe('Удалить')

		expect(mocks.fetchTranslationWithRemoteMock).not.toHaveBeenCalled()
	})
})
