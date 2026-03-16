import { useEffect, useMemo, useState } from 'preact/hooks'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import T from '@/shared/translate'
import HiveIcon from '@/shared/hive'

import QRCode from 'qrcode'
import { gql, useMutation, useQuery } from '@/api'

import InspectionIcon from '@/icons/inspection'
import Loader from '@/shared/loader'
import Button from '@/shared/button'
import QrCodeIcon from '@/icons/qrCodeIcon'
import SkullIcon from '@/icons/SkullIcon'
import { PopupButton, PopupButtonGroup } from '@/shared/popupButton'
import { InspectionSnapshot } from '@/models/inspections'
import BeeCounter from '@/shared/beeCounter'
import MessageSuccess from '@/shared/messageSuccess'
import VisualFormSubmit from '@/shared/visualForm/submit'
import Modal from '@/shared/modal'

import {
	updateHive,
	getHive,
	isCollapsed,
	isEditable,
	isMerged,
} from '@/models/hive'
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

import DeactivateButton from '@/page/hiveEdit/deleteButton'
import QueenSlot from '@/page/hiveEdit/hiveTopInfo/QueenSlot'
import HiveStatistics from '@/page/hiveEdit/hiveStatistics'
import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less'
import logoUrl from '@/assets/logo-v7.png'

import HiveTopEditForm from '@/page/hiveEdit/hiveTopInfo/hiveTopEditForm'
import CollapseHiveModal from '@/page/hiveEdit/CollapseHiveModal'
import SplitHiveModal from '@/page/hiveEdit/SplitHiveModal'
import JoinColonyModal from '@/page/hiveEdit/JoinColonyModal'
import DateFormat from '@/shared/dateFormat'
import { isBillingTierLessThan } from '@/shared/billingTier'
import HivePlacementMiniMap from './HivePlacementMiniMap'

const BOX_SYSTEMS_FOR_HIVE_LABEL_QUERY = gql`
	query HiveTopInfoBoxSystems {
		boxSystems {
			id
			name
			isDefault
		}
	}
`

const BOX_SYSTEM_COLORS = ['#2f80ed', '#f2994a', '#27ae60', '#eb5757']

