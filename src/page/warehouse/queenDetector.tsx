import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useMutation, useQuery, useUploadMutation } from '@/api'
import RefreshIcon from '@/icons/RefreshIcon'
import {
	getAllFamiliesByHive,
	getFamilyById,
	updateFamily,
} from '@/models/family'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import T, { useTranslation } from '@/shared/translate'
import {
	getVideoConstraints,
	listPhysicalCameraDevices,
	resolveActiveCameraDeviceId,
} from './queenDetector.camera'
import {
	canvasToJpegBlob,
	captureVideoFrame,
	cropBestCapture,
	detectionLabel,
} from './queenDetector.capture'
import QueenDetectorAssignmentPanel from './queenDetectorAssignmentPanel'
import {
	createDetectorSession,
	MODEL_SIZE,
	parseDetections,
	preprocessFrame,
} from './queenDetector.model'
import {
	ADD_QUEEN_TO_HIVE_MUTATION,
	ADD_WAREHOUSE_QUEEN_MUTATION,
	ASSIGN_QUEEN_FROM_WAREHOUSE_MUTATION,
	UPLOAD_QUEEN_PREVIEW_MUTATION,
	WAREHOUSE_QUEENS_QUERY,
} from './queenDetector.queries'
import type {
	AssignMode,
	BestCapture,
	CapturedVideoFrame,
	Detection,
	QueenDetectorSession,
	QueenOption,
} from './queenDetector.types'
import styles from './queenDetector.module.less'

const CAPTURE_INTERVAL_MS = 700

