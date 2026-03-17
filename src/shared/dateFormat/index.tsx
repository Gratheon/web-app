import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getUser } from '@/models/user'
import { formatDateTimeByLocale, resolveLocale } from '@/shared/dateLocale'

type DateFormatProps = {
	datetime: string
	formatString?: string
	lang?: string
	locale?: string
	style?: string
}

export function formatTime(datetime, formatString, lang = 'en') {
	const date = new Date(datetime)
	if (formatString === 'yyyy, dd MMMM') {
		return formatDateTimeByLocale(date, { year: 'numeric', day: '2-digit', month: 'long' }, lang)
	}
	return formatDateTimeByLocale(date, { dateStyle: 'medium' }, lang)
}

export default function DateFormat({
	datetime,
	formatString = 'yyyy, dd MMMM',
	lang = 'en',
	locale,
	style = '',
}: DateFormatProps) {
	const user = useLiveQuery(() => getUser(), [], null)
	if (!datetime) return null
	const resolvedLocale = resolveLocale(locale || user?.locale, lang || user?.lang)

	return (
		<span className="date timeago" title={datetime} style={style}>
			{formatTime(datetime, formatString, resolvedLocale)}
		</span>
	)
}
