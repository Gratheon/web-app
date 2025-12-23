export type PluralForm = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

export interface PluralRule {
	forms: PluralForm[];
	select: (n: number) => PluralForm;
}

export const pluralRules: Record<string, PluralRule> = {
	'en': {
		forms: ['one', 'other'],
		select: (n: number): PluralForm => {
			const i = Math.floor(Math.abs(n));
			return i === 1 ? 'one' : 'other';
		}
	},
	'ru': {
		forms: ['one', 'few', 'many'],
		select: (n: number): PluralForm => {
			const i = Math.floor(Math.abs(n));
			if (i % 10 === 1 && i % 100 !== 11) return 'one';
			if (i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 10 || i % 100 >= 20)) return 'few';
			return 'many';
		}
	},
	'pl': {
		forms: ['one', 'few', 'many'],
		select: (n: number): PluralForm => {
			const i = Math.floor(Math.abs(n));
			if (i === 1) return 'one';
			if (i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 10 || i % 100 >= 20)) return 'few';
			return 'many';
		}
	},
	'et': {
		forms: ['one', 'other'],
		select: (n: number): PluralForm => {
			const i = Math.floor(Math.abs(n));
			return i === 1 ? 'one' : 'other';
		}
	},
	'tr': {
		forms: ['one', 'other'],
		select: (n: number): PluralForm => {
			const i = Math.floor(Math.abs(n));
			return i === 1 ? 'one' : 'other';
		}
	},
	'de': {
		forms: ['one', 'other'],
		select: (n: number): PluralForm => {
			const i = Math.floor(Math.abs(n));
			return i === 1 ? 'one' : 'other';
		}
	},
	'fr': {
		forms: ['one', 'other'],
		select: (n: number): PluralForm => {
			const i = Math.floor(Math.abs(n));
			return i === 0 || i === 1 ? 'one' : 'other';
		}
	}
};

export function getPluralForm(count: number, lang: string): PluralForm {
	const rule = pluralRules[lang] || pluralRules['en'];
	return rule.select(count);
}

export function getPluralForms(lang: string): PluralForm[] {
	const rule = pluralRules[lang] || pluralRules['en'];
	return rule.forms;
}

