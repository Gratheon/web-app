import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type * as Ort from 'onnxruntime-web/wasm'
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'

import { gql, useMutation, useQuery, useUploadMutation } from '@/api'
import RefreshIcon from '@/icons/RefreshIcon'
import { getAllFamiliesByHive, getFamilyById, updateFamily } from '@/models/family'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import T, { useTranslation } from '@/shared/translate'
import styles from './queenDetector.module.less'

type Detection = {
	class_id: number
	class_name: string
	confidence: number
	box: [number, number, number, number]
}

type QueenDetectorSession = Ort.InferenceSession

type CandidateBox = Detection & {
	area: number
}

type PreprocessedFrame = {
	data: Float32Array
	scale: number
	paddingX: number
	paddingY: number
}

type CapturedVideoFrame = {
	canvas: HTMLCanvasElement
	videoWidth: number
	videoHeight: number
}

type BestCapture = {
	imageBlob: Blob
	imageUrl: string
	detection: Detection
	confidence: number
	capturedAt: string
	videoWidth: number
	videoHeight: number
}

type QueenOption = {
	id: string
	name?: string | null
	race?: string | null
	added?: string | null
	color?: string | null
	source: 'HIVE' | 'WAREHOUSE'
}

type AssignMode = 'existing' | 'new'

const CAPTURE_INTERVAL_MS = 700
const MODEL_SIZE = 512
const MODEL_URL = '/models/queen-bee-detector/best.onnx'
const CONFIDENCE_THRESHOLD = 0.35
const NMS_IOU_THRESHOLD = 0.45
const MAX_DETECTIONS = 5
const VIRTUAL_CAMERA_LABEL_PATTERNS = [
	/\bvirtual\b/i,
	/\bobs\b/i,
	/snap camera/i,
	/manycam/i,
	/xsplit/i,
	/\bndi\b/i,
	/camtwist/i,
	/mmhmm/i,
	/youcam/i,
	/droidcam/i,
	/epoccam/i,
	/\bcamo\b/i,
	/ecamm/i,
	/webcamoid/i,
]

const WAREHOUSE_QUEENS_QUERY = gql`
query WarehouseQueensForDetector {
	warehouseQueens {
		id
		name
		race
		added
		color
	}
}
`

const ADD_WAREHOUSE_QUEEN_MUTATION = gql`
mutation addWarehouseQueen($queen: FamilyInput!) {
	addWarehouseQueen(queen: $queen) {
		id
	}
}
`

const ADD_QUEEN_TO_HIVE_MUTATION = gql`
mutation addQueenToHive($hiveId: ID!, $queen: FamilyInput!) {
	addQueenToHive(hiveId: $hiveId, queen: $queen) {
		id
		name
		race
		added
		color
	}
}
`

const ASSIGN_QUEEN_FROM_WAREHOUSE_MUTATION = gql`
mutation assignQueenFromWarehouse($hiveId: ID!, $familyId: ID!) {
	assignQueenFromWarehouse(hiveId: $hiveId, familyId: $familyId) {
		id
		name
		race
		added
		color
	}
}
`

const UPLOAD_QUEEN_PREVIEW_MUTATION = gql`
mutation uploadQueenPreview($file: Upload!) {
	uploadFrameSide(file: $file) {
		id
		url
	}
}
`

function detectionLabel(detection: Detection) {
	const confidence = Math.round(detection.confidence * 100)
	return `${detection.class_name} ${confidence}%`
}

function normalizeCameraLabel(label: string) {
	return label.trim().toLowerCase().replace(/^default\s*[-:]\s*/, '')
}

function isVirtualCamera(device: MediaDeviceInfo) {
	const label = normalizeCameraLabel(device.label || '')
	if (!label) return false

	return VIRTUAL_CAMERA_LABEL_PATTERNS.some((pattern) => pattern.test(label))
}

function isSelectablePhysicalCamera(device: MediaDeviceInfo) {
	return (
		device.kind === 'videoinput' &&
		Boolean(device.deviceId) &&
		device.deviceId !== 'default' &&
		device.deviceId !== 'communications' &&
		!isVirtualCamera(device)
	)
}

function dedupeCameraDevices(cameras: MediaDeviceInfo[]) {
	const seen = new Set<string>()

	return cameras.filter((camera) => {
		const key = camera.deviceId || `${normalizeCameraLabel(camera.label)}-${camera.groupId}`
		if (!key || seen.has(key)) return false

		seen.add(key)
		return true
	})
}

