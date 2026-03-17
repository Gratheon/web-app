import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	queryMock: vi.fn(),
	toPromiseMock: vi.fn(),
	upsertTranslationMock: vi.fn(),
	upsertTranslationValueMock: vi.fn(),
	upsertPluralFormMock: vi.fn(),
}))

vi.mock('@/api', () => ({
	apiClient: {
		query: mocks.queryMock,
	},
	gql: (strings: TemplateStringsArray) => strings.join(''),
}))

vi.mock('@/models/translations', () => ({
	upsertTranslation: mocks.upsertTranslationMock,
	upsertTranslationValue: mocks.upsertTranslationValueMock,
	upsertPluralForm: mocks.upsertPluralFormMock,
}))

import { newTranslationBatcher } from './newBatch'

describe('newTranslationBatcher', () => {
	beforeEach(() => {
		mocks.queryMock.mockReset()
		mocks.toPromiseMock.mockReset()
		mocks.upsertTranslationMock.mockReset()
		mocks.upsertTranslationValueMock.mockReset()
		mocks.upsertPluralFormMock.mockReset()

		mocks.queryMock.mockReturnValue({
			toPromise: mocks.toPromiseMock,
		})

		mocks.upsertTranslationMock.mockResolvedValue(1)
		mocks.upsertTranslationValueMock.mockResolvedValue(1)
		mocks.upsertPluralFormMock.mockResolvedValue(1)
	})

	it('persists and resolves both key casings independently when requests differ only by case', async () => {
		mocks.toPromiseMock.mockResolvedValue({
			data: {
				getTranslations: [
					{
						id: '42',
						key: 'worker bees',
						context: null,
						namespace: null,
						values: { ru: 'Рабочие пчелы' },
					},
				],
			},
		})

		const p1 = newTranslationBatcher.request('Worker Bees')
		const p2 = newTranslationBatcher.request('Worker bees')

		const [r1, r2] = await Promise.all([p1, p2])

		expect(r1.values.ru).toBe('Рабочие пчелы')
		expect(r2.values.ru).toBe('Рабочие пчелы')

		expect(mocks.upsertTranslationMock).toHaveBeenCalledWith(
			expect.objectContaining({ key: 'Worker Bees' })
		)
		expect(mocks.upsertTranslationMock).toHaveBeenCalledWith(
			expect.objectContaining({ key: 'Worker bees' })
		)
	})

	it('does not deduplicate requests that differ by context', async () => {
		mocks.toPromiseMock.mockResolvedValue({
			data: {
				getTranslations: [
					{
						id: '11',
						key: 'Varroa mites',
						context: 'toggle varroa mites visibility',
						namespace: null,
						values: { ru: 'Клещи варроа' },
					},
					{
						id: '12',
						key: 'Varroa mites',
						context: 'hive stats label',
						namespace: null,
						values: { ru: 'Варроатозные клещи' },
					},
				],
			},
		})

		const p1 = newTranslationBatcher.request('Varroa mites', false, 'toggle varroa mites visibility')
		const p2 = newTranslationBatcher.request('Varroa mites', false, 'hive stats label')

		const [r1, r2] = await Promise.all([p1, p2])

		expect(r1.id).toBe('11')
		expect(r2.id).toBe('12')

		expect(mocks.queryMock).toHaveBeenCalledTimes(1)
		const inputs = mocks.queryMock.mock.calls[0][1].inputs
		expect(inputs).toHaveLength(2)
		expect(inputs[0]).toEqual({ key: 'Varroa mites', context: 'toggle varroa mites visibility' })
		expect(inputs[1]).toEqual({ key: 'Varroa mites', context: 'hive stats label' })
	})
})
