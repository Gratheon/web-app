import { useEffect, useMemo, useState } from 'preact/hooks'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import T from '@/shared/translate'
import { useMutation, useQuery } from '@/api'
import Loader from '@/shared/loader'
import { InspectionSnapshot } from '@/models/inspections'
import MessageSuccess from '@/shared/messageSuccess'

import { updateHive, getHive, isCollapsed, isEditable } from '@/models/hive'
import { getUser } from '@/models/user'
import { getBoxes } from '@/models/boxes'
import { getFamilyByHive, getAllFamiliesByHive } from '@/models/family'
import {
	getHiveInspectionStats,
	deleteCellsByFrameSideIDs,
} from '@/models/frameSideCells'
import { getFramesByHive } from '@/models/frames'
import { collectFrameSideIDsFromFrames } from '@/models/frameSide'
import { deleteFilesByFrameSideIDs } from '@/models/frameSideFile'

import HiveTopEditForm from '@/page/hiveEdit/hiveTopInfo/hiveTopEditForm'
import CollapseHiveModal from '@/page/hiveEdit/CollapseHiveModal'
import SplitHiveModal from '@/page/hiveEdit/SplitHiveModal'
import JoinColonyModal from '@/page/hiveEdit/JoinColonyModal'
import { isBillingTierLessThan } from '@/shared/billingTier'
import { addHiveLog, hiveLogActions } from '@/models/hiveLog'
import { apiaryTypes, normalizeApiaryType } from '@/models/apiary'

import {
	BOX_SYSTEM_COLORS,
	BOX_SYSTEMS_FOR_HIVE_LABEL_QUERY,
} from './constants'
import {
	getSuggestedInspectionDate,
	toDateInputValue,
	toStartOfDayIso,
} from './inspectionDates'
import {
	downloadHiveQrSticker,
	generateHiveQrStickerDataUrl,
} from './qrSticker'
import HiveActionButtons from './HiveActionButtons'
import HiveCreatedAnimation, {
	useHiveCreatedAnimation,
} from './HiveCreatedAnimation'
import HiveInspectionModal from './HiveInspectionModal'
import HiveQrStickerModal from './HiveQrStickerModal'
import HiveReadOnlyView from './HiveReadOnlyView'

