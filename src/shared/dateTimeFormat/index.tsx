import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getUser } from '@/models/user'
import { formatDateTimeByLocale, resolveLocale } from '@/shared/dateLocale'

type DateTimeFormatProps = {
	datetime: string
	lang?: string
	locale?: string
	style?: string
}

export function formatTime(datetime, lang = 'en') {
	return formatDateTimeByLocale(new Date(datetime), { dateStyle: 'medium', timeStyle: 'short' }, lang)
}

export default function DateTimeFormat({
	datetime,
	lang = 'en',
	locale,
	style = '',
}: DateTimeFormatProps) {
	const user = useLiveQuery(() => getUser(), [], null)
	if (!datetime) return null
	const resolvedLocale = resolveLocale(locale || user?.locale, lang || user?.lang)

	return (
		<span className="date timeago" title={datetime} style={style}>
			{formatTime(datetime, resolvedLocale)}
		</span>
	)
}
