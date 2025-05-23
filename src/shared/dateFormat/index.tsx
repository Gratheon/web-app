import React from 'react'

import { format, formatDistance } from 'date-fns'
import { de, et, fr, pl, ru, tr } from 'date-fns/locale'
const loadedDateLocales = { de, et, fr, pl, ru, tr }

type DateFormatProps = {
	datetime: string
	formatString?: string
	lang?: string
	style?: string
}

export function formatTime(datetime, formatString, lang = 'en') {
	const dateLangOptions = { locale: loadedDateLocales[lang] }

	return format(new Date(datetime), formatString, dateLangOptions)
}

export default function DateFormat({
	datetime,
	formatString = 'yyyy, dd MMMM',
	lang = 'en',
	style = '',
}: DateFormatProps) {
	if (!datetime) return null

	return (
		<span className="date timeago" title={datetime} style={style}>
			{formatTime(datetime, formatString, lang)}
		</span>
	)
}
