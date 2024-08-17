import React from 'react'

import { format, formatDistance } from 'date-fns'
import { de, et, fr, pl, ru, tr } from 'date-fns/locale'
const loadedDateLocales = { de, et, fr, pl, ru, tr }

type DateFormatProps = {
	datetime: string
	lang?: string
	style?: string
}

export default function DateFormat({ datetime, lang = 'en', style='' }: DateFormatProps) {
	const dateLangOptions = { locale: loadedDateLocales[lang] }

	return (
		<span className="date timeago" title={datetime} style={style}>
			{format(new Date(datetime), 'dd MMMM yyyy, hh:mm', dateLangOptions)}
		</span>
	)
}
