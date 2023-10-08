import React, { useEffect, useState } from 'react'
import { gql, useQuery } from '@/components/api'
import { useLiveQuery } from 'dexie-react-hooks'

import { getUser } from '@/components/models/user'
import { getLocale } from '@/components/models/locales'

const supportedLangs = ['en', 'ru', 'et'];

function TRemote({ lang, children, tc }: { lang: string, children: any, tc: string }) {
	const { loading, error, data } = useQuery(gql`query translate($en: String!, $tc: String){
		translate(en: $en, tc: $tc){
			__typename
			id
			en
			ru
			et
			key
		}
	}`, { variables: { en: children, tc } })

	if (loading || error) return children

	// console.log('received', data)
	return <>
		{data && data.translate && data.translate[lang] ? data.translate[lang] : children}
	</>
}

export default function T({ children, key=null, ctx = '' }: { children: any, key?: string, ctx?: string }) {
	let user = useLiveQuery(() => getUser(), [], false)

	const [lang, setLanguageCode] = useState('en');

	if (user && user.lang) {
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

	// console.log({lang, translated})
	// get cached translation
	if (translated && translated[lang]) return <>{translated[lang]}</>

	// loading cache?
	if( translated == false) return children

	// console.log({user, lang, translated})

	// ask backend
	return <TRemote lang={lang} key={key} tc={ctx}>{children}</TRemote>
}