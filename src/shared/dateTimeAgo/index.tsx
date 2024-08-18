import React from 'react'

import { formatDistance } from 'date-fns'
import { de, et, fr, pl, ru, tr } from 'date-fns/locale'
const loadedDateLocales = { de, et, fr, pl, ru, tr }

export default function DateTimeAgo({ dateString, lang = 'en' }) {
	if(!dateString) return null
	const dateLangOptions = { locale: loadedDateLocales[lang] }

	return <>{formatDistance(new Date(dateString), new Date(), dateLangOptions)}</>
}