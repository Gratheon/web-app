import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import { useMutation } from '@/api'

import { getFrame, removeFrame } from '@/models/frames.ts'

import T from '@/shared/translate'
import Button from '@/shared/button'
import Loading from '@/shared/loader'
import ErrorMessage from '@/shared/messageError'
import DeleteIcon from '@/icons/deleteIcon.tsx'
import FreeDrawIcon from '@/icons/freeDrawIcon.tsx'

import MetricList from './metricList'

import styles from './styles.module.less'
import FrameSide from './frameSide.tsx'
import BoxFrame from '../boxes/box/boxFrame'
import Modal from '@/shared/modal'
import { useWarehouseAutoAdjust } from '@/hooks/useWarehouseAutoAdjust'
import { addHiveLog, hiveLogActions } from '@/models/hiveLog'

export default function Frame({
	apiaryId,
	hiveId,
	boxId,
	frameId,
	frameSideId,

	box,
	extraButtons,
	openRemoveDialogSignal = 0,
	onRemoveDialogSignalConsumed = () => {},
}) {
	if (!frameId) {
		return
	}

	let [frameRemoving, setFrameRemoving] = useState<boolean>(false)
	const [removeFrameDialogVisible, setRemoveFrameDialogVisible] = useState(false)
	const { increaseWarehouseForFrameByFrameId } = useWarehouseAutoAdjust()
	const [isIpadMode, setIsIpadMode] = useState(false)
	// Model functions now handle invalid IDs
	let frame = useLiveQuery(() => getFrame(+frameId), [frameId]);

	useEffect(() => {
		const detectIpadMode = () => {
			const isTabletViewport = window.matchMedia('(max-width: 1200px)').matches
			setIsIpadMode(isTabletViewport)
		}

		detectIpadMode()
		window.addEventListener('resize', detectIpadMode)
		return () => {
			window.removeEventListener('resize', detectIpadMode)
		}
	}, [])

	// Removed subscription for queen confirmation updates


	if (frameRemoving) {
		return <Loading />
	}

	if (!frame) return null

	const navigate = useNavigate()

	let [removeFrameMutation, { error: errorFrameRemove }] =
		useMutation(`mutation deactivateFrame($id: ID!) {
		deactivateFrame(id: $id)
	}
	`)

	useEffect(() => {
		if (!removeFrameDialogVisible) return

		const onKeyDown = async (event: KeyboardEvent) => {
			if (frameRemoving) return

			if (event.key === 'Escape') {
				event.preventDefault()
				event.stopPropagation()
				setRemoveFrameDialogVisible(false)
				return
			}

			if (event.key === 'Enter') {
				event.preventDefault()
				event.stopPropagation()
				await onFrameRemoveChoice('warehouse')
			}
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => {
			document.removeEventListener('keydown', onKeyDown, true)
		}
	}, [removeFrameDialogVisible, frameRemoving])

	useEffect(() => {
		if (!openRemoveDialogSignal) return
		if (!frameId || frameRemoving || removeFrameDialogVisible) return
		setRemoveFrameDialogVisible(true)
		onRemoveDialogSignalConsumed()
	}, [
		openRemoveDialogSignal,
		frameId,
		frameRemoving,
		removeFrameDialogVisible,
		onRemoveDialogSignalConsumed,
	])

	async function onFrameRemoveChoice(mode: 'trash' | 'warehouse') {
		setRemoveFrameDialogVisible(false)
		setFrameRemoving(true)

		if (mode === 'warehouse') {
			await increaseWarehouseForFrameByFrameId(frameId)
		}

		await removeFrame(frameId, boxId)
		await removeFrameMutation({
			id: frameId,
		})
		await addHiveLog({
			hiveId: +hiveId,
			action: hiveLogActions.STRUCTURE_REMOVE,
			title: 'Frame removed',
			details: `Removed frame #${frameId} from section #${boxId}.`,
		})

		setFrameRemoving(false)
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
			replace: true,
		})
	}

	extraButtons = (
		<div style="display:flex; align-items:center; justify-content:space-between;">
			{extraButtons}
		</div>
	)

	const error = <ErrorMessage error={errorFrameRemove} />
	const frameTypeTitle = (
		<>
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
		</>
	)

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				{error}

				<div className={styles.frameHeader}>
					<h3 className={styles.frameTypeTitle}>{frameTypeTitle}</h3>
					<div className={styles.frameHeaderControls}>
						<div className={styles.frameHeaderLeft}>
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

						<div className={styles.frameHeaderMiddle}>
							<MetricList frameSideId={frameSideId} />
						</div>
						<div className={styles.frameHeaderRight}>
						{frameSideId && (
							<Button
								iconOnly={isIpadMode}
								title="Edit canvas"
								onClick={() =>
									navigate(
										`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}/frame/${frameId}/${frameSideId}/canvas-edit`
									)
								}
							>
								<FreeDrawIcon size={14} />
								{!isIpadMode && (
									<span>
										<T>Edit canvas</T>
									</span>
								)}
							</Button>
						)}

					<Button
						color="red"
						title="Remove frame"
						iconOnly={isIpadMode}
						onClick={() => setRemoveFrameDialogVisible(true)}
					>
						<DeleteIcon />
						{!isIpadMode && (
							<span>
								<T>Remove frame</T>
							</span>
						)}
					</Button>
						</div>
					</div>
				</div>

				<FrameSide
					hiveId={hiveId}
					boxId={boxId}
					frameId={frameId}
					frameSideId={frameSideId}
					allowDrawing={false}
				/>

				{extraButtons}
			</div>
			{removeFrameDialogVisible && (
				<Modal
					title={<T>Remove frame</T>}
					onClose={() => setRemoveFrameDialogVisible(false)}
				>
					<div style={{ marginBottom: '12px' }}>
						<T>Are you sure you want to remove this frame?</T>
					</div>
					<div className={styles.removeFrameActions}>
						<div className={styles.actionWithHint}>
							<Button color="gray" onClick={() => setRemoveFrameDialogVisible(false)}>
								<T>Cancel</T>
							</Button>
							<div className={styles.keyHint}>Esc</div>
						</div>
						<div className={styles.actionWithHint}>
							<Button color="red" onClick={async () => await onFrameRemoveChoice('trash')}>
								<T>To trash</T>
							</Button>
						</div>
						<div className={styles.actionWithHint}>
							<Button color="green" onClick={async () => await onFrameRemoveChoice('warehouse')}>
								<T>To warehouse</T>
							</Button>
							<div className={styles.keyHint}>Enter</div>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