export default function HiveEditDetails({
	apiaryId,
	hiveId,
	apiaryType,
	onTopMessageChange,
	celebrateHiveCreated,
}) {
	const [editable] = useState(false)
	let [creatingInspection, setCreatingInspection] = useState(false)
	let [okMsg, setOkMsg] = useState(null)
	const [inspectionModalVisible, setInspectionModalVisible] = useState(false)
	const [inspectionDate, setInspectionDate] = useState(
		toDateInputValue(new Date())
	)
	let [showCollapseSuccess, setShowCollapseSuccess] = useState(false)
	const [showQRModal, setShowQRModal] = useState(false)
	const [qrStickerDataUrl, setQrStickerDataUrl] = useState<string | null>(null)
	const [isGeneratingQR, setIsGeneratingQR] = useState(false)
	let navigate = useNavigate()
	const [showCollapseModal, setShowCollapseModal] = useState(false)
	const [splitModalOpen, setSplitModalOpen] = useState(false)
	const [joinModalOpen, setJoinModalOpen] = useState(false)
	const {
		showHiveCreatedAnimation,
		hiveCreatedIconRef,
		hiveCreatedBeeRefs,
		speedUpHiveCreatedAnimation,
	} = useHiveCreatedAnimation(celebrateHiveCreated)

	// Model functions now handle invalid IDs
	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId])
	const { data: boxSystemsData } = useQuery(BOX_SYSTEMS_FOR_HIVE_LABEL_QUERY)
	const user = useLiveQuery(() => getUser(), [], null)
	const isHiveMiniMapLocked = isBillingTierLessThan(
		user?.billingPlan,
		'hobbyist'
	)
	const isMobileApiary = normalizeApiaryType(apiaryType) === apiaryTypes.MOBILE
	let boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId])
	let families = useLiveQuery(() => {
		return getAllFamiliesByHive(+hiveId)
	}, [hiveId])

	if (!families) {
		families = []
	}

	const allHiveFrames = useLiveQuery(
		async () => {
			if (!hiveId) return []
			const boxes = await getBoxes({ hiveId: +hiveId })
			if (!boxes) return []
			const allFrames = []
			for (const b of boxes) {
				const { getFrames } = await import('@/models/frames')
				const boxFrames = await getFrames({ boxId: b.id })
				if (boxFrames) {
					const framesWithBoxId = boxFrames.map((f) => ({
						...f,
						boxId: b.id,
					}))
					allFrames.push(...framesWithBoxId)
				}
			}
			return allFrames
		},
		[hiveId],
		[]
	)

	useEffect(() => {
		const isTypingTarget = (target) => {
			if (!target) return false
			const tagName = String(target.tagName || '').toLowerCase()
			return (
				target.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			)
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return
			if (event.altKey) return
			if (isTypingTarget(event.target)) return
			const key = String(event.key || '').toLowerCase()
			if (!(event.ctrlKey || event.metaKey) || key !== 'e') return
			if (!hive || !isEditable(hive) || isCollapsed(hive)) return

			event.preventDefault()
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/edit`, {
				replace: true,
			})
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => {
			document.removeEventListener('keydown', onKeyDown, true)
		}
	}, [apiaryId, hive, hiveId, navigate])

	let [mutateInspection, { error: errorInspection }] =
		useMutation(`	mutation addInspection($inspection: InspectionInput!) {
		addInspection(inspection: $inspection) {
			id
		}
	}`)
	let [cloneFramesForInspection, { error: errorInspection2 }] =
		useMutation(`mutation cloneFramesForInspection($frameSideIDs: [ID], $inspectionId: ID!) {
		cloneFramesForInspection(frameSideIDs: $frameSideIDs, inspectionId: $inspectionId)
	}`)

	function goToHiveView(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, {
			replace: true,
		})
	}

	async function openInspectionModal() {
		const frames = await getFramesByHive(+hiveId)
		const frameSideIDs = collectFrameSideIDsFromFrames(frames)
		setInspectionDate(await getSuggestedInspectionDate(frameSideIDs))
		setInspectionModalVisible(true)
	}

	const onCreateInspection = useMemo(
		() =>
			debounce(async function (dateValue: string) {
				setCreatingInspection(true)
				setInspectionModalVisible(false)

				try {
					let hive = await getHive(+hiveId)
					let boxes = await getBoxes({ hiveId: +hiveId })
					let family = await getFamilyByHive(+hiveId)
					let frames = await getFramesByHive(+hiveId)
					let frameSideIDs = collectFrameSideIDsFromFrames(frames)
					let cellStats = await getHiveInspectionStats(frames)

					let inspectionSnapshot: InspectionSnapshot = {
						hive,
						family,
						boxes,
						frames,
						cellStats,
					}
					const inspectionAdded = toStartOfDayIso(dateValue)

					let createdInspection = await mutateInspection({
						inspection: {
							hiveId: +hiveId,
							data: JSON.stringify(inspectionSnapshot),
							added: inspectionAdded,
						},
					})
					const inspectionId = createdInspection?.data?.addInspection?.id
					if (!inspectionId) {
						throw new Error('Inspection was not created.')
					}

					await cloneFramesForInspection({
						inspectionId,
						frameSideIDs,
					})
					await addHiveLog({
						hiveId: +hiveId,
						action: hiveLogActions.INSPECTION,
						title: 'Inspection created',
						details: `Inspection #${inspectionId} captured for ${dateValue}.`,
						dedupeKey: `inspection:${inspectionId}`,
					})

					deleteCellsByFrameSideIDs(frameSideIDs)
					deleteFilesByFrameSideIDs(frameSideIDs)

					hive.inspectionCount = (hive.inspectionCount || 0) + 1
					updateHive(hive)

					setOkMsg(
						<MessageSuccess
							title={<T>Inspection created</T>}
							message={
								<>
									<T>All frame statistics is reset for the new state</T>.
									<T>Try sharing the inspection with others</T>!
								</>
							}
						/>
					)
				} catch (error) {
					console.error('Failed to complete inspection', error)
				} finally {
					setCreatingInspection(false)
				}
			}, 1000),
		[hiveId]
	)

	useEffect(() => {
		if (typeof onTopMessageChange !== 'function') return

		if (okMsg) {
			onTopMessageChange(okMsg)
			return
		}

		if (showCollapseSuccess) {
			onTopMessageChange(
				<MessageSuccess
					title={<T>Sorry for your loss</T>}
					message={<T>This hive is now marked as collapsed.</T>}
				/>
			)
			return
		}

		onTopMessageChange(null)
	}, [okMsg, onTopMessageChange, showCollapseSuccess])

	useEffect(() => {
		return () => {
			if (typeof onTopMessageChange === 'function') {
				onTopMessageChange(null)
			}
		}
	}, [onTopMessageChange])

	if (!hive) {
		return <Loader />
	}

	const boxSystems = boxSystemsData?.boxSystems || []
	const hiveBoxSystemId = hive.boxSystemId ?? hive.box_system_id
	const selectedBoxSystem = boxSystems.find(
		(system: any) => String(system.id) === String(hiveBoxSystemId)
	)
	const defaultBoxSystem =
		boxSystems.find((system: any) => system.isDefault) || boxSystems[0]
	const isHorizontalHive = boxes?.some(
		(box: any) => box.type === 'LARGE_HORIZONTAL_SECTION'
	)
	const displayedBoxSystem = isHorizontalHive
		? null
		: selectedBoxSystem || defaultBoxSystem || null
	const displayedBoxSystemColor = displayedBoxSystem
		? BOX_SYSTEM_COLORS[
				Math.max(
					boxSystems.findIndex(
						(system: any) => String(system.id) === String(displayedBoxSystem.id)
					),
					0
				) % BOX_SYSTEM_COLORS.length
		  ]
		: '#6b7280'

	const goToHiveEdit = () =>
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/edit`)
	const openSplitModal = () => setSplitModalOpen(true)
	const openJoinModal = () => setJoinModalOpen(true)
	const openCollapseModal = () => setShowCollapseModal(true)

	let buttons = (
		<HiveActionButtons
			hive={hive}
			apiaryId={apiaryId}
			hiveId={hiveId}
			editable={editable}
			creatingInspection={creatingInspection}
			onCreateInspectionClick={openInspectionModal}
			onEditClick={goToHiveEdit}
			onSplitClick={openSplitModal}
			onJoinClick={openJoinModal}
			onCollapseClick={openCollapseModal}
		/>
	)

	let buttonsDesktop = (
		<HiveActionButtons
			hive={hive}
			apiaryId={apiaryId}
			hiveId={hiveId}
			editable={editable}
			creatingInspection={creatingInspection}
			variant="desktop"
			onCreateInspectionClick={openInspectionModal}
			onEditClick={goToHiveEdit}
			onSplitClick={openSplitModal}
			onJoinClick={openJoinModal}
			onCollapseClick={openCollapseModal}
		/>
	)

	function navigateToQueenLastSeen(family) {
		if (!family.lastSeenFrameId || !family.lastSeenFrameSideId) {
			return
		}
		const fallbackFrame = (allHiveFrames || []).find(
			(frame) => Number(frame?.id) === Number(family.lastSeenFrameId)
		)
		const targetBoxId = family.lastSeenBoxId || fallbackFrame?.boxId
		if (!targetBoxId) return
		navigate(
			`/apiaries/${apiaryId}/hives/${hiveId}/box/${targetBoxId}/frame/${family.lastSeenFrameId}/${family.lastSeenFrameSideId}`
		)
	}

	async function onGenerateQR() {
		try {
			setShowQRModal(true)
			setIsGeneratingQR(true)
			setQrStickerDataUrl(null)

			const url = window.location.href
			const qrDataURL = await generateHiveQrStickerDataUrl(url)
			setQrStickerDataUrl(qrDataURL)
			console.debug(
				`Generated QR sticker with logo for hive ${hiveId} with URL: ${url}`
			)
		} catch (err) {
			console.error('Failed to generate QR code', err)
		} finally {
			setIsGeneratingQR(false)
		}
	}

	function downloadQrSticker() {
		if (!qrStickerDataUrl) return
		downloadHiveQrSticker(qrStickerDataUrl, hiveId)
	}

	if (!editable) {
		return (
			<>
				<HiveReadOnlyView
					hive={hive}
					boxes={boxes}
					families={families}
					apiaryId={apiaryId}
					hiveId={hiveId}
					buttons={buttons}
					buttonsDesktop={buttonsDesktop}
					displayedBoxSystem={displayedBoxSystem}
					displayedBoxSystemColor={displayedBoxSystemColor}
					isHorizontalHive={isHorizontalHive}
					isHiveMiniMapLocked={isHiveMiniMapLocked}
					isMobileApiary={isMobileApiary}
					hiveCreatedIconRef={hiveCreatedIconRef}
					onGoToHiveView={goToHiveView}
					onGenerateQR={onGenerateQR}
					onNavigateToQueenLastSeen={navigateToQueenLastSeen}
					onEmptyQueenSlotClick={goToHiveEdit}
				/>

				<HiveCreatedAnimation
					visible={showHiveCreatedAnimation}
					beeRefs={hiveCreatedBeeRefs}
					onSpeedUp={speedUpHiveCreatedAnimation}
				/>

				{inspectionModalVisible && (
					<HiveInspectionModal
						inspectionDate={inspectionDate}
						creatingInspection={creatingInspection}
						onCancel={() => setInspectionModalVisible(false)}
						onConfirm={onCreateInspection}
						onInspectionDateChange={setInspectionDate}
					/>
				)}

				{showCollapseModal && (
					<CollapseHiveModal
						hiveId={hiveId}
						onClose={() => setShowCollapseModal(false)}
						onSuccess={() => {
							setShowCollapseModal(false)
							setShowCollapseSuccess(true)
						}}
					/>
				)}

				<SplitHiveModal
					isOpen={splitModalOpen}
					onClose={() => setSplitModalOpen(false)}
					hiveId={hiveId}
					apiaryId={apiaryId}
					frames={allHiveFrames}
				/>

				<JoinColonyModal
					isOpen={joinModalOpen}
					onClose={() => setJoinModalOpen(false)}
					hiveId={hiveId}
					apiaryId={apiaryId}
				/>

				{showQRModal && (
					<HiveQrStickerModal
						isGeneratingQR={isGeneratingQR}
						qrStickerDataUrl={qrStickerDataUrl}
						onClose={() => setShowQRModal(false)}
						onDownload={downloadQrSticker}
					/>
				)}
			</>
		)
	}

	return (
		<HiveTopEditForm apiaryId={apiaryId} hiveId={hiveId} buttons={buttons} />
	)
}
