import React, { useEffect, useState } from 'react'
import { gql, useQuery } from '@/components/api'
import { useLiveQuery } from 'dexie-react-hooks'

import { getUser } from '@/components/models/user'
import { getLocale } from '@/components/models/locales'

function TRemote({ lang, children, tc }: { lang: string, children: any, tc: string }) {
	const { loading, error, data } = useQuery(gql`query translate($en: String!, $tc: String){
		translate(en: $en, tc: $tc){
			id
			en
			ru
			et
			key
		}
	}`, { variables: { en: children, tc } })

	if (loading) return

	return <>
		{data && data.translate && data.translate[lang] ? data.translate[lang] : children}
	</>
}

export default function T({ children, ctx = '' }: { children: any, ctx?: string }) {
	let user = useLiveQuery(() => getUser(), [])

	const [lang, setLanguageCode] = useState('en');

	if (user && user.lang) {
		setLanguageCode(user.lang)
	}

	useEffect(() => {
		if (!user || !user.lang) {
			setLanguageCode(navigator.language.substring(0, 2));
		}
	}, []);

	let translated = useLiveQuery(() => {
		if (!user || !lang) return
		const where = { en: children }
		return getLocale(where)
	}, [user])

	if (translated && translated[lang]) return <>{translated[lang]}</>

	return <TRemote lang={lang} tc={ctx}>{children}</TRemote>
}