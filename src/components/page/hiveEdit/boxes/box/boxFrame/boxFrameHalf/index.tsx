import React from 'react'

import styles from './index.less'
import { useNavigate } from 'react-router-dom'

import colors from '@/components/colors'

export default function BoxFrameHalf({ frameSide, className, href }) {
	let navigate = useNavigate()

	return (
		<div
			className={`${styles.frameSide} ${className}`}
			onClick={() => {
				navigate(href, { replace: true })
			}}
		>
			<div
				style={{
					height: `${
						frameSide?.cappedBroodPercent ? frameSide.cappedBroodPercent : 0
					}%`,
					backgroundColor: colors.cappedBroodColor,
				}}
				title="Capped brood"
			></div>

			<div
				style={{
					height: `${frameSide?.broodPercent ? frameSide.broodPercent : 0}%`,
					backgroundColor: colors.broodColor,
				}}
				title="Brood"
			></div>

			<div
				style={{
					height: `${
						frameSide?.droneBroodPercent ? frameSide.droneBroodPercent : 0
					}%`,
					backgroundColor: colors.droneBroodColor,
				}}
				title="Drone brood"
			></div>

			<div
				style={{
					height: `${frameSide?.pollenPercent ? frameSide.pollenPercent : 0}%`,
					backgroundColor: colors.pollenColor,
				}}
				title="Pollen"
			></div>

			<div
				style={{
					height: `${frameSide?.honeyPercent ? frameSide.honeyPercent : 0}%`,
					backgroundColor: colors.honeyColor,
					// backgroundImage: "url('/assets/cell.png')",
					backgroundSize: '3px 4px',
				}}
				title="Capped honey"
			></div>

			<div style={{ flexGrow: 1 }} />
		</div>
	)
}
