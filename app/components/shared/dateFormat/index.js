import { React } from 'preact'

export default function dateFormat({
	datetime,
	options = {
		month: 'long',
		day: '2-digit',
		// year: 'numeric',
	},
}) {
	return (
		<span className="date timeago" title={datetime}>
			{new Intl.DateTimeFormat('en-GB', options).format(new Date(datetime))}
		</span>
	)
}
