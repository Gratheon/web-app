import React, { useState, useEffect } from 'react' // Import useEffect
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import { gql, useMutation, useQuery, useSubscription } from '@/api'

import { getFrame, removeFrame } from '@/models/frames.ts'
// Import the FrameSide type specifically
import { FrameSide as FrameSideType, getFrameSide, upsertFrameSide } from '@/models/frameSide.ts'

import T from '@/shared/translate'
import Button from '@/shared/button'
import Loading from '@/shared/loader'
import ErrorMessage from '@/shared/messageError'
import DeleteIcon from '@/icons/deleteIcon.tsx'
import QueenIcon from '@/icons/queenIcon.tsx'
import Checkbox from '@/icons/checkbox.tsx'

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
	// Local state for the queen checkbox
	const [isQueenChecked, setIsQueenChecked] = useState<boolean | undefined>(undefined);
	let frame = useLiveQuery(() => getFrame(+frameId), [frameId])
	let frameSide = useLiveQuery(() => getFrameSide(+frameSideId), [frameSideId])

	// Effect to sync local state with fetched data
	useEffect(() => {
		setIsQueenChecked(frameSide?.isQueenConfirmed);
	}, [frameSide]);

	// Add subscription for queen confirmation updates
	useSubscription(
		gql`
			subscription onQueenConfirmationUpdated($frameSideId: String) {
				onQueenConfirmationUpdated(frameSideId: $frameSideId) {
					frameSideId
					isQueenConfirmed
				}
			}
		`,
		{ frameSideId }, // Pass frameSideId as variable
		(_, response) => {
			if (response?.onQueenConfirmationUpdated && frameSide) {
				const update = response.onQueenConfirmationUpdated;
				// Update the frameSide object in IndexedDB
				// Ensure we have the existing frameSide data to merge with
				const currentFrameSideData = { ...frameSide };
				const newState: FrameSideType = {
					...currentFrameSideData,
					id: +update.frameSideId, // Ensure ID is number if needed by upsert
					isQueenConfirmed: update.isQueenConfirmed,
				};
				console.log('onQueenConfirmationUpdated: Updating IndexedDB frameSide:', newState);
				upsertFrameSide(newState); // Update IndexedDB, useLiveQuery will pick it up
			}
		}
	);


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
						frameId

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
						frameId

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

	// Queen confirmation button logic moved from QueenButton component
	let [confirmQueen, { error: errorConfirmQueen }] = useMutation(gql`mutation confirmFrameSideQueen($frameSideId: ID!, $isConfirmed: Boolean!) {
		confirmFrameSideQueen(frameSideId: $frameSideId, isConfirmed: $isConfirmed) {
			id
			isQueenConfirmed
			frameId
		}
	}`)

	async function onQueenToggle() {
		// Use frameSideId from props as the reliable source of truth for the ID
		if (!frameSideId) {
			console.error('FrameSide ID from props is missing.')
			return
		}

		// Determine the original state safely, defaulting to false if frameSide is missing
		const originalState = frameSide?.isQueenConfirmed ?? false;
		const newState = !originalState;

		// Optimistic UI update
		setIsQueenChecked(newState);
		console.log(`Calling confirmQueen with frameSideId: ${String(frameSideId)}, isConfirmed: ${newState}`); // Updated logging

		try {
			// Try passing variables directly as the first argument
			const result = await confirmQueen({
				frameSideId: String(frameSideId), // Ensure ID is a string
				isConfirmed: newState,
			})

			if (result?.data?.confirmFrameSideQueen) {
				const confirmedData = result.data.confirmFrameSideQueen;
				const dataToUpsert: FrameSideType = {
					...(frameSide && +frameSide.id === +confirmedData.id ? frameSide : {}),
					id: +confirmedData.id,
					isQueenConfirmed: confirmedData.isQueenConfirmed,
					frameId: +confirmedData.frameId,
				};
				if (dataToUpsert.frameId != null) {
					await upsertFrameSide(dataToUpsert);
				} else {
					console.error("Cannot upsert FrameSide after mutation: frameId missing in response.", confirmedData);
					setIsQueenChecked(originalState);
				}
			} else {
				// Revert optimistic update if mutation response is unexpected
				setIsQueenChecked(originalState);
				console.error('Unexpected response from confirmQueen mutation:', result);
			}
		} catch (error) {
			// Revert optimistic update on error
			setIsQueenChecked(originalState);
			// Error is already handled by the useMutation hook's error state
			console.error('Failed to confirm queen presence:', error);
		}
	}
	// End Queen confirmation button logic

	extraButtons = (
		<div style="display:flex; align-items:center; justify-content:space-between;">
			{extraButtons}
		</div>
	)

	const error = <ErrorMessage error={errorFrameRemove || errorConfirmQueen} />

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				{error}

				<div className={styles.frameHeader}>
					<div>
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
					</div>


					<div>
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
						<MetricList frameSideId={frameSideId} />
					</div>
					<div>
						{/* Render button if frameSideId exists */}
						{frameSideId && (
							<Button title="Mark queen presence" onClick={onQueenToggle}>
								{/* Default Checkbox 'on' to false if isQueenChecked is undefined/null */}
								<Checkbox on={!!isQueenChecked} />
								<span><T ctx="this is a button that marks if a queen bee is present on this frame side">Queen Present</T></span>
								<QueenIcon size={14} color={'white'} />
							</Button>
						)}

						<Button color="red" title="Remove frame" onClick={onFrameRemove}>
							<DeleteIcon />
							<span>
								<T>Remove frame</T>
							</span>
						</Button>
					</div>
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