async function listPhysicalCameraDevices() {
	if (!navigator.mediaDevices?.enumerateDevices) return []

	const devices = await navigator.mediaDevices.enumerateDevices()
	return dedupeCameraDevices(devices.filter(isSelectablePhysicalCamera))
}

function resolveActiveCameraDeviceId(
	cameras: MediaDeviceInfo[],
	stream: MediaStream,
	requestedCameraDeviceId?: string
) {
	const [track] = stream.getVideoTracks()
	const settingsDeviceId = track?.getSettings?.().deviceId
	if (settingsDeviceId && cameras.some((camera) => camera.deviceId === settingsDeviceId)) {
		return settingsDeviceId
	}

	if (requestedCameraDeviceId && cameras.some((camera) => camera.deviceId === requestedCameraDeviceId)) {
		return requestedCameraDeviceId
	}

	const activeLabel = normalizeCameraLabel(track?.label || '')
	if (activeLabel) {
		const activeCamera = cameras.find((camera) => normalizeCameraLabel(camera.label || '') === activeLabel)
		if (activeCamera) return activeCamera.deviceId
	}

	return cameras[0]?.deviceId || null
}

function getVideoConstraints(cameraDeviceId?: string): MediaTrackConstraints {
	const constraints: MediaTrackConstraints = {
		width: { ideal: 1280 },
		height: { ideal: 720 },
	}

	if (cameraDeviceId) {
		constraints.deviceId = { exact: cameraDeviceId }
	} else {
		constraints.facingMode = { ideal: 'environment' }
	}

	return constraints
}

function getOutputValue(data: Float32Array, boxIndex: number, fieldIndex: number, boxCount: number) {
	return data[fieldIndex * boxCount + boxIndex]
}

function intersectionOverUnion(a: CandidateBox, b: CandidateBox) {
	const [ax1, ay1, ax2, ay2] = a.box
	const [bx1, by1, bx2, by2] = b.box
	const x1 = Math.max(ax1, bx1)
	const y1 = Math.max(ay1, by1)
	const x2 = Math.min(ax2, bx2)
	const y2 = Math.min(ay2, by2)
	const width = Math.max(0, x2 - x1)
	const height = Math.max(0, y2 - y1)
	const intersection = width * height
	const union = a.area + b.area - intersection

	return union > 0 ? intersection / union : 0
}

function nonMaximumSuppression(candidates: CandidateBox[]) {
	const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence)
	const selected: CandidateBox[] = []

	for (const candidate of sorted) {
		const overlapsSelected = selected.some((item) => intersectionOverUnion(candidate, item) > NMS_IOU_THRESHOLD)
		if (!overlapsSelected) {
			selected.push(candidate)
		}

		if (selected.length >= MAX_DETECTIONS) break
	}

	return selected.map(({ area, ...detection }) => detection)
}

function preprocessFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): PreprocessedFrame {
	canvas.width = MODEL_SIZE
	canvas.height = MODEL_SIZE

	const context = canvas.getContext('2d', { willReadFrequently: true })
	if (!context) throw new Error('Canvas is not available')

	const scale = Math.min(MODEL_SIZE / video.videoWidth, MODEL_SIZE / video.videoHeight)
	const width = Math.round(video.videoWidth * scale)
	const height = Math.round(video.videoHeight * scale)
	const paddingX = Math.round((MODEL_SIZE - width) / 2)
	const paddingY = Math.round((MODEL_SIZE - height) / 2)

	context.fillStyle = '#727272'
	context.fillRect(0, 0, MODEL_SIZE, MODEL_SIZE)
	context.drawImage(video, paddingX, paddingY, width, height)

	const imageData = context.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data
	const tensorData = new Float32Array(3 * MODEL_SIZE * MODEL_SIZE)
	const channelSize = MODEL_SIZE * MODEL_SIZE

	for (let pixelIndex = 0; pixelIndex < channelSize; pixelIndex += 1) {
		const sourceIndex = pixelIndex * 4
		tensorData[pixelIndex] = imageData[sourceIndex] / 255
		tensorData[channelSize + pixelIndex] = imageData[sourceIndex + 1] / 255
		tensorData[channelSize * 2 + pixelIndex] = imageData[sourceIndex + 2] / 255
	}

	return {
		data: tensorData,
		scale,
		paddingX,
		paddingY,
	}
}

