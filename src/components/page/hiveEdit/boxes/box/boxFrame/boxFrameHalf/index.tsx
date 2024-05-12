import React from 'react'

import styles from './index.less'

import colors from '@/components/colors'
import QueenIcon from '@/components/icons/queenIcon'
import { getFrameSideFile } from '@/components/models/frameSideFile'
import { useLiveQuery } from 'dexie-react-hooks'

export default function BoxFrameHalf({ frameSide, className, onFrameSideClick }) {
	if(!frameSide) return;

	const frameSideFile = useLiveQuery(async() => {
		let tmp = await getFrameSideFile({frameSideId: frameSide.id })
		return tmp
	}, [frameSide.id]);

	return (
		<div
			className={`${styles.frameSide} ${className}`}
			onClick={onFrameSideClick}
		>

			{frameSideFile?.queenDetected &&
				<QueenIcon className={styles.crown} size={16}/>
			}

			<div
				style={{
					height: `${frameSide.cells?.cappedBroodPercent ? frameSide.cells.cappedBroodPercent : 0
						}%`,
					backgroundColor: colors.cappedBroodColor,
				}}
				title="Capped brood"
			></div>

			<div
				style={{
					height: `${frameSide.cells?.broodPercent ? frameSide.cells.broodPercent : 0}%`,
					backgroundColor: colors.broodColor,
				}}
				title="Brood"
			></div>

			<div
				style={{
					height: `${frameSide.cells?.eggsPercent ? frameSide.cells.eggsPercent : 0
						}%`,
					backgroundColor: colors.eggsColor,
				}}
				title="Eggs"
			></div>

			<div
				style={{
					height: `${frameSide.cells?.pollenPercent ? frameSide.cells.pollenPercent : 0}%`,
					backgroundColor: colors.pollenColor,
				}}
				title="Pollen"
			></div>

			<div
				style={{
					height: `${frameSide.cells?.honeyPercent ? frameSide.cells.honeyPercent : 0}%`,
					backgroundColor: colors.honeyColor,
					backgroundSize: '3px 4px',
				}}
				title="Capped honey"
			></div>

			<div style={{ flexGrow: 1 }} />
		</div>
	)
}
