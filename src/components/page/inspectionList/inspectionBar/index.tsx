import DateFormat from '../../../shared/dateFormat'
import colors from '../../../colors'
import styles from './styles.less'
import { InspectionSnapshot } from '@/components/models/inspections'
import BeeCounter from '@/components/shared/beeCounter'
import { useNavigate } from 'react-router-dom'

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
				<DateFormat datetime={added} />
				<div className={styles.journalItemStats}>
					<div
						style={{
							backgroundColor: colors.broodColor,
							height: `${stats.broodPercent}%`,
						}}
					></div>
					<div
						style={{
							backgroundColor: colors.honeyColor,
							height: `${stats.honeyPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
					<div
						style={{
							backgroundColor: colors.pollenColor,
							height: `${stats.pollenPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
					<div
						style={{
							backgroundColor: colors.eggsColor,
							height: `${stats.eggsPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
					<div
						style={{
							backgroundColor: colors.cappedBroodColor,
							height: `${stats.cappedBroodPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					></div>
				</div>

				<BeeCounter count={tmpdata?.hive?.beeCount} />
			</div>
		</div>
	)
}
