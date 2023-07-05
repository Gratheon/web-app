import React, { useMemo, useState } from 'react'
import ResourceEditRow from '../resourceEditRow'
import colors from '@/components/colors'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'

const beeTypeMap = {
	'BEE_WORKER': 'Worker bees',
	'BEE_DRONE': 'Drones',
	'BEE_QUEEN': 'Queen',
}

export default function MetricList({
	frameSideFile,
	estimatedDetectionTimeSec,
	onFrameSideStatChange,
	frameSide
}) {
	if (estimatedDetectionTimeSec > 0) {
		return <div style="display:flex">
			<CountdownCircleTimer
				isPlaying
				size={30}
				strokeWidth={2}
				duration={estimatedDetectionTimeSec}
				colors={['#004777', '#F7B801', '#A30000', '#A30000']}
				colorsTime={[7, 5, 2, 0]}
				onComplete={() => { window.location.reload(); }}
			>
				{({ remainingTime }) => remainingTime}
			</CountdownCircleTimer>
			<div style="padding:5px">Estimated processing time</div>
		</div>
	}

	console.log({
		frameSideFile
	})

	let [expanded, expand] = useState(false)

	function onResize(key, value) {
		onFrameSideStatChange(key, Math.round(1 * value))
	}

	return <div>
		<div style={{ display: expanded ? 'block' : 'flex' }}>
			{frameSideFile.counts && frameSideFile.counts.map((row) => {
				<div title={beeTypeMap[row.type]} style={{ padding: '8px 5px' }}>🐝 {row.count}</div>

			})}
			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				title={'Brood'}
				color={colors.broodColor}
				percent={frameSide.broodPercent}
				onChange={(e) => onResize('broodPercent', e.target.value)}
			/>

			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				title={'Capped Brood'}
				color={colors.cappedBroodColor}
				percent={frameSide.cappedBroodPercent}
				onChange={(e) => onResize('cappedBroodPercent', e.target.value)}
			/>

			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				title={'Drone brood'}
				color={colors.droneBroodColor}
				percent={frameSide.droneBroodPercent}
				onChange={(e) => onResize('droneBroodPercent', e.target.value)}
			/>
			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				title={'Honey'}
				color={colors.honeyColor}
				percent={frameSide.honeyPercent}
				onChange={(e) => onResize('honeyPercent', e.target.value)}
			/>

			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				title={'Pollen'}
				color={colors.pollenColor}
				percent={frameSide.pollenPercent}
				onChange={(e) => onResize('pollenPercent', e.target.value)}
			/>
		</div>
	</div>
}