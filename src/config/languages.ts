export const SUPPORTED_LANGUAGES = [
	'en',
	'ru',
	'et',
	'tr',
	'pl',
	'de',
	'fr',
	'lv',
	'lt',
	'hu',
	'uk',
	'it',
	'ro',
	'zh',
	'hi',
	'es',
	'ar',
	'bn',
	'pt',
	'ja',
	'he',
	'ko',
	'nl'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export function normalizeSupportedLanguage(
	lang?: string | null,
	supportedLangs: readonly string[] = SUPPORTED_LANGUAGES
): string | null {
	if (!lang) return null;

	const normalizedLang = lang.trim().toLowerCase().replace('_', '-');
	if (!normalizedLang) return null;

	const baseLang = normalizedLang.split('-')[0];
	return supportedLangs.includes(baseLang) ? baseLang : null;
}

export function getQueryParamLanguage(
	supportedLangs: readonly string[] = SUPPORTED_LANGUAGES,
	search?: string
): string | null {
	const rawSearch = search ?? (typeof window !== 'undefined' ? window.location.search : '');
	if (!rawSearch) return null;

	try {
		const params = new URLSearchParams(rawSearch);
		return normalizeSupportedLanguage(params.get('lang'), supportedLangs);
	} catch {
		return null;
	}
}

export function getBrowserLanguage(
	supportedLangs: readonly string[] = SUPPORTED_LANGUAGES
): string | null {
	if (typeof navigator === 'undefined') return null;
	return normalizeSupportedLanguage(navigator.language, supportedLangs);
}

export function getPreferredLanguage(
	supportedLangs: readonly string[] = SUPPORTED_LANGUAGES,
	search?: string
): string {
	return getQueryParamLanguage(supportedLangs, search) || getBrowserLanguage(supportedLangs) || 'en';
}

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
	en: 'English',
	zh: '简体中文',
	ja: '日本語',
	hi: 'हिन्दी',
	bn: 'বাংলা',
	es: 'Español',
	pt: 'Português',
	ar: 'العربية',
	he: 'עברית',
	ko: '한국어',
	fr: 'Français',
	ru: 'Русский',
	de: 'Deutsch',
	nl: 'Nederlands',
	et: 'Eesti',
	pl: 'Polski',
	tr: 'Türkçe',
	lv: 'Latviešu',
	lt: 'Lietuvių',
	hu: 'Magyar',
	uk: 'Українська',
	it: 'Italiano',
	ro: 'Română'
};

