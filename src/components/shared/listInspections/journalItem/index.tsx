import Link from '../../link'
import DateFormat from '../../dateFormat'
import React from 'react'
import colors from '../../../colors'
import styles from './styles.less'

type JournalItemProps = {
	selected: boolean
	apiaryId: string | number
	data: any
	hiveId: string | number
	added: string
	id: number
}

export default function journalItem({
	selected = false,
	apiaryId,
	data,
	hiveId,
	added,
	id,
}: JournalItemProps) {
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
			<Link href={`/apiaries/${apiaryId}/hives/${hiveId}/inspections/${id}`}>
				<DateFormat datetime={added} />
				<div className={styles.journalItemStats}>
					<div
						style={{
							backgroundColor: colors.broodColor,
							height: stats.brood,
						}}
					></div>
					<div
						style={{
							backgroundColor: colors.honeyColor,
							height: stats.honey,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
				</div>
			</Link>
		</div>
	)
}
