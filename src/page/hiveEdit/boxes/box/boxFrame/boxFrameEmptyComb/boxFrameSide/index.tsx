import colors from '@/colors.ts'
import QueenIcon from '@/icons/queenIcon.tsx'
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

	return (
		<div
			className={`${styles.frameSide} ${className}`}
			onClick={onFrameSideClick}
		>
			{frameSide.isQueenConfirmed && (
				<QueenIcon className={styles.crown} size={16} />
			)}

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
						frameSide.cells?.droneBroodPercent ? frameSide.cells.droneBroodPercent : 0
					}%`,
					backgroundColor: colors.droneBroodColor,
				}}
				title="Drone brood"
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
				title="Honey"
			></div>

			<div style={{ flexGrow: 1 }} />
		</div>
	)
}
