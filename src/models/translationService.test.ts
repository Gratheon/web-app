import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	fetchTranslationForLanguage,
	fetchTranslationWithRemote,
	fetchPluralForLanguage,
	fetchPluralWithRemote,
	getUserLanguage
} from './translationService';
import * as translations from './translations';
import { newTranslationBatcher } from '@/shared/translate/newBatch';

vi.mock('./translations', () => ({
	getTranslation: vi.fn(),
	getTranslationValue: vi.fn(),
	getPluralForms: vi.fn()
}));

vi.mock('@/shared/translate/newBatch', () => ({
	newTranslationBatcher: {
		request: vi.fn()
	}
}));

describe('translationService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('fetchTranslationForLanguage', () => {
		it('should return cached translation when available', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue({
				id: 1,
				key: 'hello',
				context: null
			});
			vi.mocked(translations.getTranslationValue).mockResolvedValue('Привет');

			const result = await fetchTranslationForLanguage('hello', 'ru');

			expect(result).toEqual({
				value: 'Привет',
				fromCache: true
			});
			expect(translations.getTranslation).toHaveBeenCalledWith('hello');
			expect(translations.getTranslationValue).toHaveBeenCalledWith(1, 'ru');
		});

		it('should return null when translation key not found', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);

			const result = await fetchTranslationForLanguage('missing', 'ru');

			expect(result).toEqual({
				value: null,
				fromCache: false
			});
			expect(translations.getTranslationValue).not.toHaveBeenCalled();
		});

		it('should return null when translation exists but no value for language', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue({
				id: 1,
				key: 'hello',
				context: null
			});
			vi.mocked(translations.getTranslationValue).mockResolvedValue(null);

			const result = await fetchTranslationForLanguage('hello', 'fr');

			expect(result).toEqual({
				value: null,
				fromCache: false
			});
		});
	});

	describe('fetchTranslationWithRemote', () => {
		it('should return cached value if available', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue({
				id: 1,
				key: 'save',
				context: null
			});
			vi.mocked(translations.getTranslationValue).mockResolvedValue('Сохранить');

			const result = await fetchTranslationWithRemote('save', 'ru');

			expect(result).toBe('Сохранить');
			expect(newTranslationBatcher.request).not.toHaveBeenCalled();
		});

		it('should fetch from remote when not cached', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);
			vi.mocked(newTranslationBatcher.request).mockResolvedValue({
				values: {
					ru: 'Удалить'
				}
			});

			const result = await fetchTranslationWithRemote('delete', 'ru');

			expect(result).toBe('Удалить');
			expect(newTranslationBatcher.request).toHaveBeenCalledWith('delete', false, undefined);
		});

		it('should return key as fallback when remote fails', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);
			vi.mocked(newTranslationBatcher.request).mockRejectedValue(new Error('Network error'));

			const result = await fetchTranslationWithRemote('error', 'ru');

			expect(result).toBe('error');
		});

		it('should return key when remote returns no values', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);
			vi.mocked(newTranslationBatcher.request).mockResolvedValue({
				values: {}
			});

			const result = await fetchTranslationWithRemote('novalue', 'ru');

			expect(result).toBe('novalue');
		});
	});

	describe('fetchPluralForLanguage', () => {
		it('should return cached plural form when available', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue({
				id: 1,
				key: 'hive',
				context: null
			});
			vi.mocked(translations.getPluralForms).mockResolvedValue({
				one: 'улей',
				few: 'улья',
				many: 'ульев'
			});

			const result = await fetchPluralForLanguage('hive', 'ru', 'many');

			expect(result).toEqual({
				value: 'ульев',
				fromCache: true
			});
			expect(translations.getPluralForms).toHaveBeenCalledWith(1, 'ru');
		});

		it('should return key when translation not found', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);

			const result = await fetchPluralForLanguage('missing', 'ru', 'many');

			expect(result).toEqual({
				value: 'missing',
				fromCache: false
			});
		});

		it('should return key when plural form not found', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue({
				id: 1,
				key: 'hive',
				context: null
			});
			vi.mocked(translations.getPluralForms).mockResolvedValue({
				one: 'улей'
			});

			const result = await fetchPluralForLanguage('hive', 'ru', 'many');

			expect(result).toEqual({
				value: 'hive',
				fromCache: false
			});
		});

		it('should return key when pluralData is null', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue({
				id: 1,
				key: 'hive',
				context: null
			});
			vi.mocked(translations.getPluralForms).mockResolvedValue(null);

			const result = await fetchPluralForLanguage('hive', 'ru', 'many');

			expect(result).toEqual({
				value: 'hive',
				fromCache: false
			});
		});
	});

	describe('fetchPluralWithRemote', () => {
		it('should return cached plural if available', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue({
				id: 1,
				key: 'hive',
				context: null
			});
			vi.mocked(translations.getPluralForms).mockResolvedValue({
				one: 'улей',
				many: 'ульев'
			});

			const result = await fetchPluralWithRemote('hive', 'ru', 'many');

			expect(result).toBe('ульев');
			expect(newTranslationBatcher.request).not.toHaveBeenCalled();
		});

		it('should fetch from remote when not cached', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);
			vi.mocked(newTranslationBatcher.request).mockResolvedValue({
				plurals: {
					ru: {
						one: 'улей',
						few: 'улья',
						many: 'ульев'
					}
				}
			});

			const result = await fetchPluralWithRemote('hive', 'ru', 'many');

			expect(result).toBe('ульев');
			expect(newTranslationBatcher.request).toHaveBeenCalledWith('hive', true, undefined);
		});

		it('should return key as fallback when remote fails', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);
			vi.mocked(newTranslationBatcher.request).mockRejectedValue(new Error('Network error'));

			const result = await fetchPluralWithRemote('error', 'ru', 'many');

			expect(result).toBe('error');
		});

		it('should return key when remote returns no plurals', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);
			vi.mocked(newTranslationBatcher.request).mockResolvedValue({
				plurals: null
			});

			const result = await fetchPluralWithRemote('noplural', 'ru', 'many');

			expect(result).toBe('noplural');
		});

		it('should return key when plural form not in remote response', async () => {
			vi.mocked(translations.getTranslation).mockResolvedValue(null);
			vi.mocked(newTranslationBatcher.request).mockResolvedValue({
				plurals: {
					ru: {
						one: 'улей'
					}
				}
			});

			const result = await fetchPluralWithRemote('hive', 'ru', 'many');

			expect(result).toBe('hive');
		});
	});

	describe('getUserLanguage', () => {
		it('should return user language when available', () => {
			const result = getUserLanguage({ lang: 'ru' });

			expect(result).toBe('ru');
		});

		it('should return browser language when user has no language', () => {
			Object.defineProperty(navigator, 'language', {
				value: 'ru-RU',
				configurable: true
			});

			const result = getUserLanguage(null);

			expect(result).toBe('ru');
		});

		it('should return en when browser language not supported', () => {
			Object.defineProperty(navigator, 'language', {
				value: 'zh-CN',
				configurable: true
			});

			const result = getUserLanguage(null);

			expect(result).toBe('en');
		});

		it('should return en as default when no user and no navigator', () => {
			const originalNavigator = global.navigator;
			(global as any).navigator = undefined;

			const result = getUserLanguage(null);

			expect(result).toBe('en');

			(global as any).navigator = originalNavigator;
		});

		it('should respect custom supported languages', () => {
			Object.defineProperty(navigator, 'language', {
				value: 'es-ES',
				configurable: true
			});

			const result = getUserLanguage(null, ['en', 'es']);

			expect(result).toBe('es');
		});
	});
});

