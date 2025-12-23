import React, { useEffect, useState } from 'react'
import { gql, useQuery } from '@/api'
import { useLiveQuery } from 'dexie-react-hooks'

import { getUser } from '@/models/user'
import { getLocale } from '@/models/locales'
import { translationBatcher } from './batch'

const supportedLangs = ['en', 'ru', 'et','tr','pl','de','fr'];

const translateQuery = gql`query translate($en: String!, $tc: String){
	translate(en: $en, tc: $tc){
		__typename
		id
		en
		ru
		et
		tr
		pl
		de
		fr
		key
	}
}`

function TRemote({ lang, children, tc }: { lang: string, children: any, tc: string }) {
	const [translation, setTranslation] = useState<any>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		translationBatcher.request(children, tc)
			.then(data => {
				setTranslation(data)
				setLoading(false)
			})
			.catch(() => {
				setLoading(false)
			})
	}, [children, tc])

	if (loading || !translation) return <>{children}</>

	return <>
		{translation[lang] ? translation[lang] : children}
	</>
}

// Define a specific props interface for clarity
interface TProps {
  children: string; // Changed from 'any' to 'string'
  key?: string;
  ctx?: string;
}

export default function T({ children, key = null, ctx = '' }: TProps) {
	let user = useLiveQuery(() => getUser(), [], null)

	const [lang, setLanguageCode] = useState('en');

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

	let translated = useLiveQuery(() => {
		const where = { en: children }
		return getLocale(where)
	}, [children], false)

	// get cached translation
	if (translated && translated[lang]) return <>{translated[lang]}</>

	// loading cache?
	if( translated == false) return <>{children}</>

	// ask backend
	return <TRemote lang={lang} key={key} tc={ctx}>{children}</TRemote>
}


export function useTranslation(text, translationContext = '') {
	const [translatedText, setTranslatedText] = useState(text);
	const [lang, setLang] = useState('en');

	let user = useLiveQuery(() => getUser(), [], null);
  
	useEffect(() => {
	  if (user && user?.lang) {
		setLang(user.lang);
	  } else if (user === null) {
		const browserLang = navigator.language.substring(0, 2);
		if (supportedLangs.includes(browserLang)) {
		  setLang(browserLang);
		}
	  }
	}, [user]);
  
	// Extract simple context for lookup key: "plural:few (for...)" -> "plural:few"
	const simpleContext = translationContext ? translationContext.split(' (')[0] : '';
	const lookupKey = simpleContext ? `${text}__ctx__${simpleContext}` : text;

	let cachedTranslation = useLiveQuery(() => {
	  const where = simpleContext
	    ? { key: lookupKey }  // Lookup by composite key when context exists
	    : { en: text };        // Lookup by en when no context
	  return getLocale(where);
	}, [lookupKey, text, simpleContext], false);

	useEffect(() => {
	  if (cachedTranslation && cachedTranslation[lang]) {
		setTranslatedText(cachedTranslation[lang]);
	  } else if (cachedTranslation === null) {
		// Pass full context to backend for LLM translation
		translationBatcher.request(text, translationContext)
		  .then(data => {
			if (data && data[lang]) {
			  setTranslatedText(data[lang]);
			}
		  })
		  .catch(() => {});
	  }
	}, [cachedTranslation, text, translationContext, lang]);

	return translatedText;
}

function getPluralForm(count: number, lang: string): string {
	const n = Math.abs(count);
	const i = Math.floor(n);

	switch (lang) {
		case 'ru':
		case 'pl':
			if (i % 10 === 1 && i % 100 !== 11) return 'one';
			if (i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 10 || i % 100 >= 20)) return 'few';
			return 'many';

		case 'en':
		case 'de':
		case 'fr':
		case 'et':
		case 'tr':
		default:
			return i === 1 ? 'one' : 'other';
	}
}

function getPluralContextDescription(form: string, lang: string): string {
	switch (lang) {
		case 'ru':
		case 'pl':
			switch (form) {
				case 'one':
					return 'nominative singular - for counts like 1, 21, 31, 41, 101, 121... (e.g., 1 улей, 21 улей)';
				case 'few':
					return 'genitive singular - for counts like 2, 3, 4, 22, 23, 24, 32, 33, 34... (e.g., 2 улья, 3 улья, 4 улья)';
				case 'many':
					return 'genitive plural - for counts like 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 26, 27... (e.g., 5 ульев, 10 ульев, 20 ульев)';
				default:
					return '';
			}
		case 'en':
		case 'de':
		case 'fr':
		case 'et':
		case 'tr':
		default:
			switch (form) {
				case 'one':
					return 'singular - for count = 1';
				case 'other':
					return 'plural - for count > 1';
				default:
					return '';
			}
	}
}

export function usePlural(count: number, text: string) {
	const [lang, setLang] = useState('en');
	let user = useLiveQuery(() => getUser(), [], null);

	useEffect(() => {
		if (user && user?.lang) {
			setLang(user.lang);
		} else if (user === null) {
			const browserLang = navigator.language.substring(0, 2);
			if (supportedLangs.includes(browserLang)) {
				setLang(browserLang);
			}
		}
	}, [user]);

	const pluralForm = getPluralForm(count, lang);
	const simpleContext = `plural:${pluralForm}`;
	const detailedContext = getPluralContextDescription(pluralForm, lang);
	// Full context for LLM, simple context will be extracted for key
	const fullContext = detailedContext ? `${simpleContext} (${detailedContext})` : simpleContext;

	return useTranslation(text, fullContext);
}

