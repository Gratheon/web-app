import { useNavigate } from 'react-router-dom'

import colors from '../../../colors.ts';
import DateFormat from '../../../shared/dateFormat'
import { InspectionSnapshot } from '../../../models/inspections.ts'
import BeeCounter from '../../../shared/beeCounter'

import styles from './styles.module.less'

type InspectionBarProps = {
	selected: boolean
	apiaryId: string | number
	data: any
	hiveId: string | number
	added: string
	id: number
}

export default function InspectionBar({
	selected = false,
	apiaryId,
	data,
	hiveId,
	added,
	id,
}: InspectionBarProps) {
	let navigate = useNavigate()
	let tmpdata: InspectionSnapshot = JSON.parse(data)
	let stats = tmpdata.cellStats

	stats.broodPercent = Math.round(stats?.broodPercent)
	stats.honeyPercent = Math.round(stats?.honeyPercent)
	stats.pollenPercent = Math.round(stats?.pollenPercent)
	return (
		<div
			className={`${styles.inspectionBar} ${selected ? styles.selected : ''
				}`}
		>
			<div className={styles.bottle}
				onClick={() => {
					navigate(`/apiaries/${apiaryId}/hives/${hiveId}/inspections/${id}`, { replace: true })
				}}>

				<div style="display:flex;">
					<DateFormat datetime={added} style="flex-grow:1" />

					<BeeCounter count={tmpdata?.hive?.beeCount} />
				</div>

				<div className={styles.journalItemStats}>
					<div
						title={`Brood: ${stats.broodPercent}%`}
						style={{
							backgroundColor: colors.broodColor,
							width: `${stats.broodPercent}%`,
						}}
					></div>
					<div
						title={`Honey: ${stats.honeyPercent}%`}
						style={{
							backgroundColor: colors.honeyColor,
							width: `${stats.honeyPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
					<div
						title={`Pollen: ${stats.pollenPercent}%`}
						style={{
							backgroundColor: colors.pollenColor,
							width: `${stats.pollenPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
					<div
						title={`Eggs: ${stats.eggsPercent}%`}
						style={{
							backgroundColor: colors.eggsColor,
							width: `${stats.eggsPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
					<div
						title={`Capped brood: ${stats.cappedBroodPercent}%`}
						style={{
							backgroundColor: colors.cappedBroodColor,
							width: `${stats.cappedBroodPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
				</div>

			</div>
		</div>
	)
}
