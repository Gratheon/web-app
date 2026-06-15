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
	'ja'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
	en: 'English',
	zh: '简体中文',
	ja: '日本語',
	hi: 'हिन्दी',
	bn: 'বাংলা',
	es: 'Español',
	pt: 'Português',
	ar: 'العربية',
	fr: 'Français',
	ru: 'Русский',
	de: 'Deutsch',
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

