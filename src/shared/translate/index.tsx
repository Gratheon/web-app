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
  
	let cachedTranslation = useLiveQuery(() => {
	  const where = { en: text };
	  return getLocale(where);
	}, [text], false);

	useEffect(() => {
	  if (cachedTranslation && cachedTranslation[lang]) {
		setTranslatedText(cachedTranslation[lang]);
	  } else if (cachedTranslation === null) {
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
