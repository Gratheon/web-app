import React from 'react'

import styles from './index.less'
import { useNavigate } from 'react-router-dom'

import colors from '@/components/colors'
import QueenIcon from '@/icons/queenIcon'
import { getFrameSideFile } from '@/components/models/frameSideFile'
import { useLiveQuery } from 'dexie-react-hooks'

export default function BoxFrameHalf({ frameSide, className, href }) {
	let navigate = useNavigate()

	const frameSideFile = useLiveQuery(async() => {
		let tmp = await getFrameSideFile({frameSideId: frameSide.id })
		return tmp
	}, [frameSide.id]);

	return (
		<div
			className={`${styles.frameSide} ${className}`}
			onClick={() => {
				navigate(href, { replace: true })
			}}
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
