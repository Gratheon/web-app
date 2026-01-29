import { useMemo, useState } from 'preact/hooks'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import T from '@/shared/translate'
import HiveIcon from '@/shared/hive'

import QRCode from 'qrcode'
import { useMutation } from '@/api'

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

import {
	updateHive,
	getHive,
	isCollapsed,
	isEditable,
	isMerged,
} from '@/models/hive'
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
import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less'
import logoUrl from '@/assets/logo-v7.png'

import HiveTopEditForm from '@/page/hiveEdit/hiveTopInfo/hiveTopEditForm'
import CollapseHiveModal from '@/page/hiveEdit/CollapseHiveModal'
import SplitHiveModal from '@/page/hiveEdit/SplitHiveModal'
import JoinColonyModal from '@/page/hiveEdit/JoinColonyModal'
import DateFormat from '@/shared/dateFormat'

export default function HiveEditDetails({ apiaryId, hiveId }) {
	let [editable, setEditable] = useState(false)
	let [creatingInspection, setCreatingInspection] = useState(false)
	let [okMsg, setOkMsg] = useState(null)
	let [showCollapseSuccess, setShowCollapseSuccess] = useState(false)
	let navigate = useNavigate()
	const [showCollapseModal, setShowCollapseModal] = useState(false)
	const [splitModalOpen, setSplitModalOpen] = useState(false)
	const [joinModalOpen, setJoinModalOpen] = useState(false) // Add state for collapse modal

	// Model functions now handle invalid IDs
	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId])
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

	if (!hive) {
		return <Loader />
	}

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

				{isEditable(hive) && (
					<PopupButtonGroup>
						{!editable && hive && !isCollapsed(hive) && (
							<Button onClick={() => setEditable(!editable)}>
								<T ctx="this is a button to allow editing by displaying a form">
									Edit
								</T>
							</Button>
						)}
						{editable && hive && editableHive && (
							<Button onClick={() => setEditable(!editable)}>
								<T ctx="this is a button to compete editing of a form, but it is not doing any saving because saving is done automatically, this just switches form to view mode">
									Complete
								</T>
							</Button>
						)}

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

							<Button
								title="Generate QR sticker for this hive"
								onClick={onGenerateQR}
							>
								<QrCodeIcon size={16} /> <T>Generate QR sticker</T>
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

				{isEditable(hive) && (
					<Button title="Split colony" onClick={() => setSplitModalOpen(true)}>
						<SplitIcon />{' '}
						<span>
							<T
								ctx={
									'An operation on a bee colony by separating it into two or more parts. This is done to prevent swarming, expand the apiary, or create nucleus colonies.'
								}
							>
								Split Colony
							</T>
						</span>
					</Button>
				)}

				{isEditable(hive) && (
					<Button title="Join colonies" onClick={() => setJoinModalOpen(true)}>
						<JoinIcon />{' '}
						<span>
							<T>Join Colony</T>
						</span>
					</Button>
				)}

				{isEditable(hive) && (
					<PopupButtonGroup>
						{!editable && hive && !isCollapsed(hive) && (
							<Button onClick={() => setEditable(!editable)}>
								<T ctx="this is a button to allow editing by displaying a form">
									Edit
								</T>
							</Button>
						)}
						{editable && hive && editableHive && (
							<Button onClick={() => setEditable(!editable)}>
								<T ctx="this is a button to compete editing of a form, but it is not doing any saving because saving is done automatically, this just switches form to view mode">
									Complete
								</T>
							</Button>
						)}

						<PopupButton align="right">
							<Button
								title="Generate QR sticker for this hive"
								onClick={onGenerateQR}
							>
								<QrCodeIcon size={16} /> <T>Generate QR sticker</T>
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
					{okMsg}
					{showCollapseSuccess && (
						<MessageSuccess
							title={<T>Sorry for your loss</T>}
							message={<T>This hive is now marked as collapsed.</T>}
						/>
					)}

					<div className={styles.horizontal_wrap}>
						<div className={styles.icon_wrap}>
							<HiveIcon boxes={boxes} />
							<BeeCounter count={hive.beeCount} />
						</div>

						<div className={styles.name_race_wrap}>
							<div className={styles.wrap4}>
								<h1 style="flex-grow:1; cursor: pointer" onClick={goToHiveView}>
									{hive.hiveNumber ? (
										`Hive #${hive.hiveNumber}`
									) : (
										<T>Hive without number</T>
									)}
								</h1>
							</div>

							<div id={styles.queenSection}>
								<QueenSlot
									families={families}
									editable={false}
									onAddQueen={() => {}}
									onRemoveQueen={() => {}}
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

							{hive.notes && <p>{hive.notes}</p>}
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
			</>
		)
	}

	return (
		<HiveTopEditForm apiaryId={apiaryId} hiveId={hiveId} buttons={buttons} />
	)

	async function onGenerateQR() {
		try {
			const url = window.location.href
			const canvas = document.createElement('canvas')
			const qrSize = 1000 // Increased size

			// Draw QR code to canvas
			await QRCode.toCanvas(canvas, url, {
				width: qrSize,
				errorCorrectionLevel: 'H', // High error correction is important for logos
				margin: 1, // Add a small margin
			})

			// Load logo image
			const logo = new Image()
			logo.src = logoUrl
			logo.onload = () => {
				const ctx = canvas.getContext('2d')
				if (!ctx) {
					console.error('Could not get canvas context')
					return
				}

				// Calculate logo size and position (e.g., 20% of QR size)
				const logoSize = qrSize * 0.2
				const logoX = (qrSize - logoSize) / 2
				const logoY = (qrSize - logoSize) / 2

				// Optional: Draw a white background behind the logo for better contrast/scannability
				ctx.fillStyle = '#FFFFFF'
				ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10) // Slightly larger white square

				// Draw logo
				ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)

				// Convert canvas to data URL
				const qrDataURL = canvas.toDataURL('image/png')

				// Trigger download
				const link = document.createElement('a')
				link.href = qrDataURL
				link.download = `hive-${hiveId}-qr-sticker.png`
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				console.debug(
					`Generated QR sticker with logo for hive ${hiveId} with URL: ${url}`
				)
			}
			logo.onerror = (err) => {
				console.error('Failed to load logo image', err)
			}
		} catch (err) {
			console.error('Failed to generate QR code', err)
		}
	}
}
