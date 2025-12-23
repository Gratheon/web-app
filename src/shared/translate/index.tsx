import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { useLiveQuery } from 'dexie-react-hooks'

import { getUser } from '@/models/user'
import {
	getTranslation,
	getTranslationValue,
	getPluralForms
} from '@/models/translations'
import {
	fetchTranslationWithRemote,
	fetchPluralWithRemote,
	getUserLanguage
} from '@/models/translationService'
import { getPluralForm } from './pluralRules'
import { newTranslationBatcher } from './newBatch'

const supportedLangs = ['en', 'ru', 'et','tr','pl','de','fr'];

function TRemote({ lang, children, onFetched }: { lang: string, children: string, onFetched?: () => void }) {
	const [translation, setTranslation] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [fetched, setFetched] = useState(false)

	useEffect(() => {
		if (fetched) return;

		const fetchTranslation = async () => {
			try {
				const trans = await newTranslationBatcher.request(children, false);
				setTranslation(trans);
				setLoading(false);
				setFetched(true);
				onFetched?.();
			} catch (error) {
				console.error('Translation fetch error:', error);
				setLoading(false);
				setFetched(true);
				onFetched?.();
			}
		};

		fetchTranslation();
	}, [children, fetched, onFetched]);

	if (loading || !translation) return <>{children}</>

	const value = translation.values?.[lang];
	return <>{value || children}</>
}

// Define a specific props interface for clarity
interface TProps {
  children: string;
}

export default function T({ children }: TProps) {
	let user = useLiveQuery(() => getUser(), [], null)
	const [lang, setLanguageCode] = useState('en');
	const [shouldShowRemote, setShouldShowRemote] = useState(false);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

	useEffect(() => {
		if (user && user?.lang) {
			setLanguageCode(user.lang)
		} else if (user === null) {
			const browserLang = navigator.language.substring(0, 2)
			if(supportedLangs.indexOf(browserLang)>=0){
				setLanguageCode(browserLang);
			}
		}
	}, [user]);

	let translation = useLiveQuery(async () => {
		const trans = await getTranslation(children);
		if (!trans) {
			return null;
		}

		return await getTranslationValue(trans.id, lang);
	}, [children, lang], null);

	useEffect(() => {
		if (!hasAttemptedFetch && translation === null) {
			setShouldShowRemote(true);
		}
	}, [translation, hasAttemptedFetch]);

	if (translation) return <>{translation}</>

	if (shouldShowRemote && !hasAttemptedFetch) {
		return <TRemote
			lang={lang}
			onFetched={() => {
				setShouldShowRemote(false);
				setHasAttemptedFetch(true);
			}}
		>{children}</TRemote>
	}

	return <>{children}</>
}


export function useTranslation(key: string) {
	const [translatedText, setTranslatedText] = useState(key);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

	let user = useLiveQuery(() => getUser(), [], null);
	const lang = getUserLanguage(user, supportedLangs);

	let cachedTranslation = useLiveQuery(async () => {
		const translation = await getTranslation(key);
		if (!translation) return null;

		const value = await getTranslationValue(translation.id, lang);
		return { translationId: translation.id, value };
	}, [key, lang], null);

	useEffect(() => {
		setHasAttemptedFetch(false);
	}, [key, lang]);

	useEffect(() => {
		if (cachedTranslation?.value) {
			setTranslatedText(cachedTranslation.value);
		} else if (cachedTranslation === null && !hasAttemptedFetch) {
			setHasAttemptedFetch(true);
			fetchTranslationWithRemote(key, lang)
				.then(text => setTranslatedText(text))
				.catch(error => {
					console.error('Translation fetch error:', error);
				});
		}
	}, [cachedTranslation, key, lang, hasAttemptedFetch]);

	return translatedText;
}

export function usePlural(count: number, key: string) {
	const [translatedText, setTranslatedText] = useState(key);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

	let user = useLiveQuery(() => getUser(), [], null);
	const lang = getUserLanguage(user, supportedLangs);
	const pluralForm = getPluralForm(count, lang);

	let cachedPlural = useLiveQuery(async () => {
		const translation = await getTranslation(key);
		if (!translation) return null;

		const pluralData = await getPluralForms(translation.id, lang);
		return { translationId: translation.id, pluralData };
	}, [key, lang], null);

	useEffect(() => {
		setHasAttemptedFetch(false);
	}, [key, lang]);

	useEffect(() => {
		if (cachedPlural?.pluralData?.[pluralForm]) {
			setTranslatedText(cachedPlural.pluralData[pluralForm]);
		} else if ((cachedPlural === null || cachedPlural?.pluralData === null) && !hasAttemptedFetch) {
			setHasAttemptedFetch(true);
			fetchPluralWithRemote(key, lang, pluralForm)
				.then(text => setTranslatedText(text))
				.catch(error => {
					console.error('Plural fetch error:', error);
				});
		}
	}, [cachedPlural, key, lang, pluralForm, hasAttemptedFetch]);

	return translatedText;
}
