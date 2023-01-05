import React from 'react'

type DateFormatProps = {
	datetime: string
	options?: any
}

export default function dateFormat({
	datetime,
	options = {
		month: 'long',
		day: '2-digit',
		// year: 'numeric',
	},
}: DateFormatProps) {
	return (
		<span className="date timeago" title={datetime}>
			{new Intl.DateTimeFormat('en-GB', options).format(new Date(datetime))}
		</span>
	)
}
