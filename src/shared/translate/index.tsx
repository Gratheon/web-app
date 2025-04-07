import React, { useEffect, useState } from 'react'
import { gql, useQuery } from '../../api'
import { useLiveQuery } from 'dexie-react-hooks'

import { getUser } from '../../models/user.ts'
import { getLocale } from '../../models/locales.ts'

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
	const { loading, error, data } = useQuery(translateQuery, { variables: { en: children, tc } })

	if (loading || error) return children

	return <>
		{data && data.translate && data.translate[lang] ? data.translate[lang] : children}
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

	if (user && user?.lang) {
		setLanguageCode(user.lang)
	}

	useEffect(() => {
		if (user === null) {
			const browserLang = navigator.language.substring(0, 2)
			if(supportedLangs.indexOf(browserLang)>=0){
				setLanguageCode(browserLang);
			}
		}
	}, [user]);

	let translated = useLiveQuery(() => {
		const where = { en: children }
		return getLocale(where)
	}, [user], false)

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
	  } else {
		const browserLang = navigator.language.substring(0, 2);
		if (supportedLangs.includes(browserLang)) {
		  setLang(browserLang);
		}
	  }
	}, [user]);
  
	let cachedTranslation = useLiveQuery(() => {
	  const where = { en: text };
	  return getLocale(where);
	}, [text, lang], false);
  
	const { data, loading, error } = useQuery(translateQuery, {
	  variables: { en: text, tc: translationContext },
	  skip: cachedTranslation !== false, // Skip the query if we have a cached translation
	});
  
	useEffect(() => {
	  if (cachedTranslation && cachedTranslation[lang]) {
		setTranslatedText(cachedTranslation[lang]);
	  } else if (data && data.translate && data.translate[lang]) {
		setTranslatedText(data.translate[lang]);
	  }
	}, [cachedTranslation, data, lang]);
  
	if (loading || error) return text;
  
	return translatedText;
  }