function parseDetections(output: Ort.Tensor, videoWidth: number, videoHeight: number, frame: PreprocessedFrame): Detection[] {
	const data = output.data as Float32Array
	const dimensions = output.dims
	const boxCount = dimensions[2] || dimensions[1]
	const fieldCount = dimensions[1] || 5
	const candidates: CandidateBox[] = []

	if (!boxCount || fieldCount < 5) {
		throw new Error(`Unexpected queen detector output shape: ${dimensions.join('x')}`)
	}

	for (let index = 0; index < boxCount; index += 1) {
		const confidence = getOutputValue(data, index, 4, boxCount)
		if (confidence < CONFIDENCE_THRESHOLD) continue

		const centerX = getOutputValue(data, index, 0, boxCount)
		const centerY = getOutputValue(data, index, 1, boxCount)
		const width = getOutputValue(data, index, 2, boxCount)
		const height = getOutputValue(data, index, 3, boxCount)
		const x1 = Math.max(0, (centerX - width / 2 - frame.paddingX) / frame.scale)
		const y1 = Math.max(0, (centerY - height / 2 - frame.paddingY) / frame.scale)
		const x2 = Math.min(videoWidth, (centerX + width / 2 - frame.paddingX) / frame.scale)
		const y2 = Math.min(videoHeight, (centerY + height / 2 - frame.paddingY) / frame.scale)
		const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)

		if (area <= 0) continue

		candidates.push({
			class_id: 0,
			class_name: 'queen',
			confidence,
			box: [x1, y1, x2, y2],
			area,
		})
	}

	return nonMaximumSuppression(candidates)
}

async function createDetectorSession(): Promise<QueenDetectorSession> {
	const ort = await import('onnxruntime-web/wasm')
	ort.env.wasm.numThreads = 1
	ort.env.wasm.wasmPaths = {
		wasm: ortWasmUrl,
	}

	return ort.InferenceSession.create(MODEL_URL, {
		executionProviders: ['wasm'],
		graphOptimizationLevel: 'all',
	})
}

function captureVideoFrame(video: HTMLVideoElement): CapturedVideoFrame | null {
	if (!video.videoWidth || !video.videoHeight) return null

	const canvas = document.createElement('canvas')
	canvas.width = video.videoWidth
	canvas.height = video.videoHeight
	const context = canvas.getContext('2d')
	if (!context) return null

	context.drawImage(video, 0, 0, canvas.width, canvas.height)
	return {
		canvas,
		videoWidth: video.videoWidth,
		videoHeight: video.videoHeight,
	}
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
	return await new Promise((resolve) => {
		canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
	})
}

async function loadImageElement(url: string): Promise<HTMLImageElement> {
	return await new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.onerror = (error) => reject(error)
		img.src = url
	})
}

async function cropBestCapture(capture: BestCapture): Promise<Blob | null> {
	const image = await loadImageElement(capture.imageUrl)
	const imageWidth = image.naturalWidth || capture.videoWidth
	const imageHeight = image.naturalHeight || capture.videoHeight
	const [x1, y1, x2, y2] = capture.detection.box
	const boxWidth = Math.max(1, x2 - x1)
	const boxHeight = Math.max(1, y2 - y1)
	const centerX = Math.max(0, Math.min(imageWidth, (x1 + x2) / 2))
	const centerY = Math.max(0, Math.min(imageHeight, (y1 + y2) / 2))
	const cropSize = Math.min(
		imageWidth,
		imageHeight,
		Math.max(160, Math.round(Math.max(boxWidth, boxHeight) * 2.4))
	)
	const sx = Math.max(0, Math.min(imageWidth - cropSize, Math.round(centerX - cropSize / 2)))
	const sy = Math.max(0, Math.min(imageHeight - cropSize, Math.round(centerY - cropSize / 2)))

	const canvas = document.createElement('canvas')
	canvas.width = cropSize
	canvas.height = cropSize
	const context = canvas.getContext('2d')
	if (!context) return null

	context.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize)

	return await new Promise((resolve) => {
		canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
	})
}