export default function QueenDetectorPage() {
	const [searchParams] = useSearchParams()
	const inspectedHiveId = Number(searchParams.get('hiveId') || '')
	const hasHiveContext = Number.isFinite(inspectedHiveId) && inspectedHiveId > 0
	const videoRef = useRef<HTMLVideoElement | null>(null)
	const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const inferenceCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const timerRef = useRef<number | null>(null)
	const animationFrameRef = useRef<number | null>(null)
	const isDetectingRef = useRef(false)
	const detectionsRef = useRef<Detection[]>([])
	const sessionRef = useRef<QueenDetectorSession | null>(null)
	const bestCaptureRef = useRef<BestCapture | null>(null)
	const bestCaptureUrlRef = useRef<string | null>(null)

	const [isCameraActive, setIsCameraActive] = useState(false)
	const [isModelLoading, setIsModelLoading] = useState(false)
	const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState<
		string | null
	>(null)
	const [isSwitchingCamera, setIsSwitchingCamera] = useState(false)
	const [bestCapture, setBestCapture] = useState<BestCapture | null>(null)
	const [assignmentMode, setAssignmentMode] = useState<AssignMode>('existing')
	const [selectedQueenId, setSelectedQueenId] = useState('')
	const [newQueenName, setNewQueenName] = useState('')
	const [newQueenRace, setNewQueenRace] = useState('')
	const [newQueenYear, setNewQueenYear] = useState(
		String(new Date().getFullYear())
	)
	const [isSavingCapture, setIsSavingCapture] = useState(false)
	const [savedFamilyId, setSavedFamilyId] = useState<string | null>(null)
	const [savedPreviewUrl, setSavedPreviewUrl] = useState<string | null>(null)
	const [assignmentError, setAssignmentError] = useState<any>(null)
	const [error, setError] = useState<any>(null)
	const switchCameraTitle = useTranslation('Switch camera')

	const { data: warehouseData, error: warehouseError } = useQuery(
		WAREHOUSE_QUEENS_QUERY
	)
	const hiveFamilies = useLiveQuery(
		() =>
			hasHiveContext
				? getAllFamiliesByHive(inspectedHiveId)
				: Promise.resolve([]),
		[hasHiveContext, inspectedHiveId],
		[]
	)
	const [addWarehouseQueen, { error: addWarehouseQueenError }] = useMutation(
		ADD_WAREHOUSE_QUEEN_MUTATION
	)
	const [addQueenToHive, { error: addQueenToHiveError }] = useMutation(
		ADD_QUEEN_TO_HIVE_MUTATION
	)
	const [assignQueenFromWarehouse, { error: assignQueenFromWarehouseError }] =
		useMutation(ASSIGN_QUEEN_FROM_WAREHOUSE_MUTATION)
	const [uploadQueenPreview, uploadQueenPreviewResult] = useUploadMutation(
		UPLOAD_QUEEN_PREVIEW_MUTATION
	) as [any, any]
	const uploadQueenPreviewError = uploadQueenPreviewResult.error

	const queenOptions = useMemo<QueenOption[]>(() => {
		const options: QueenOption[] = []
		const seen = new Set<string>()

		if (hasHiveContext) {
			for (const family of hiveFamilies || []) {
				if (!family?.id) continue
				const id = String(family.id)
				seen.add(id)
				options.push({
					id,
					name: family.name,
					race: family.race,
					added: family.added,
					color: family.color,
					source: 'HIVE',
				})
			}
		}

		for (const queen of warehouseData?.warehouseQueens || []) {
			const id = String(queen?.id || '')
			if (!id || seen.has(id)) continue
			seen.add(id)
			options.push({
				id,
				name: queen.name,
				race: queen.race,
				added: queen.added,
				color: queen.color,
				source: 'WAREHOUSE',
			})
		}

		return options
	}, [hasHiveContext, hiveFamilies, warehouseData?.warehouseQueens])

	useEffect(() => {
		if (!queenOptions.length) {
			if (assignmentMode === 'existing') {
				setAssignmentMode('new')
			}
			setSelectedQueenId('')
			return
		}

		if (
			!selectedQueenId ||
			!queenOptions.some((option) => option.id === selectedQueenId)
		) {
			setSelectedQueenId(queenOptions[0].id)
		}
	}, [assignmentMode, queenOptions, selectedQueenId])

	const clearBestCapture = useCallback(() => {
		if (bestCaptureUrlRef.current) {
			URL.revokeObjectURL(bestCaptureUrlRef.current)
		}
		bestCaptureRef.current = null
		bestCaptureUrlRef.current = null
		setBestCapture(null)
		setSavedFamilyId(null)
		setSavedPreviewUrl(null)
	}, [])

	const clearSaveResult = useCallback(() => {
		setSavedFamilyId(null)
		setSavedPreviewUrl(null)
	}, [])

	const drawPreview = useCallback((items: Detection[]) => {
		const video = videoRef.current
		const canvas = previewCanvasRef.current
		if (!video || !canvas || !video.videoWidth || !video.videoHeight) return

		if (
			canvas.width !== video.videoWidth ||
			canvas.height !== video.videoHeight
		) {
			canvas.width = video.videoWidth
			canvas.height = video.videoHeight
		}

		const context = canvas.getContext('2d')
		if (!context) return

		context.clearRect(0, 0, canvas.width, canvas.height)
		context.drawImage(video, 0, 0, canvas.width, canvas.height)
		context.lineWidth = Math.max(6, canvas.width / 100)
		context.font = `${Math.max(14, Math.round(canvas.width / 42))}px sans-serif`

		items.forEach((detection) => {
			const [x1, y1, x2, y2] = detection.box
			const width = x2 - x1
			const height = y2 - y1
			const label = detectionLabel(detection)

			context.strokeStyle = '#2563eb'
			context.fillStyle = 'rgba(37, 99, 235, 0.16)'
			context.strokeRect(x1, y1, width, height)
			context.fillRect(x1, y1, width, height)

			const labelWidth = context.measureText(label).width + 10
			const labelHeight = 22
			const labelY = Math.max(0, y1 - labelHeight)
			context.fillStyle = '#1d4ed8'
			context.fillRect(x1, labelY, labelWidth, labelHeight)
			context.fillStyle = '#fff'
			context.fillText(label, x1 + 5, labelY + 16)
		})
	}, [])

	const stopPreviewLoop = useCallback(() => {
		if (animationFrameRef.current !== null) {
			window.cancelAnimationFrame(animationFrameRef.current)
			animationFrameRef.current = null
		}
	}, [])

	const startPreviewLoop = useCallback(() => {
		stopPreviewLoop()

		const drawFrame = () => {
			drawPreview(detectionsRef.current)
			animationFrameRef.current = window.requestAnimationFrame(drawFrame)
		}

		drawFrame()
	}, [drawPreview, stopPreviewLoop])

	const stopCamera = useCallback(() => {
		if (timerRef.current !== null) {
			window.clearInterval(timerRef.current)
			timerRef.current = null
		}

		stopPreviewLoop()
		streamRef.current?.getTracks().forEach((track) => track.stop())
		streamRef.current = null
		detectionsRef.current = []
		setIsCameraActive(false)
		isDetectingRef.current = false
	}, [stopPreviewLoop])

	const captureBestFrameIfNeeded = useCallback(
		async (detection: Detection, frame: CapturedVideoFrame | null) => {
			if (!frame) return false

			const current = bestCaptureRef.current
			if (current && detection.confidence <= current.confidence) {
				return false
			}

			const imageBlob = await canvasToJpegBlob(frame.canvas)
			if (!imageBlob) return false

			if (bestCaptureUrlRef.current) {
				URL.revokeObjectURL(bestCaptureUrlRef.current)
			}

			// WHY: keep the best frame only in browser memory until the user explicitly assigns it to a queen.
			const nextCapture: BestCapture = {
				imageBlob,
				imageUrl: URL.createObjectURL(imageBlob),
				videoWidth: frame.videoWidth,
				videoHeight: frame.videoHeight,
				detection: {
					...detection,
					box: [...detection.box] as [number, number, number, number],
				},
				confidence: detection.confidence,
				capturedAt: new Date().toISOString(),
			}

			bestCaptureRef.current = nextCapture
			bestCaptureUrlRef.current = nextCapture.imageUrl
			setBestCapture(nextCapture)
			setSavedFamilyId(null)
			setSavedPreviewUrl(null)
			return true
		},
		[]
	)

	const detectFrame = useCallback(async () => {
		if (isDetectingRef.current) return

		const video = videoRef.current
		const canvas = inferenceCanvasRef.current
		const session = sessionRef.current
		if (
			!video ||
			!canvas ||
			!session ||
			!video.videoWidth ||
			!video.videoHeight
		)
			return

		isDetectingRef.current = true

		try {
			const ort = await import('onnxruntime-web/wasm')
			const preprocessed = preprocessFrame(video, canvas)
			const sourceFrame = await captureVideoFrame(video)
			const inputName = session.inputNames[0]
			const outputName = session.outputNames[0]
			const feeds = {
				[inputName]: new ort.Tensor('float32', preprocessed.data, [
					1,
					3,
					MODEL_SIZE,
					MODEL_SIZE,
				]),
			}
			const output = await session.run(feeds)
			const items = parseDetections(
				output[outputName],
				video.videoWidth,
				video.videoHeight,
				preprocessed
			)
			const bestQueenDetection = items
				.filter((item) => item.class_name.toLowerCase().includes('queen'))
				.sort((a, b) => b.confidence - a.confidence)[0]

			if (bestQueenDetection) {
				await captureBestFrameIfNeeded(bestQueenDetection, sourceFrame)
			}

			detectionsRef.current = items
			drawPreview(items)
			setError(null)
		} catch (e) {
			setError(e)
		} finally {
			isDetectingRef.current = false
		}
	}, [captureBestFrameIfNeeded, drawPreview])

	const startCamera = useCallback(
		async (cameraDeviceId?: string, shouldResetCapture = true) => {
			try {
				stopCamera()
				if (shouldResetCapture) {
					clearBestCapture()
				}
				setAssignmentError(null)
				setError(null)
				const stream = await navigator.mediaDevices.getUserMedia({
					video: getVideoConstraints(cameraDeviceId),
					audio: false,
				})

				streamRef.current = stream
				if (videoRef.current) {
					videoRef.current.srcObject = stream
					await videoRef.current.play()
				}

				setIsCameraActive(true)
				try {
					const cameras = await listPhysicalCameraDevices()
					setCameraDevices(cameras)
					setSelectedCameraDeviceId(
						resolveActiveCameraDeviceId(cameras, stream, cameraDeviceId)
					)
				} catch {
					setCameraDevices([])
					setSelectedCameraDeviceId(null)
				}
				startPreviewLoop()
				setIsModelLoading(true)
				sessionRef.current =
					sessionRef.current || (await createDetectorSession())
				if (!streamRef.current) return

				timerRef.current = window.setInterval(detectFrame, CAPTURE_INTERVAL_MS)
				window.setTimeout(detectFrame, 250)
			} catch (e) {
				setError(e)
				stopCamera()
			} finally {
				setIsModelLoading(false)
			}
		},
		[clearBestCapture, detectFrame, startPreviewLoop, stopCamera]
	)

	const switchCamera = useCallback(async () => {
		if (cameraDevices.length <= 1 || isModelLoading || isSwitchingCamera) return

		const currentIndex = cameraDevices.findIndex(
			(camera) => camera.deviceId === selectedCameraDeviceId
		)
		const nextIndex =
			currentIndex >= 0 ? (currentIndex + 1) % cameraDevices.length : 0
		const nextCamera = cameraDevices[nextIndex]
		if (!nextCamera?.deviceId) return

		setIsSwitchingCamera(true)
		try {
			await startCamera(nextCamera.deviceId, false)
		} finally {
			setIsSwitchingCamera(false)
		}
	}, [
		cameraDevices,
		isModelLoading,
		isSwitchingCamera,
		selectedCameraDeviceId,
		startCamera,
	])

	useEffect(() => {
		return () => {
			stopCamera()
			if (bestCaptureUrlRef.current) {
				URL.revokeObjectURL(bestCaptureUrlRef.current)
			}
		}
	}, [stopCamera])

	const onSaveBestCapture = useCallback(
		async (event: any) => {
			event.preventDefault()
			if (!bestCapture || isSavingCapture) return

			setAssignmentError(null)
			setIsSavingCapture(true)
			try {
				if (assignmentMode === 'existing' && !selectedQueenId) {
					throw new Error('Select a queen first.')
				}

				const year = newQueenYear.trim()
				if (assignmentMode === 'new' && year && !/^\d{4}$/.test(year)) {
					throw new Error('Year must be 4 digits (e.g. 2026).')
				}

				const croppedBlob = await cropBestCapture(bestCapture)
				if (!croppedBlob) {
					throw new Error('Could not crop the best queen capture.')
				}

				const croppedFile = new File(
					[croppedBlob],
					`queen-detection-preview-${Date.now()}.jpg`,
					{ type: 'image/jpeg' }
				)

				const uploadResult = await uploadQueenPreview({ file: croppedFile })
				const previewImageUrl = uploadResult?.data?.uploadFrameSide?.url
				if (uploadResult?.error || !previewImageUrl) {
					throw (
						uploadResult?.error ||
						new Error('Failed to upload queen preview image.')
					)
				}

				let familyId = ''
				let familyData: any = null

				if (assignmentMode === 'new') {
					const queenInput = {
						name: newQueenName.trim() || null,
						race: newQueenRace.trim() || null,
						added: year || null,
						color: null,
					}

					if (hasHiveContext) {
						const result = await addQueenToHive({
							hiveId: String(inspectedHiveId),
							queen: queenInput,
						})
						const createdQueen = result?.data?.addQueenToHive
						if (result?.error || !createdQueen?.id) {
							throw (
								result?.error ||
								new Error('Failed to create queen in this hive.')
							)
						}
						familyId = String(createdQueen.id)
						familyData = {
							id: Number(createdQueen.id),
							hiveId: inspectedHiveId,
							name: createdQueen.name || queenInput.name || '',
							race: createdQueen.race || queenInput.race || '',
							added: createdQueen.added || queenInput.added || '',
							color: createdQueen.color || null,
						}
					} else {
						const result = await addWarehouseQueen({ queen: queenInput })
						const createdQueen = result?.data?.addWarehouseQueen
						if (result?.error || !createdQueen?.id) {
							throw (
								result?.error || new Error('Failed to create warehouse queen.')
							)
						}
						familyId = String(createdQueen.id)
						familyData = {
							id: Number(createdQueen.id),
							name: queenInput.name || '',
							race: queenInput.race || '',
							added: queenInput.added || '',
							color: null,
						}
					}
				} else {
					const selectedQueen = queenOptions.find(
						(option) => option.id === selectedQueenId
					)
					if (!selectedQueen) {
						throw new Error('Selected queen was not found.')
					}

					if (hasHiveContext && selectedQueen.source === 'WAREHOUSE') {
						const result = await assignQueenFromWarehouse({
							hiveId: String(inspectedHiveId),
							familyId: selectedQueen.id,
						})
						const assignedQueen = result?.data?.assignQueenFromWarehouse
						if (result?.error || !assignedQueen?.id) {
							throw (
								result?.error ||
								new Error('Failed to assign warehouse queen to this hive.')
							)
						}
						familyId = String(assignedQueen.id)
						familyData = {
							id: Number(assignedQueen.id),
							hiveId: inspectedHiveId,
							name: assignedQueen.name || selectedQueen.name || '',
							race: assignedQueen.race || selectedQueen.race || '',
							added: assignedQueen.added || selectedQueen.added || '',
							color: assignedQueen.color || selectedQueen.color || null,
						}
					} else {
						familyId = selectedQueen.id
						familyData = {
							id: Number(selectedQueen.id),
							...(hasHiveContext ? { hiveId: inspectedHiveId } : {}),
							name: selectedQueen.name || '',
							race: selectedQueen.race || '',
							added: selectedQueen.added || '',
							color: selectedQueen.color || null,
						}
					}
				}

				// WHY: image-splitter already persists the cropped image file; until GraphQL has a queen-image field,
				// keep the queen-to-image relation in the local Family preview used by the Queens database UI.
				const existingFamily = await getFamilyById(Number(familyId))
				await updateFamily({
					...(existingFamily || {}),
					...familyData,
					id: Number(familyId),
					previewImageUrl,
				})

				setSavedFamilyId(familyId)
				setSavedPreviewUrl(previewImageUrl)
			} catch (e) {
				setAssignmentError(e)
			} finally {
				setIsSavingCapture(false)
			}
		},
		[
			addQueenToHive,
			addWarehouseQueen,
			assignQueenFromWarehouse,
			assignmentMode,
			bestCapture,
			hasHiveContext,
			inspectedHiveId,
			isSavingCapture,
			newQueenName,
			newQueenRace,
			newQueenYear,
			queenOptions,
			selectedQueenId,
			uploadQueenPreview,
		]
	)

	const canSwitchCameras = isCameraActive && cameraDevices.length > 1
	const cameraSwitchTitle =
		cameraDevices.length > 1
			? `${switchCameraTitle} (${cameraDevices.length})`
			: switchCameraTitle
	const bestCaptureBoxStyle = bestCapture
		? (() => {
				const left = Math.max(
					0,
					Math.min(
						100,
						(bestCapture.detection.box[0] / bestCapture.videoWidth) * 100
					)
				)
				const top = Math.max(
					0,
					Math.min(
						100,
						(bestCapture.detection.box[1] / bestCapture.videoHeight) * 100
					)
				)
				const width = Math.max(
					0,
					Math.min(
						100 - left,
						((bestCapture.detection.box[2] - bestCapture.detection.box[0]) /
							bestCapture.videoWidth) *
							100
					)
				)
				const height = Math.max(
					0,
					Math.min(
						100 - top,
						((bestCapture.detection.box[3] - bestCapture.detection.box[1]) /
							bestCapture.videoHeight) *
							100
					)
				)

				return {
					left: `${left}%`,
					top: `${top}%`,
					width: `${width}%`,
					height: `${height}%`,
				}
		  })()
		: undefined
	const selectedQueen = queenOptions.find(
		(option) => option.id === selectedQueenId
	)
	const hasCompletedDetection = !isCameraActive && Boolean(bestCapture)

	return (
		<div className={styles.page}>
			{hasHiveContext && (
				<div className={styles.headerRow}>
					<p className={styles.contextNote}>
						<T>Inspection context</T>: <T>hive</T> #{inspectedHiveId}
					</p>
				</div>
			)}

			<ErrorMsg
				error={
					error ||
					assignmentError ||
					warehouseError ||
					addWarehouseQueenError ||
					addQueenToHiveError ||
					assignQueenFromWarehouseError ||
					uploadQueenPreviewError
				}
			/>
			<div className={styles.cameraPanel}>
				<div
					className={`${styles.videoWrap} ${
						hasCompletedDetection ? styles.videoWrapCompact : ''
					}`}
				>
					<video
						ref={videoRef}
						className={styles.sourceVideo}
						muted
						playsInline
					/>
					<canvas ref={previewCanvasRef} className={styles.previewCanvas} />
					{isCameraActive && (
						<div className={styles.cameraControls}>
							<Button color="red" onClick={stopCamera}>
								<T>Stop camera</T>
							</Button>
						</div>
					)}
					{canSwitchCameras && (
						<Button
							className={styles.cameraSwitchButton}
							iconOnly
							title={cameraSwitchTitle}
							onClick={switchCamera}
							loading={isSwitchingCamera}
							disabled={isModelLoading}
						>
							<RefreshIcon width={20} height={20} />
						</Button>
					)}
					{!isCameraActive && (
						<div
							className={`${styles.placeholder} ${
								hasCompletedDetection ? styles.placeholderCompact : ''
							}`}
						>
							{!hasCompletedDetection && (
								<p className={styles.privacyNote}>
									<T>
										Use the camera to detect a queen bee directly in the
										browser. Keep the frame steady and well lit.
									</T>
								</p>
							)}
							<Button
								color="green"
								onClick={() => startCamera(selectedCameraDeviceId || undefined)}
								loading={isModelLoading}
							>
								<T>Detect queen</T>
							</Button>
							{!hasCompletedDetection && (
								<p className={styles.privacyNote}>
									<T>Your video stream is private and is not sent anywhere.</T>
								</p>
							)}
						</div>
					)}
				</div>
			</div>
			{hasCompletedDetection && bestCapture && (
				<QueenDetectorAssignmentPanel
					bestCapture={bestCapture}
					bestCaptureBoxStyle={bestCaptureBoxStyle}
					hasHiveContext={hasHiveContext}
					assignmentMode={assignmentMode}
					setAssignmentMode={setAssignmentMode}
					queenOptions={queenOptions}
					selectedQueenId={selectedQueenId}
					setSelectedQueenId={setSelectedQueenId}
					selectedQueen={selectedQueen}
					newQueenName={newQueenName}
					setNewQueenName={setNewQueenName}
					newQueenYear={newQueenYear}
					setNewQueenYear={setNewQueenYear}
					newQueenRace={newQueenRace}
					setNewQueenRace={setNewQueenRace}
					isSavingCapture={isSavingCapture}
					savedFamilyId={savedFamilyId}
					savedPreviewUrl={savedPreviewUrl}
					clearSaveResult={clearSaveResult}
					onSaveBestCapture={onSaveBestCapture}
				/>
			)}

			<canvas ref={inferenceCanvasRef} className={styles.captureCanvas} />
		</div>
	)
}
