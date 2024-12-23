import { useLiveQuery } from 'dexie-react-hooks'

import colors from '@/colors.ts'
import QueenIcon from '@/icons/queenIcon.tsx'
import { getFrameSideFile } from '@/models/frameSideFile'
import { FrameSide } from '@/models/frameSide'

import styles from './index.module.less'

export default function BoxFrameSide({
	frameSide,
	className,
	onFrameSideClick,
}: {
	frameSide: FrameSide
	className: string
	onFrameSideClick: () => void
}) {
	if (!frameSide) return

	const frameSideFile = useLiveQuery(async () => {
		let tmp = await getFrameSideFile({ frameSideId: frameSide.id })
		return tmp
	}, [frameSide.id])
	return (
		<div
			className={`${styles.frameSide} ${className}`}
			onClick={onFrameSideClick}
		>
			{frameSideFile?.queenDetected && (
				<QueenIcon className={styles.crown} size={16} />
			)}
			<div
				style={{
					height: `${
						frameSide.cells?.cappedBroodPercent
							? frameSide.cells.cappedBroodPercent
							: 0
					}%`,
					backgroundColor: colors.cappedBroodColor,
				}}
				title="Capped brood"
			></div>
			<div
				style={{
					height: `${
						frameSide.cells?.broodPercent ? frameSide.cells.broodPercent : 0
					}%`,
					backgroundColor: colors.broodColor,
				}}
				title="Brood"
			></div>
			<div
				style={{
					height: `${
						frameSide.cells?.eggsPercent ? frameSide.cells.eggsPercent : 0
					}%`,
					backgroundColor: colors.eggsColor,
				}}
				title="Eggs"
			></div>
			<div
				style={{
					height: `${
						frameSide.cells?.pollenPercent ? frameSide.cells.pollenPercent : 0
					}%`,
					backgroundColor: colors.pollenColor,
				}}
				title="Pollen"
			></div>
			<div
				style={{
					height: `${
						frameSide.cells?.honeyPercent ? frameSide.cells.honeyPercent : 0
					}%`,
					backgroundColor: colors.honeyColor,
					backgroundSize: '3px 4px',
				}}
				title="Capped honey"
			></div>
			<div style={{ flexGrow: 1 }} />
		</div>
	)
}
