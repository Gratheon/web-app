import Link from '../../link'
import DateFormat from '../../dateFormat'
import React from 'react'
import colors from '../../../colors'
import styles from './styles.less'

export default function journalItem({
	selected = false,
	apiaryId,
	data,
	hiveId,
	added,
	id,
}) {
	let tmpdata = JSON.parse(data)
	let stats = tmpdata.stats

	stats.brood = Math.round(stats.brood * 5)
	stats.honey = Math.round(stats.honey * 5)
	return (
		<div
			className={`${styles.journalItem} ${
				selected ? styles.journalItemSelected : ''
			}`}
		>
			<Link
				className={null}
				href={`/apiaries/${apiaryId}/hives/${hiveId}/inspections/${id}`}
			>
				<DateFormat datetime={added} />
				<div className={styles.journalItemStats}>
					<div
						style={`background-color:${colors.broodColor};height:${stats.brood}px;`}
					></div>
					<div
						style={`background-color:${colors.honeyColor};height:${stats.honey}px;border-top:1px solid #ffAA00;`}
					></div>
				</div>
			</Link>
		</div>
	)
}
