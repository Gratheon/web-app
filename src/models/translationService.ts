import {
	getTranslation,
	getTranslationValue,
	getPluralForms
} from './translations';
import { newTranslationBatcher } from '@/shared/translate/newBatch';
import { SUPPORTED_LANGUAGES } from '@/config/languages';

export interface TranslationResult {
	value: string | null;
	fromCache: boolean;
}

export interface PluralTranslationResult {
	value: string;
	fromCache: boolean;
}

export interface TranslationData {
	id: number;
	key: string;
	values: Record<string, string>;
	plurals?: Record<string, Record<string, string>>;
}

export async function fetchTranslationForLanguage(
	key: string,
	lang: string
): Promise<TranslationResult> {
	console.log(`[translationService] fetchTranslationForLanguage: key="${key}", lang="${lang}"`);
	const translation = await getTranslation(key);
	console.log(`[translationService] Translation record for "${key}":`, translation);

	if (!translation) {
		return { value: null, fromCache: false };
	}

	const value = await getTranslationValue(translation.id, lang);
	console.log(`[translationService] Translation value for "${key}" (id=${translation.id}, lang=${lang}):`, value);

	if (value) {
		return { value, fromCache: true };
	}

	return { value: null, fromCache: false };
}

export async function fetchTranslationWithRemote(
	key: string,
	lang: string,
	context?: string,
	namespace?: string
): Promise<string> {
	const cached = await fetchTranslationForLanguage(key, lang, namespace);

	if (cached.value) {
		return cached.value;
	}

	try {
		const trans = await newTranslationBatcher.request(key, false, context, namespace);
		return trans?.values?.[lang] || key;
	} catch (error) {
		console.error('[fetchTranslationWithRemote] Error:', error);
		return key;
	}
}

export async function fetchPluralForLanguage(
	key: string,
	lang: string,
	pluralForm: string,
	namespace?: string
): Promise<PluralTranslationResult> {
	const translation = await getTranslation(key, namespace);

	if (!translation) {
		return { value: key, fromCache: false };
	}

	const pluralData = await getPluralForms(translation.id, lang);

	if (pluralData && pluralData[pluralForm]) {
		return { value: pluralData[pluralForm], fromCache: true };
	}

	return { value: key, fromCache: false };
}

export async function fetchPluralWithRemote(
	key: string,
	lang: string,
	pluralForm: string,
	namespace?: string
): Promise<string> {
	const cached = await fetchPluralForLanguage(key, lang, pluralForm, namespace);

	if (cached.fromCache) {
		return cached.value;
	}

	try {
		const trans = await newTranslationBatcher.request(key, true, undefined, namespace);
		const pluralValue = trans?.plurals?.[lang]?.[pluralForm];
		return pluralValue || key;
	} catch (error) {
		console.error('[fetchPluralWithRemote] Error:', error);
		return key;
	}
}

export function getUserLanguage(
	user: { lang?: string } | null,
	supportedLangs: readonly string[] = SUPPORTED_LANGUAGES
): string {
	if (user && user.lang) {
		return user.lang;
	}

	if (typeof navigator !== 'undefined') {
		const browserLang = navigator.language.substring(0, 2);
		if (supportedLangs.includes(browserLang)) {
			return browserLang;
		}
	}

	return 'en';
}

export async function fetchRemoteTranslation(
	key: string,
	lang: string,
	context?: string,
	namespace?: string
): Promise<TranslationData | null> {
	try {
		console.log(`[translationService] fetchRemoteTranslation: key="${key}", lang="${lang}", context="${context}", namespace="${namespace}"`);
		const trans = await newTranslationBatcher.request(key, false, context, namespace);
		console.log(`[translationService] Remote translation result for "${key}" (namespace: ${namespace}):`, trans);
		return trans || null;
	} catch (error) {
		console.error('[fetchRemoteTranslation] Error:', error);
		return null;
	}
}

export async function fetchRemotePlural(
	key: string,
	context?: string
): Promise<TranslationData | null> {
	try {
		const trans = await newTranslationBatcher.request(key, true, context);
		return trans || null;
	} catch (error) {
		console.error('[fetchRemotePlural] Error:', error);
		return null;
	}
}

