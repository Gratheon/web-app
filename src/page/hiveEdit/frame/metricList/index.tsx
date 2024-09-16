import React, { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import debounce from 'lodash/debounce'

import colors from '@/colors.ts'
import T from '@/shared/translate'
import { gql, useMutation } from '@/api'

import ResourceEditRow from './resourceEditRow'

import { getFrameSideCells, updateFrameStat } from '@/models/frameSideCells.ts'

export default function MetricList({ frameSideId }) {
	let [frameSideCellsMutate, { error: errorFrameSideCells }] = useMutation(gql`
		mutation updateFrameSideCells($cells: FrameSideCellsInput!) {
			updateFrameSideCells(cells: $cells)
		}
	`)

	const onFrameSideStatChange = useMemo(
		() =>
			debounce(async function (key: string, percent: number) {
				let frameSide2 = await getFrameSideCells(frameSideId)
				frameSide2 = await updateFrameStat(frameSide2, key, percent)

				await frameSideCellsMutate({
					cells: {
						id: frameSide2.id,
						pollenPercent: frameSide2.pollenPercent,
						honeyPercent: frameSide2.honeyPercent,
						eggsPercent: frameSide2.eggsPercent,
						cappedBroodPercent: frameSide2.cappedBroodPercent,
						broodPercent: frameSide2.broodPercent,
					},
				})
			}, 300),
		[frameSideId]
	)

	let frameSideCells = useLiveQuery(
		function () {
			return getFrameSideCells(frameSideId)
		},
		[frameSideId],
		null
	)

	if (!frameSideCells) {
		return
	}

	let [expanded, expand] = useState(false)

	function onResize(key, value) {
		onFrameSideStatChange(key, Math.round(1 * value))
	}

	return (
		<div style="overflow: hidden; width:250px; align-content: flex-end;">
			<div
				style={{
					display: expanded ? 'block' : 'flex',
					borderRadius: '5px 5px 0px 0px',
					overflow: 'hidden',
				}}
			>
				<ResourceEditRow
					expanded={expanded}
					onClick={() => expand(!expanded)}
					color={colors.broodColor}
					percent={frameSideCells.broodPercent}
					onChange={(e) => onResize('broodPercent', e.target.value)}
				>
					<T>Brood</T>
				</ResourceEditRow>

				<ResourceEditRow
					expanded={expanded}
					onClick={() => expand(!expanded)}
					color={colors.cappedBroodColor}
					percent={frameSideCells.cappedBroodPercent}
					onChange={(e) => onResize('cappedBroodPercent', e.target.value)}
				>
					<T>Capped Brood</T>
				</ResourceEditRow>

				<ResourceEditRow
					expanded={expanded}
					onClick={() => expand(!expanded)}
					color={colors.eggsColor}
					percent={frameSideCells.eggsPercent}
					onChange={(e) => onResize('eggsPercent', e.target.value)}
				>
					<T>Eggs</T>
				</ResourceEditRow>

				<ResourceEditRow
					expanded={expanded}
					onClick={() => expand(!expanded)}
					color={colors.honeyColor}
					percent={frameSideCells.honeyPercent}
					onChange={(e) => onResize('honeyPercent', e.target.value)}
				>
					<T>Honey</T>
				</ResourceEditRow>

				<ResourceEditRow
					expanded={expanded}
					onClick={() => expand(!expanded)}
					color={colors.pollenColor}
					percent={frameSideCells.pollenPercent}
					onChange={(e) => onResize('pollenPercent', e.target.value)}
				>
					<T>Pollen</T>
				</ResourceEditRow>
			</div>
		</div>
	)
}
