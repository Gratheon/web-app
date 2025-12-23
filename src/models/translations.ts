import { db } from "./db";

export type Translation = {
	id?: number
	key: string
	context?: string
}

export type TranslationValue = {
	id?: number
	translationId: number
	lang: string
	value: string
}

export type PluralForm = {
	id?: number
	translationId: number
	lang: string
	pluralData: any
}

const TRANSLATION_TABLE = 'translation'
const VALUE_TABLE = 'translationvalue'
const PLURAL_TABLE = 'pluralform'

function validateTableExists(tableName: string): void {
	if (!db[tableName]) {
		throw new Error(`Table "${tableName}" does not exist in IndexedDB`);
	}
}

function validateTranslationId(translationId: number): number {
	const translationIdNum = +translationId;
	if (!translationIdNum || isNaN(translationIdNum)) {
		throw new Error(`Invalid translationId: ${translationId}`);
	}
	return translationIdNum;
}

export async function getTranslation(key: string): Promise<Translation | null> {
	const result = await db[TRANSLATION_TABLE].where('key').equals(key).first();
	return result || null;
}

export async function getTranslationValue(translationId: number, lang: string): Promise<string | null> {
	const result = await db[VALUE_TABLE]
		.where('[translationId+lang]')
		.equals([translationId, lang])
		.first();
	return result?.value || null;
}

export async function getPluralForms(translationId: number, lang: string): Promise<any | null> {
	const result = await db[PLURAL_TABLE]
		.where('[translationId+lang]')
		.equals([translationId, lang])
		.first();
	return result?.pluralData || null;
}

export async function upsertTranslation(data: Translation): Promise<number> {
	validateTableExists(TRANSLATION_TABLE);

	const existing = await db[TRANSLATION_TABLE]
		.where('key')
		.equals(data.key)
		.first();

	const translationData: Translation = {
		key: data.key,
		context: data.context || null
	};

	if (existing) {
		translationData.id = existing.id;
	} else if (data.id) {
		translationData.id = +data.id;
	}

	return await db[TRANSLATION_TABLE].put(translationData);
}

export async function upsertTranslationValue(data: TranslationValue): Promise<number> {
	validateTableExists(VALUE_TABLE);
	const translationIdNum = validateTranslationId(data.translationId);

	const existing = await db[VALUE_TABLE]
		.where('[translationId+lang]')
		.equals([translationIdNum, data.lang])
		.first();

	const valueData: TranslationValue = {
		translationId: translationIdNum,
		lang: data.lang,
		value: data.value
	};

	if (existing) {
		valueData.id = existing.id;
	}

	return await db[VALUE_TABLE].put(valueData);
}

export async function upsertPluralForm(data: PluralForm): Promise<number> {
	const translationIdNum = validateTranslationId(data.translationId);

	const existing = await db[PLURAL_TABLE]
		.where('[translationId+lang]')
		.equals([translationIdNum, data.lang])
		.first();

	const pluralData: PluralForm = {
		translationId: translationIdNum,
		lang: data.lang,
		pluralData: data.pluralData
	};

	if (existing) {
		pluralData.id = existing.id;
	}

	return await db[PLURAL_TABLE].put(pluralData);
}

