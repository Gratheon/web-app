import { db } from "./db";

export type Translation = {
	id?: number
	key: string
	namespace?: string
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

export async function getTranslation(key: string, namespace?: string): Promise<Translation | null> {
	// Only use compound index if namespace is a non-empty string (not undefined, null, or empty)
	if (namespace && namespace !== 'undefined' && namespace !== 'null') {
		return await db[TRANSLATION_TABLE].where('[key+namespace]').equals([key, namespace]).first() || null;
	} else {
		// For records without namespace (namespace is NULL in DB)
		// Get all records with this key and filter for null namespace
		const results = await db[TRANSLATION_TABLE].where('key').equals(key).toArray();
		return results.find(item => item.namespace == null) || null;
	}
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

	// Normalize namespace: convert 'undefined'/'null' strings to actual undefined
	const normalizedNamespace = (data.namespace && data.namespace !== 'undefined' && data.namespace !== 'null')
		? data.namespace
		: undefined;

	let existing;
	if (normalizedNamespace) {
		existing = await db[TRANSLATION_TABLE]
			.where('[key+namespace]')
			.equals([data.key, normalizedNamespace])
			.first();
	} else {
		// Get all records with this key and filter for null namespace
		const results = await db[TRANSLATION_TABLE].where('key').equals(data.key).toArray();
		existing = results.find(item => item.namespace == null);
	}

	const translationData: Translation = {
		key: data.key,
		namespace: normalizedNamespace,
		context: data.context || undefined
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

