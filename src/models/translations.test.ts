import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import {
	getTranslation,
	getTranslationValue,
	getPluralForms,
	upsertTranslation,
	upsertTranslationValue,
	upsertPluralForm,
	Translation,
	TranslationValue,
	PluralForm
} from './translations';
import { db } from './db';

vi.mock('./db', () => {
	const createMockTable = () => {
		const mockPut = vi.fn();
		const mockWhere = vi.fn();
		const mockEquals = vi.fn();
		const mockFirst = vi.fn();

		const mockCollection = { first: mockFirst };
		mockEquals.mockReturnValue(mockCollection);
		mockWhere.mockReturnValue({ equals: mockEquals });

		return {
			put: mockPut,
			where: mockWhere,
			__mocks: { mockPut, mockWhere, mockEquals, mockFirst }
		};
	};

	const translationTable = createMockTable();
	const valueTable = createMockTable();
	const pluralTable = createMockTable();

	return {
		db: {
			translation: translationTable,
			translationvalue: valueTable,
			pluralform: pluralTable,
			__mocks: {
				translation: translationTable.__mocks,
				translationvalue: valueTable.__mocks,
				pluralform: pluralTable.__mocks
			}
		}
	};
});

const dbMocks = (db as any).__mocks;

describe('Translations Integration Tests', () => {
	beforeEach(() => {
		Object.values(dbMocks).forEach((tableMocks: any) => {
			tableMocks.mockPut.mockReset();
			tableMocks.mockWhere.mockReset();
			tableMocks.mockEquals.mockReset();
			tableMocks.mockFirst.mockReset();

			const mockCollection = { first: tableMocks.mockFirst };
			tableMocks.mockEquals.mockReturnValue(mockCollection);
			tableMocks.mockWhere.mockReturnValue({ equals: tableMocks.mockEquals });
			tableMocks.mockFirst.mockResolvedValue(undefined);
		});
	});

	describe('getTranslation', () => {
		it('should return translation when key exists', async () => {
			const translation: Translation = { id: 1, key: 'greeting', context: 'home' };
			dbMocks.translation.mockFirst.mockResolvedValue(translation);

			const result = await getTranslation('greeting');

			expect(result).toEqual(translation);
			expect(dbMocks.translation.mockWhere).toHaveBeenCalledWith('key');
			expect(dbMocks.translation.mockEquals).toHaveBeenCalledWith('greeting');
			expect(dbMocks.translation.mockFirst).toHaveBeenCalled();
		});

		it('should return null when key does not exist', async () => {
			dbMocks.translation.mockFirst.mockResolvedValue(undefined);

			const result = await getTranslation('nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('getTranslationValue', () => {
		it('should return translation value when translationId and lang match', async () => {
			const value = { id: 1, translationId: 1, lang: 'en', value: 'Hello' };
			dbMocks.translationvalue.mockFirst.mockResolvedValue(value);

			const result = await getTranslationValue(1, 'en');

			expect(result).toBe('Hello');
			expect(dbMocks.translationvalue.mockWhere).toHaveBeenCalledWith('[translationId+lang]');
			expect(dbMocks.translationvalue.mockEquals).toHaveBeenCalledWith([1, 'en']);
		});

		it('should return null when no matching record exists', async () => {
			dbMocks.translationvalue.mockFirst.mockResolvedValue(undefined);

			const result = await getTranslationValue(999, 'fr');

			expect(result).toBeNull();
		});
	});

	describe('getPluralForms', () => {
		it('should return plural data when translationId and lang match', async () => {
			const pluralData = { one: 'item', many: 'items' };
			const pluralForm = { id: 1, translationId: 1, lang: 'en', pluralData };
			dbMocks.pluralform.mockFirst.mockResolvedValue(pluralForm);

			const result = await getPluralForms(1, 'en');

			expect(result).toEqual(pluralData);
		});

		it('should return null when no matching record exists', async () => {
			dbMocks.pluralform.mockFirst.mockResolvedValue(undefined);

			const result = await getPluralForms(999, 'en');

			expect(result).toBeNull();
		});
	});

	describe('upsertTranslation', () => {
		it('should insert new translation when key does not exist', async () => {
			dbMocks.translation.mockFirst.mockResolvedValue(undefined);
			dbMocks.translation.mockPut.mockResolvedValue(1);

			const result = await upsertTranslation({ key: 'welcome', context: 'login' });

			expect(result).toBe(1);
			expect(dbMocks.translation.mockPut).toHaveBeenCalledWith({
				key: 'welcome',
				context: 'login'
			});
		});

		it('should update existing translation when key exists', async () => {
			const existing = { id: 1, key: 'welcome', context: 'old' };
			dbMocks.translation.mockFirst.mockResolvedValue(existing);
			dbMocks.translation.mockPut.mockResolvedValue(1);

			const result = await upsertTranslation({ key: 'welcome', context: 'new' });

			expect(result).toBe(1);
			expect(dbMocks.translation.mockPut).toHaveBeenCalledWith({
				id: 1,
				key: 'welcome',
				context: 'new'
			});
		});

		it('should handle translation with null context', async () => {
			dbMocks.translation.mockFirst.mockResolvedValue(undefined);
			dbMocks.translation.mockPut.mockResolvedValue(1);

			await upsertTranslation({ key: 'simple' });

			expect(dbMocks.translation.mockPut).toHaveBeenCalledWith({
				key: 'simple',
				context: null
			});
		});

		it('should throw error when table does not exist', async () => {
			const originalTable = (db as any).translation;
			delete (db as any).translation;

			await expect(upsertTranslation({ key: 'fail' })).rejects.toThrow(
				'Table "translation" does not exist in IndexedDB'
			);

			(db as any).translation = originalTable;
		});
	});

	describe('upsertTranslationValue', () => {
		it('should insert new translation value when combination does not exist', async () => {
			dbMocks.translationvalue.mockFirst.mockResolvedValue(undefined);
			dbMocks.translationvalue.mockPut.mockResolvedValue(1);

			const result = await upsertTranslationValue({
				translationId: 1,
				lang: 'en',
				value: 'Hello'
			});

			expect(result).toBe(1);
			expect(dbMocks.translationvalue.mockPut).toHaveBeenCalledWith({
				translationId: 1,
				lang: 'en',
				value: 'Hello'
			});
		});

		it('should update existing translation value when combination exists', async () => {
			const existing = { id: 1, translationId: 1, lang: 'en', value: 'Hi' };
			dbMocks.translationvalue.mockFirst.mockResolvedValue(existing);
			dbMocks.translationvalue.mockPut.mockResolvedValue(1);

			const result = await upsertTranslationValue({
				translationId: 1,
				lang: 'en',
				value: 'Hello'
			});

			expect(result).toBe(1);
			expect(dbMocks.translationvalue.mockPut).toHaveBeenCalledWith({
				id: 1,
				translationId: 1,
				lang: 'en',
				value: 'Hello'
			});
		});

		it('should handle string translationId by converting to number', async () => {
			dbMocks.translationvalue.mockFirst.mockResolvedValue(undefined);
			dbMocks.translationvalue.mockPut.mockResolvedValue(1);

			const result = await upsertTranslationValue({
				translationId: '5' as any,
				lang: 'en',
				value: 'Hello'
			});

			expect(result).toBe(1);
			expect(dbMocks.translationvalue.mockPut).toHaveBeenCalledWith({
				translationId: 5,
				lang: 'en',
				value: 'Hello'
			});
		});

		it('should throw error for invalid translationId', async () => {
			await expect(upsertTranslationValue({
				translationId: NaN,
				lang: 'en',
				value: 'Hello'
			})).rejects.toThrow('Invalid translationId: NaN');
		});

		it('should throw error for zero translationId', async () => {
			await expect(upsertTranslationValue({
				translationId: 0,
				lang: 'en',
				value: 'Hello'
			})).rejects.toThrow('Invalid translationId: 0');
		});

		it('should throw error when table does not exist', async () => {
			const originalTable = (db as any).translationvalue;
			delete (db as any).translationvalue;

			await expect(upsertTranslationValue({
				translationId: 1,
				lang: 'en',
				value: 'test'
			})).rejects.toThrow('Table "translationvalue" does not exist in IndexedDB');

			(db as any).translationvalue = originalTable;
		});
	});

	describe('upsertPluralForm', () => {
		it('should insert new plural form when combination does not exist', async () => {
			const pluralData = { one: 'item', many: 'items' };
			dbMocks.pluralform.mockFirst.mockResolvedValue(undefined);
			dbMocks.pluralform.mockPut.mockResolvedValue(1);

			const result = await upsertPluralForm({
				translationId: 1,
				lang: 'en',
				pluralData
			});

			expect(result).toBe(1);
			expect(dbMocks.pluralform.mockPut).toHaveBeenCalledWith({
				translationId: 1,
				lang: 'en',
				pluralData
			});
		});

		it('should update existing plural form when combination exists', async () => {
			const oldData = { one: 'old', many: 'olds' };
			const newData = { one: 'new', many: 'news' };
			const existing = { id: 1, translationId: 1, lang: 'en', pluralData: oldData };
			dbMocks.pluralform.mockFirst.mockResolvedValue(existing);
			dbMocks.pluralform.mockPut.mockResolvedValue(1);

			const result = await upsertPluralForm({
				translationId: 1,
				lang: 'en',
				pluralData: newData
			});

			expect(result).toBe(1);
			expect(dbMocks.pluralform.mockPut).toHaveBeenCalledWith({
				id: 1,
				translationId: 1,
				lang: 'en',
				pluralData: newData
			});
		});

		it('should handle string translationId by converting to number', async () => {
			dbMocks.pluralform.mockFirst.mockResolvedValue(undefined);
			dbMocks.pluralform.mockPut.mockResolvedValue(1);

			const result = await upsertPluralForm({
				translationId: '3' as any,
				lang: 'en',
				pluralData: { one: 'item' }
			});

			expect(result).toBe(1);
			expect(dbMocks.pluralform.mockPut).toHaveBeenCalledWith({
				translationId: 3,
				lang: 'en',
				pluralData: { one: 'item' }
			});
		});

		it('should throw error for invalid translationId', async () => {
			await expect(upsertPluralForm({
				translationId: NaN,
				lang: 'en',
				pluralData: {}
			})).rejects.toThrow('Invalid translationId: NaN');
		});

		it('should throw error for zero translationId', async () => {
			await expect(upsertPluralForm({
				translationId: 0,
				lang: 'en',
				pluralData: {}
			})).rejects.toThrow('Invalid translationId: 0');
		});
	});

	describe('Integration Scenarios', () => {
		it('should handle complete translation workflow', async () => {
			dbMocks.translation.mockFirst.mockResolvedValue(undefined);
			dbMocks.translation.mockPut.mockResolvedValue(1);
			dbMocks.translationvalue.mockFirst.mockResolvedValue(undefined);
			dbMocks.translationvalue.mockPut.mockResolvedValue(1);

			const translationId = await upsertTranslation({
				key: 'app.welcome',
				context: 'homepage'
			});

			await upsertTranslationValue({
				translationId,
				lang: 'en',
				value: 'Welcome'
			});

			await upsertTranslationValue({
				translationId,
				lang: 'ru',
				value: 'Добро пожаловать'
			});

			expect(translationId).toBe(1);
			expect(dbMocks.translationvalue.mockPut).toHaveBeenCalledTimes(2);
		});

		it('should handle multiple languages for same translation', async () => {
			dbMocks.translation.mockFirst.mockResolvedValue(undefined);
			dbMocks.translation.mockPut.mockResolvedValue(1);
			dbMocks.translationvalue.mockFirst.mockResolvedValue(undefined);
			dbMocks.translationvalue.mockPut.mockResolvedValue(1);

			const translationId = await upsertTranslation({ key: 'save' });

			await upsertTranslationValue({ translationId, lang: 'en', value: 'Save' });
			await upsertTranslationValue({ translationId, lang: 'ru', value: 'Сохранить' });
			await upsertTranslationValue({ translationId, lang: 'et', value: 'Salvesta' });

			expect(dbMocks.translationvalue.mockPut).toHaveBeenCalledTimes(3);
		});
	});
});