export default function HiveEditDetails({ apiaryId, hiveId, onTopMessageChange }) {
	let [editable, setEditable] = useState(false)
	let [creatingInspection, setCreatingInspection] = useState(false)
	let [okMsg, setOkMsg] = useState(null)
	let [showCollapseSuccess, setShowCollapseSuccess] = useState(false)
	const [showQRModal, setShowQRModal] = useState(false)
	const [qrStickerDataUrl, setQrStickerDataUrl] = useState<string | null>(null)
	const [isGeneratingQR, setIsGeneratingQR] = useState(false)
	let navigate = useNavigate()
	const [showCollapseModal, setShowCollapseModal] = useState(false)
	const [splitModalOpen, setSplitModalOpen] = useState(false)
	const [joinModalOpen, setJoinModalOpen] = useState(false) // Add state for collapse modal

	// Model functions now handle invalid IDs
	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId])
	const { data: boxSystemsData } = useQuery(BOX_SYSTEMS_FOR_HIVE_LABEL_QUERY)
	const user = useLiveQuery(() => getUser(), [], null)
	const isHiveMiniMapLocked = isBillingTierLessThan(user?.billingPlan, 'hobbyist')
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

	const collapsed = hive ? isCollapsed(hive) : false
	const editableHive = hive ? isEditable(hive) : false // Expose for UI

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
			if (event.ctrlKey || event.metaKey || event.altKey) return
			if (isTypingTarget(event.target)) return
			if (String(event.key || '').toLowerCase() !== 'e') return
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

	const onCreateInspection = useMemo(
		() =>
			debounce(async function (v) {
				setCreatingInspection(true)

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

				let createdInspection = await mutateInspection({
					inspection: {
						hiveId: +hiveId,
						data: JSON.stringify(inspectionSnapshot),
					},
				})

				await cloneFramesForInspection({
					inspectionId: createdInspection.data.addInspection.id,
					frameSideIDs,
				})

				deleteCellsByFrameSideIDs(frameSideIDs)
				deleteFilesByFrameSideIDs(frameSideIDs)

				hive.inspectionCount = hive.inspectionCount + 1
				updateHive(hive)
				setCreatingInspection(false)

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
	const selectedBoxSystem = boxSystems.find((system: any) => String(system.id) === String(hiveBoxSystemId))
	const defaultBoxSystem = boxSystems.find((system: any) => system.isDefault) || boxSystems[0]
	const isHorizontalHive = boxes?.some((box: any) => box.type === 'LARGE_HORIZONTAL_SECTION')
	const displayedBoxSystem = selectedBoxSystem || (!hiveBoxSystemId && !isHorizontalHive ? defaultBoxSystem : null)
	const displayedBoxSystemColor = displayedBoxSystem
		? BOX_SYSTEM_COLORS[Math.max(boxSystems.findIndex((system: any) => String(system.id) === String(displayedBoxSystem.id)), 0) % BOX_SYSTEM_COLORS.length]
		: '#6b7280'

	const SplitIcon = () => (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="currentColor"
			style="margin-right: 4px"
		>
			<path
				d="M8 2L8 6M8 6L6 4M8 6L10 4M8 10L8 14M8 10L6 12M8 10L10 12M3 8L6 8M10 8L13 8"
				stroke="currentColor"
				fill="none"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
		</svg>
	)

	const JoinIcon = () => (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="currentColor"
			style="margin-right: 4px"
		>
			<path
				d="M2 6L5 8L2 10M14 6L11 8L14 10M5 8L11 8"
				stroke="currentColor"
				fill="none"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	)

		let buttons = (
			<div>
				<VisualFormSubmit>
					{isEditable(hive) && (
						<PopupButtonGroup>
							{!editable && (
								<Button
									loading={creatingInspection}
									onClick={onCreateInspection}
									color="green"
								>
									<InspectionIcon />
									<T ctx="This is a button that adds new beehive inspection as a snapshot of current beehive state">
										Create Inspection
									</T>
								</Button>
							)}
							{!editable && hive && !isCollapsed(hive) && (
								<Button onClick={() => navigate(`/apiaries/${apiaryId}/hives/${hiveId}/edit`)}>
									<T ctx="this is a button to allow editing by displaying a form">
									Edit
								</T>
							</Button>
						)}

							{!editable && (
								<PopupButton align="right">
									<Button
										title="Split colony"
										onClick={() => setSplitModalOpen(true)}
									>
										<SplitIcon />{' '}
										<T
											ctx={
												'An operation on a bee colony by separating it into two or more parts. This is done to prevent swarming, expand the apiary, or create nucleus colonies.'
											}
										>
											Split Colony
										</T>
									</Button>

									<Button
										title="Join colonies"
										onClick={() => setJoinModalOpen(true)}
									>
										<JoinIcon />{' '}
										<T
											ctx={
												'Joining two bee colonies involves physically combining two separate colonies into one. This is done to strengthen a weak colony, manage queen genetics, or consolidate resources.'
											}
										>
											Combine Colonies
										</T>
									</Button>

									{hive && !isCollapsed(hive) && (
										<Button onClick={() => setShowCollapseModal(true)}>
											<SkullIcon size={16} />{' '}
											<T
												ctx={
													'Marking bee colony as dead due to varroa mite infestation or other unknown causes'
												}
											>
												Mark as Collapsed
											</T>
										</Button>
									)}
									<DeactivateButton hiveId={hive.id} />
								</PopupButton>
							)}
					</PopupButtonGroup>
				)}

				{!isEditable(hive) && (isCollapsed(hive) || isMerged(hive)) && (
					<DeactivateButton hiveId={hive.id} />
				)}
			</VisualFormSubmit>
		</div>
	)

		let buttonsDesktop = (
			<div>
				<VisualFormSubmit>
					{isEditable(hive) && (
						<PopupButtonGroup>
							{!editable && (
								<Button
									loading={creatingInspection}
									onClick={onCreateInspection}
									color="green"
								>
									<InspectionIcon />
									<T ctx="This is a button that adds new beehive inspection as a snapshot of current beehive state">
										Create Inspection
									</T>
								</Button>
							)}
							{!editable && hive && !isCollapsed(hive) && (
								<Button onClick={() => navigate(`/apiaries/${apiaryId}/hives/${hiveId}/edit`)}>
									<T ctx="this is a button to allow editing by displaying a form">
									Edit
								</T>
							</Button>
						)}

							{!editable && (
								<PopupButton align="right">
									<Button
										title="Split colony"
										onClick={() => setSplitModalOpen(true)}
									>
										<SplitIcon />{' '}
										<T
											ctx={
												'An operation on a bee colony by separating it into two or more parts. This is done to prevent swarming, expand the apiary, or create nucleus colonies.'
											}
										>
											Split Colony
										</T>
									</Button>

									<Button
										title="Join colonies"
										onClick={() => setJoinModalOpen(true)}
									>
										<JoinIcon /> <T>Join Colony</T>
									</Button>

									{hive && !isCollapsed(hive) && (
										<Button onClick={() => setShowCollapseModal(true)}>
											<SkullIcon size={16} />{' '}
											<T
												ctx={
													'Marking bee colony as dead due to varroa mite infestation or other unknown causes'
												}
											>
												Mark as Collapsed
											</T>
										</Button>
									)}
									<DeactivateButton hiveId={hive.id} />
								</PopupButton>
							)}
					</PopupButtonGroup>
				)}

				{!isEditable(hive) && (isCollapsed(hive) || isMerged(hive)) && (
					<DeactivateButton hiveId={hive.id} />
				)}
			</VisualFormSubmit>
		</div>
	)

	if (!editable) {
		return (
			<>
				<div style="padding: 0 10px;">
					<div className={styles.spotlight_wrap}>
						<div className={styles.spotlight_icon}>
							<div className={styles.icon_wrap}>
								<HiveIcon boxes={boxes} />
							</div>
							<BeeCounter count={hive.beeCount} />
						</div>

							<div className={styles.name_race_wrap}>
								<div className={styles.hiveTitleRow}>
									<h1 className={styles.hiveTitle} onClick={goToHiveView}>
										{hive.hiveNumber ? (
											`Hive #${hive.hiveNumber}`
										) : (
											<T>Hive without number</T>
										)}
									</h1>
									<button
										type="button"
										className={styles.hiveTitleQrButton}
										title="Generate QR sticker for this hive"
										aria-label="Generate QR sticker for this hive"
										onClick={onGenerateQR}
									>
										<QrCodeIcon size={16} />
									</button>
								</div>
								<div className={styles.wrap4}>
									<div className={styles.titleQueenWrap}>
											<div className={styles.boxSystemMeta}>
												<span className={styles.boxSystemMetaLabel}>
													<T>Hive system</T>:
												</span>
												<span className={styles.boxSystemPill}>
													<span
														className={styles.boxSystemPillDot}
														style={{ backgroundColor: displayedBoxSystemColor }}
													></span>
													<span>
														{isHorizontalHive
															? 'Independent (Horizontal)'
															: (displayedBoxSystem?.name || 'Unknown')}
													</span>
												</span>
											</div>
											<div id={styles.queenSection}>
												<QueenSlot
													families={families}
													editable={false}
													onAddQueen={() => {}}
													onRemoveQueen={() => {}}
													onEmptySlotClick={() => navigate(`/apiaries/${apiaryId}/hives/${hiveId}/edit`)}
												/>

											{hive && isCollapsed(hive) && (
												<div className={styles.collapsedLabel}>
													{hive.collapse_date && (
														<>
															<DateFormat datetime={hive.collapse_date} />{' '}
														</>
													)}
													<SkullIcon
														size={14}
														color="#b22222"
														style={{ marginRight: 4 }}
													/>
													<T>Collapsed</T>
													</div>
												)}
											</div>
											<HiveStatistics hiveId={hiveId} />
											{hive.notes && <p className={styles.hiveNotes}>{hive.notes}</p>}
										</div>
										{!isHiveMiniMapLocked && (
											<div className={styles.desktopMiniMapWrap}>
												<HivePlacementMiniMap apiaryId={apiaryId} selectedHiveId={hiveId} />
											</div>
										)}
									</div>

							{hive && isCollapsed(hive) && hive.collapse_cause && (
								<>
									{' '}
									<T>Collapse cause</T>: {hive.collapse_cause}
								</>
							)}

							{hive.parentHive && (
								<div className={styles.splitLineage}>
									<T>Split from</T>:{' '}
									<a href={`/apiaries/${apiaryId}/hives/${hive.parentHive.id}`}>
										{hive.parentHive.hiveNumber
											? `Hive #${hive.parentHive.hiveNumber}`
											: `Hive ${hive.parentHive.id}`}
									</a>
									{hive.splitDate && (
										<>
											{' '}
											<T>on</T> <DateFormat datetime={hive.splitDate} />
										</>
									)}
								</div>
							)}

							{hive.childHives && hive.childHives.length > 0 && (
								<div className={styles.splitLineage}>
									<T>Child hives</T>:{' '}
									{hive.childHives.map((child, idx) => (
										<span key={child.id}>
											{idx > 0 && ', '}
											<a href={`/apiaries/${apiaryId}/hives/${child.id}`}>
												{child.hiveNumber
													? `Hive #${child.hiveNumber}`
													: `Hive ${child.id}`}
											</a>
											{child.splitDate && (
												<>
													{' '}
													(<DateFormat datetime={child.splitDate} />)
												</>
											)}
										</span>
									))}
								</div>
							)}

							{hive.mergedIntoHive && (
								<div className={styles.splitLineage}>
									<T>Merged into</T>:{' '}
									<a
										href={`/apiaries/${apiaryId}/hives/${hive.mergedIntoHive.id}`}
									>
										{hive.mergedIntoHive.hiveNumber
											? `Hive #${hive.mergedIntoHive.hiveNumber}`
											: `Hive ${hive.mergedIntoHive.id}`}
									</a>
									{hive.mergeDate && (
										<>
											{' '}
											<T>on</T> <DateFormat datetime={hive.mergeDate} />
										</>
									)}
								</div>
							)}

							{hive.mergedFromHives && hive.mergedFromHives.length > 0 && (
								<div className={styles.splitLineage}>
									<T>Merged from</T>:{' '}
									{hive.mergedFromHives.map((merged, idx) => (
										<span key={merged.id}>
											{idx > 0 && ', '}
											<a href={`/apiaries/${apiaryId}/hives/${merged.id}`}>
												{merged.hiveNumber
													? `Hive #${merged.hiveNumber}`
													: `Hive ${merged.id}`}
											</a>
											{merged.mergeDate && (
												<>
													{' '}
													(<DateFormat datetime={merged.mergeDate} />)
												</>
											)}
										</span>
									))}
								</div>
							)}
						</div>

							<div className={styles.button_wrap1}>{buttonsDesktop}</div>
						</div>

					<div className={styles.button_wrap2}>{buttons}</div>
				</div>

				{/* Collapse Modal */}
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
					<Modal
						title={<T>Hive QR sticker</T>}
						onClose={() => setShowQRModal(false)}
						className={styles.qrModal}
					>
						<div className={styles.qrModalBody}>
							{isGeneratingQR && <Loader />}
							{!isGeneratingQR && qrStickerDataUrl && (
								<>
									<img
										src={qrStickerDataUrl}
										alt="Hive QR sticker"
										className={styles.qrPreview}
									/>
									<Button onClick={downloadQrSticker}>
										<T>Download sticker</T>
									</Button>
								</>
							)}
							{!isGeneratingQR && !qrStickerDataUrl && (
								<p className={styles.qrErrorText}>
									<T>Failed to generate QR sticker.</T>
								</p>
							)}
						</div>
					</Modal>
				)}
			</>
		)
	}

	return (
		<HiveTopEditForm apiaryId={apiaryId} hiveId={hiveId} buttons={buttons} />
	)

	async function onGenerateQR() {
		try {
			setShowQRModal(true)
			setIsGeneratingQR(true)
			setQrStickerDataUrl(null)

			const url = window.location.href
			const canvas = document.createElement('canvas')
			const qrSize = 1000 // Increased size

			// Draw QR code to canvas
			await QRCode.toCanvas(canvas, url, {
				width: qrSize,
				errorCorrectionLevel: 'H', // High error correction is important for logos
				margin: 1, // Add a small margin
			})

			const logo = await loadImage(logoUrl)
			const ctx = canvas.getContext('2d')
			if (!ctx) {
				throw new Error('Could not get canvas context')
			}

			// Calculate logo size and position (e.g., 20% of QR size)
			const logoSize = qrSize * 0.2
			const logoX = (qrSize - logoSize) / 2
			const logoY = (qrSize - logoSize) / 2

			// Draw a white background behind the logo for better contrast/scannability
			ctx.fillStyle = '#FFFFFF'
			ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)

			// Draw logo
			ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)

			// Convert canvas to data URL for preview/download in modal
			const qrDataURL = canvas.toDataURL('image/png')
			setQrStickerDataUrl(qrDataURL)
			console.debug(`Generated QR sticker with logo for hive ${hiveId} with URL: ${url}`)
		} catch (err) {
			console.error('Failed to generate QR code', err)
		} finally {
			setIsGeneratingQR(false)
		}
	}

	function downloadQrSticker() {
		if (!qrStickerDataUrl) return

		const link = document.createElement('a')
		link.href = qrStickerDataUrl
		link.download = `hive-${hiveId}-qr-sticker.png`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	function loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image()
			image.onload = () => resolve(image)
			image.onerror = reject
			image.src = src
		})
	}
}
