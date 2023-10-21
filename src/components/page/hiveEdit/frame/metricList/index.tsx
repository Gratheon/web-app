import React, { useMemo, useState } from 'react'
import ResourceEditRow from './resourceEditRow'
import colors from '@/components/colors'
import T from '@/components/shared/translate'
import { getFrameSideCells } from '@/components/models/frameSideCells'
import { useLiveQuery } from 'dexie-react-hooks'

export default function MetricList({
	onFrameSideStatChange,
	frameSideId
}) {
	let frameSideCells = useLiveQuery(function () {
		return getFrameSideCells(+frameSideId)
	}, [frameSideId], null);

	if(!frameSideCells){
		return
	}

	let [expanded, expand] = useState(false)

	function onResize(key, value) {
		onFrameSideStatChange(key, Math.round(1 * value))
	}

	return <div>
		<div style={{ display: expanded ? 'block' : 'flex' }}>
			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				color={colors.broodColor}
				percent={frameSideCells.broodPercent}
				onChange={(e) => onResize('broodPercent', e.target.value)}
			><T>Brood</T></ResourceEditRow>

			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				color={colors.cappedBroodColor}
				percent={frameSideCells.cappedBroodPercent}
				onChange={(e) => onResize('cappedBroodPercent', e.target.value)}
			><T>Capped Brood</T></ResourceEditRow>

			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				color={colors.eggsColor}
				percent={frameSideCells.eggsPercent}
				onChange={(e) => onResize('eggsPercent', e.target.value)}
			><T>Eggs</T></ResourceEditRow>
			
			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				color={colors.honeyColor}
				percent={frameSideCells.honeyPercent}
				onChange={(e) => onResize('honeyPercent', e.target.value)}
			><T>Honey</T></ResourceEditRow>

			<ResourceEditRow
				expanded={expanded}
				onClick={() => expand(!expanded)}
				color={colors.pollenColor}
				percent={frameSideCells.pollenPercent}
				onChange={(e) => onResize('pollenPercent', e.target.value)}
			><T>Pollen</T></ResourceEditRow>
		</div>
	</div>
}