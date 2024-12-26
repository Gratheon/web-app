import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'

import { getFrame, removeFrame } from '@/models/frames.ts'

import T from '@/shared/translate'
import Button from '@/shared/button'
import Loading from '@/shared/loader'
import ErrorMessage from '@/shared/messageError'
import DeleteIcon from '@/icons/deleteIcon.tsx'

import MetricList from './metricList'

import styles from './styles.module.less'
import FrameSide from './frameSide.tsx'
import BoxFrame from '../boxes/box/boxFrame'

export default function Frame({
	apiaryId,
	hiveId,
	boxId,
	frameId,
	frameSideId,

	box,
	extraButtons,
}) {
	if (!frameId) {
		return
	}

	let [frameRemoving, setFrameRemoving] = useState<boolean>(false)
	let frame = useLiveQuery(() => getFrame(+frameId), [frameId])

	if (frameRemoving) {
		return <Loading />
	}

	let { data, loading } = useQuery(
		gql`
			query Frame($frameId: ID!) {
				hiveFrame(id: $frameId) {
					__typename
					id

					rightSide {
						__typename
						id

						file {
							__typename
							id
							url

							resizes {
								__typename
								id
								file_id
								url
								max_dimension_px
							}
						}
					}

					leftSide {
						__typename
						id

						file {
							__typename
							id
							url

							resizes {
								__typename
								id
								file_id
								url
								max_dimension_px
							}
						}
					}
				}
			}
		`,
		{ variables: { frameId: frameId } }
	)

	if (loading) return <Loading />

	if (!frame) return null

	const navigate = useNavigate()

	let [removeFrameMutation, { error: errorFrameRemove }] =
		useMutation(`mutation deactivateFrame($id: ID!) {
		deactivateFrame(id: $id)
	}
	`)

	async function onFrameRemove() {
		if (confirm('Are you sure?')) {
			setFrameRemoving(true)
			await removeFrame(frameId, boxId)
			await removeFrameMutation({
				id: frameId,
			})

			setFrameRemoving(false)
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
				replace: true,
			})
		}
	}

	extraButtons = (
		<div style="display:flex; align-items:center; justify-content:space-between;">
			{extraButtons}

			<Button color="red" title="Remove frame" onClick={onFrameRemove}>
				<DeleteIcon />
				<span>
					<T>Remove frame</T>
				</span>
			</Button>
		</div>
	)

	const error = <ErrorMessage error={errorFrameRemove} />

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				{error}

				<div className={styles.frameHeader}>
					<h3>
						{frame.type === 'EMPTY_COMB' && (
							<T ctx="This is beehive frame with beecomb">Beecomb frame</T>
						)}
						{frame.type === 'FOUNDATION' && (
							<T ctx="This is empty beehive frame with a wax foundation">
								Foundation frame
							</T>
						)}
						{frame.type === 'FEEDER' && (
							<T ctx="This is a vertical sugar syrup container that goes into beehive in a size of a regular hive frame">
								Vertical feeder
							</T>
						)}
						{frame.type === 'PARTITION' && (
							<T ctx="This is a beehive frame of solid wood made to separate parts of the hive">
								Partition
							</T>
						)}
						{frame.type === 'VOID' && (
							<T ctx="This is a beehive frame without any wax">
								Frame without wax
							</T>
						)}
					</h3>

					{frame && (
						<BoxFrame
							box={box}
							frame={frame}
							apiaryId={apiaryId}
							hiveId={hiveId}
							frameId={frameId}
							frameSideId={frameSideId}
							editable={true}
							displayMode="visual"
						/>
					)}

					<div style="flex-grow:1"></div>
					<MetricList frameSideId={frameSideId} />	
				</div>

				<FrameSide
					hiveId={hiveId}
					frameId={frameId}
					frameSideId={frameSideId}
				/>

				{extraButtons}
			</div>
		</div>
	)
}