function formatQueenOption(option: QueenOption) {
	const name = option.name || `#${option.id}`
	const year = option.added ? ` (${option.added})` : ''
	const source = option.source === 'HIVE' ? ' — this hive' : ' — warehouse'
	return `${name}${year}${source}`
}

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
	const [isDetecting, setIsDetecting] = useState(false)
	const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState<string | null>(null)
	const [isSwitchingCamera, setIsSwitchingCamera] = useState(false)
	const [detections, setDetections] = useState<Detection[]>([])
	const [bestCapture, setBestCapture] = useState<BestCapture | null>(null)
	const [assignmentMode, setAssignmentMode] = useState<AssignMode>('existing')
	const [selectedQueenId, setSelectedQueenId] = useState('')
	const [newQueenName, setNewQueenName] = useState('')
	const [newQueenRace, setNewQueenRace] = useState('')
	const [newQueenYear, setNewQueenYear] = useState(String(new Date().getFullYear()))
	const [isSavingCapture, setIsSavingCapture] = useState(false)
	const [savedFamilyId, setSavedFamilyId] = useState<string | null>(null)
	const [savedPreviewUrl, setSavedPreviewUrl] = useState<string | null>(null)
	const [assignmentError, setAssignmentError] = useState<any>(null)
	const [error, setError] = useState<any>(null)
	const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
	const switchCameraTitle = useTranslation('Switch camera')

	const { data: warehouseData, error: warehouseError } = useQuery(WAREHOUSE_QUEENS_QUERY)
	const hiveFamilies = useLiveQuery(
		() => (hasHiveContext ? getAllFamiliesByHive(inspectedHiveId) : Promise.resolve([])),
		[hasHiveContext, inspectedHiveId],
		[]
	)
	const [addWarehouseQueen, { error: addWarehouseQueenError }] = useMutation(ADD_WAREHOUSE_QUEEN_MUTATION)
	const [addQueenToHive, { error: addQueenToHiveError }] = useMutation(ADD_QUEEN_TO_HIVE_MUTATION)
	const [assignQueenFromWarehouse, { error: assignQueenFromWarehouseError }] = useMutation(ASSIGN_QUEEN_FROM_WAREHOUSE_MUTATION)
	const [uploadQueenPreview, uploadQueenPreviewResult] = useUploadMutation(UPLOAD_QUEEN_PREVIEW_MUTATION) as [any, any]
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

		if (!selectedQueenId || !queenOptions.some((option) => option.id === selectedQueenId)) {
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

	const drawPreview = useCallback((items: Detection[]) => {
		const video = videoRef.current
		const canvas = previewCanvasRef.current
		if (!video || !canvas || !video.videoWidth || !video.videoHeight) return

		if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
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
		setDetections([])
		setIsCameraActive(false)
		setIsDetecting(false)
		isDetectingRef.current = false
	}, [stopPreviewLoop])

	const captureBestFrameIfNeeded = useCallback(async (detection: Detection, frame: CapturedVideoFrame | null) => {
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
	}, [])

	const detectFrame = useCallback(async () => {
		if (isDetectingRef.current) return

		const video = videoRef.current
		const canvas = inferenceCanvasRef.current
		const session = sessionRef.current
		if (!video || !canvas || !session || !video.videoWidth || !video.videoHeight) return

		isDetectingRef.current = true
		setIsDetecting(true)

		try {
			const ort = await import('onnxruntime-web/wasm')
			const preprocessed = preprocessFrame(video, canvas)
			const sourceFrame = await captureVideoFrame(video)
			const inputName = session.inputNames[0]
			const outputName = session.outputNames[0]
			const feeds = {
				[inputName]: new ort.Tensor('float32', preprocessed.data, [1, 3, MODEL_SIZE, MODEL_SIZE]),
			}
			const output = await session.run(feeds)
			const items = parseDetections(output[outputName], video.videoWidth, video.videoHeight, preprocessed)
			const bestQueenDetection = items
				.filter((item) => item.class_name.toLowerCase().includes('queen'))
				.sort((a, b) => b.confidence - a.confidence)[0]

			if (bestQueenDetection) {
				await captureBestFrameIfNeeded(bestQueenDetection, sourceFrame)
			}

			detectionsRef.current = items
			setDetections(items)
			drawPreview(items)
			setLastUpdatedAt(new Date().toLocaleTimeString())
			setError(null)
		} catch (e) {
			setError(e)
		} finally {
			isDetectingRef.current = false
			setIsDetecting(false)
		}
	}, [captureBestFrameIfNeeded, drawPreview])

	const startCamera = useCallback(async (cameraDeviceId?: string, shouldResetCapture = true) => {
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
				setSelectedCameraDeviceId(resolveActiveCameraDeviceId(cameras, stream, cameraDeviceId))
			} catch {
				setCameraDevices([])
				setSelectedCameraDeviceId(null)
			}
			startPreviewLoop()
			setIsModelLoading(true)
			sessionRef.current = sessionRef.current || (await createDetectorSession())
			if (!streamRef.current) return

			timerRef.current = window.setInterval(detectFrame, CAPTURE_INTERVAL_MS)
			window.setTimeout(detectFrame, 250)
		} catch (e) {
			setError(e)
			stopCamera()
		} finally {
			setIsModelLoading(false)
		}
	}, [clearBestCapture, detectFrame, startPreviewLoop, stopCamera])

	const switchCamera = useCallback(async () => {
		if (cameraDevices.length <= 1 || isModelLoading || isSwitchingCamera) return

		const currentIndex = cameraDevices.findIndex((camera) => camera.deviceId === selectedCameraDeviceId)
		const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % cameraDevices.length : 0
		const nextCamera = cameraDevices[nextIndex]
		if (!nextCamera?.deviceId) return

		setIsSwitchingCamera(true)
		try {
			await startCamera(nextCamera.deviceId, false)
		} finally {
			setIsSwitchingCamera(false)
		}
	}, [cameraDevices, isModelLoading, isSwitchingCamera, selectedCameraDeviceId, startCamera])

	useEffect(() => {
		return () => {
			stopCamera()
			if (bestCaptureUrlRef.current) {
				URL.revokeObjectURL(bestCaptureUrlRef.current)
			}
		}
	}, [stopCamera])

	const onSaveBestCapture = useCallback(async (event: any) => {
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
				throw uploadResult?.error || new Error('Failed to upload queen preview image.')
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
						throw result?.error || new Error('Failed to create queen in this hive.')
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
						throw result?.error || new Error('Failed to create warehouse queen.')
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
				const selectedQueen = queenOptions.find((option) => option.id === selectedQueenId)
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
						throw result?.error || new Error('Failed to assign warehouse queen to this hive.')
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
	}, [
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
	])

	const queenDetections = detections.filter((detection) => detection.class_name.toLowerCase().includes('queen'))
	const statusText = isModelLoading ? <T>Loading queen detector model...</T> : isDetecting ? <T>Detecting frame...</T> : <T>Waiting for next frame</T>
	const canSwitchCameras = isCameraActive && cameraDevices.length > 1
	const cameraSwitchTitle = cameraDevices.length > 1 ? `${switchCameraTitle} (${cameraDevices.length})` : switchCameraTitle
	const bestCaptureBoxStyle = bestCapture ? {
		left: `${Math.max(0, (bestCapture.detection.box[0] / bestCapture.videoWidth) * 100)}%`,
		top: `${Math.max(0, (bestCapture.detection.box[1] / bestCapture.videoHeight) * 100)}%`,
		width: `${Math.max(0, ((bestCapture.detection.box[2] - bestCapture.detection.box[0]) / bestCapture.videoWidth) * 100)}%`,
		height: `${Math.max(0, ((bestCapture.detection.box[3] - bestCapture.detection.box[1]) / bestCapture.videoHeight) * 100)}%`,
	} : undefined
	const selectedQueen = queenOptions.find((option) => option.id === selectedQueenId)

	return (
		<div className={styles.page}>
			{hasHiveContext && (
				<div className={styles.headerRow}>
					<p className={styles.contextNote}>
						<T>Inspection context</T>: <T>hive</T> #{inspectedHiveId}
					</p>
				</div>
			)}

			<ErrorMsg error={error || assignmentError || warehouseError || addWarehouseQueenError || addQueenToHiveError || assignQueenFromWarehouseError || uploadQueenPreviewError} />

			<div className={styles.cameraPanel}>
				<div className={styles.videoWrap}>
					<video ref={videoRef} className={styles.sourceVideo} muted playsInline />
					<canvas ref={previewCanvasRef} className={styles.previewCanvas} />
					{isCameraActive && (
						<div className={styles.cameraControls}>
							<Button color="red" onClick={stopCamera}><T>Stop camera</T></Button>
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
						<div className={styles.placeholder}>
							<p className={styles.privacyNote}>
								<T>Use the camera to detect a queen bee directly in the browser. Keep the frame steady and well lit.</T>
							</p>
							<Button color="green" onClick={() => startCamera(selectedCameraDeviceId || undefined)} loading={isModelLoading}>
								<T>Start camera</T>
							</Button>
							<p className={styles.privacyNote}>
								<T>Your video stream is private and is not sent anywhere.</T>
							</p>
						</div>
					)}
				</div>
			</div>
			{!isCameraActive && bestCapture && (
				<section className={styles.bestCapturePanel}>
					<div className={styles.bestCaptureHeader}>
						<div>
							<h3><T>Best confidence capture</T></h3>
							<p>
								<T>This frame stayed only in your browser until you assign it to a queen.</T>
							</p>
						</div>
						<span className={styles.captureBadge}>{Math.round(bestCapture.confidence * 100)}%</span>
					</div>

					<div className={styles.bestCaptureContent}>
						<div className={styles.bestCaptureFrame}>
							<img className={styles.bestCaptureImage} src={bestCapture.imageUrl} alt="Best confidence queen capture" draggable={false} />
							{bestCaptureBoxStyle && (
								<div className={styles.bestCaptureBox} style={bestCaptureBoxStyle}>
									<span>{detectionLabel(bestCapture.detection)}</span>
								</div>
							)}
						</div>

						<form className={styles.assignmentPanel} onSubmit={onSaveBestCapture}>
							<h3><T>Assign this capture</T></h3>
							<p className={styles.assignmentHint}>
								{hasHiveContext ? (
									<T>Save a cropped queen image for a new or existing queen in this hive.</T>
								) : (
									<T>Save a cropped queen image for a new or existing warehouse queen.</T>
								)}
							</p>

							<div className={styles.modeSwitch}>
								<Button
									type="button"
									className={`${styles.modeButton} ${assignmentMode === 'existing' ? styles.activeMode : ''}`}
									disabled={!queenOptions.length}
									onClick={() => setAssignmentMode('existing')}
								>
									<T>Existing queen</T>
								</Button>
								<Button
									type="button"
									className={`${styles.modeButton} ${assignmentMode === 'new' ? styles.activeMode : ''}`}
									onClick={() => setAssignmentMode('new')}
								>
									<T>New queen</T>
								</Button>
							</div>

							{assignmentMode === 'existing' ? (
								<div className={styles.formField}>
									<label><T>Select Queen</T></label>
									<select
										className={styles.assignmentInput}
										value={selectedQueenId}
										onChange={(event: any) => setSelectedQueenId(event.target.value)}
									>
										{queenOptions.map((option) => (
											<option key={`${option.source}-${option.id}`} value={option.id}>
												{formatQueenOption(option)}
											</option>
										))}
									</select>
									{selectedQueen && (
										<p className={styles.captureMeta}>
											<T>Selected</T>: {selectedQueen.name || `#${selectedQueen.id}`}
										</p>
									)}
								</div>
							) : (
								<div className={styles.formGrid}>
									<div className={styles.formField}>
										<label><T>Queen Name</T></label>
										<input
											className={styles.assignmentInput}
											value={newQueenName}
											onChange={(event: any) => setNewQueenName(event.target.value)}
											placeholder="Queen name"
										/>
									</div>
									<div className={styles.formField}>
										<label><T>Year</T></label>
										<input
											className={styles.assignmentInput}
											value={newQueenYear}
											maxLength={4}
											onChange={(event: any) => setNewQueenYear(event.target.value)}
											placeholder="YYYY"
										/>
									</div>
									<div className={styles.formField}>
										<label><T>Race</T></label>
										<input
											className={styles.assignmentInput}
											value={newQueenRace}
											onChange={(event: any) => setNewQueenRace(event.target.value)}
											placeholder="e.g. Carniolan"
										/>
									</div>
								</div>
							)}

							<div className={styles.assignmentControls}>
								<Button type="submit" color="green" loading={isSavingCapture}>
									<T>Save queen capture</T>
								</Button>
							</div>

							{savedFamilyId && savedPreviewUrl && (
								<div className={styles.saveResult}>
									<T>Saved cropped queen preview for queen</T> #{savedFamilyId}.
								</div>
							)}
						</form>
					</div>
				</section>
			)}

			<canvas ref={inferenceCanvasRef} className={styles.captureCanvas} />
		</div>
	)
}
