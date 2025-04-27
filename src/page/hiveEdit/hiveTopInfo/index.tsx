import React, { useMemo, useState } from 'react'
import debounce from 'lodash/debounce'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import T from '@/shared/translate'
import HiveIcon from '@/shared/hive'

import QRCode from 'qrcode'
import { useMutation } from '@/api'

import InspectionIcon from '@/icons/inspection.tsx'
import Loader from '@/shared/loader'
import Button from '@/shared/button'
import QrCodeIcon from '@/icons/qrCodeIcon'// Import the new QR code icon
import SkullIcon from '@/icons/SkullIcon' // Import the new Skull icon
import { PopupButton, PopupButtonGroup } from '@/shared/popupButton'
import { InspectionSnapshot } from '@/models/inspections.ts'
import BeeCounter from '@/shared/beeCounter'
import MessageSuccess from '@/shared/messageSuccess'
import VisualFormSubmit from '@/shared/visualForm/VisualFormSubmit'

import { updateHive, getHive, isCollapsed, isEditable } from '@/models/hive.ts'
import { getBoxes } from '@/models/boxes.ts'
import { getFamilyByHive } from '@/models/family.ts'
import {
	getHiveInspectionStats,
	deleteCellsByFrameSideIDs,
} from '@/models/frameSideCells.ts'
import { getFramesByHive } from '@/models/frames.ts'
import { collectFrameSideIDsFromFrames } from '@/models/frameSide.ts'
import { deleteFilesByFrameSideIDs } from '@/models/frameSideFile.ts'

import DeactivateButton from '@/page/hiveEdit/deleteButton'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import styles from '@/page/hiveEdit/hiveTopInfo/styles.module.less'
import logoUrl from '@/assets/logo-v7.png'

import HiveTopEditForm from '@/page/hiveEdit/hiveTopInfo/hiveTopEditForm'
import CollapseHiveModal from '@/page/hiveEdit/CollapseHiveModal'; // Import the modal component

export default function HiveEditDetails({ apiaryId, hiveId }) {
	let [editable, setEditable] = useState(false)
	let [creatingInspection, setCreatingInspection] = useState(false)
	let [okMsg, setOkMsg] = useState(null)
	let [showCollapseSuccess, setShowCollapseSuccess] = useState(false)
	let navigate = useNavigate()
	const [showCollapseModal, setShowCollapseModal] = useState(false); // Add state for collapse modal

	// Model functions now handle invalid IDs
	let hive = useLiveQuery(() => getHive(+hiveId), [hiveId]);
	let boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId]);
	let family = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId]);

	const collapsed = hive ? isCollapsed(hive) : false;
	const editableHive = hive ? isEditable(hive) : false; // Expose for UI

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
				if (isCollapsed) return;
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
		[isCollapsed]
	)

	if (!hive) {
		return <Loader />
	}

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
								title="Generate QR sticker for this hive"
								onClick={onGenerateQR}
							>
								<QrCodeIcon size={16} /> <T>Generate QR sticker</T>
							</Button>
							
							{hive && !isCollapsed(hive) && (
								<Button onClick={() => setShowCollapseModal(true)}>
									<SkullIcon size={16} /> <T>Mark as Collapsed</T>
								</Button>
							)}
							<DeactivateButton hiveId={hive.id} />
						</PopupButton>
					</PopupButtonGroup>
				)}


				{!isEditable(hive) && isCollapsed(hive) && (
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
									{hive.name}
								</h1>
							</div>

							<div id={styles.raceYear}>
								{family && family.race}

								{family && family.race && family.added && (
									<>
										<QueenColor year={family?.added} />
										{family && family.added}
										{hive && isCollapsed(hive) && (
										<span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8, color: '#b22222', fontWeight: 600 }}>
											<SkullIcon size={18} color="#b22222" style={{ marginRight: 4 }} />
											<T>Collapsed</T>
										</span>
									)}
									</>
								)}
							</div>

							{!family && (
								<MessageSuccess
									title={<T>This hive has no family set yet</T>}
									isWarning={true}
								/>
							)}

							{hive.notes && <p>{hive.notes}</p>}
						</div>

						<div className={styles.button_wrap1}>{buttons}</div>
					</div>

					<div className={styles.button_wrap2}>{buttons}</div>
				</div>

				{/* Collapse Modal */}
				{showCollapseModal && (
					<CollapseHiveModal
						hiveId={hiveId}
						onClose={() => setShowCollapseModal(false)}
						onSuccess={() => {
							setShowCollapseModal(false);
							setShowCollapseSuccess(true);
						}}
					/>
				)}
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
				const logoSize = qrSize * 0.20
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
				console.debug(`Generated QR sticker with logo for hive ${hiveId} with URL: ${url}`)
			}
			logo.onerror = (err) => {
				console.error('Failed to load logo image', err)
			}

		} catch (err) {
			console.error('Failed to generate QR code', err)
		}
	}
}
