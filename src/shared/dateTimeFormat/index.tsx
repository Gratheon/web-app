import React from 'react'

import { format, formatDistance } from 'date-fns'
import { de, et, fr, pl, ru, tr } from 'date-fns/locale'
const loadedDateLocales = { de, et, fr, pl, ru, tr }

type DateTimeFormatProps = {
	datetime: string
	lang?: string
	style?: string
}

export function formatTime(datetime, lang = 'en') {
	const dateLangOptions = { locale: loadedDateLocales[lang] }

	return format(new Date(datetime), 'dd MMMM yyyy, hh:mm', dateLangOptions)
}

export default function DateTimeFormat({
	datetime,
	lang = 'en',
	style = '',
}: DateTimeFormatProps) {
	if (!datetime) return null

	return (
		<span className="date timeago" title={datetime} style={style}>
			{formatTime(datetime, lang)}
		</span>
	)
}
