import { useCallback, useEffect, useRef, useState } from 'react'
import type * as Ort from 'onnxruntime-web/wasm'
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'

import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import T from '@/shared/translate'
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

const CAPTURE_INTERVAL_MS = 700
const MODEL_SIZE = 512
const MODEL_URL = '/models/queen-bee-detector/best.onnx'
const CONFIDENCE_THRESHOLD = 0.35
const NMS_IOU_THRESHOLD = 0.45
const MAX_DETECTIONS = 5

function detectionLabel(detection: Detection) {
	const confidence = Math.round(detection.confidence * 100)
	return `${detection.class_name} ${confidence}%`
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

export default function QueenDetectorPage() {
	const videoRef = useRef<HTMLVideoElement | null>(null)
	const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const inferenceCanvasRef = useRef<HTMLCanvasElement | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const timerRef = useRef<number | null>(null)
	const animationFrameRef = useRef<number | null>(null)
	const isDetectingRef = useRef(false)
	const detectionsRef = useRef<Detection[]>([])
	const sessionRef = useRef<QueenDetectorSession | null>(null)

	const [isCameraActive, setIsCameraActive] = useState(false)
	const [isModelLoading, setIsModelLoading] = useState(false)
	const [isDetecting, setIsDetecting] = useState(false)
	const [detections, setDetections] = useState<Detection[]>([])
	const [error, setError] = useState<any>(null)
	const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

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
		context.lineWidth = Math.max(3, canvas.width / 220)
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
			const inputName = session.inputNames[0]
			const outputName = session.outputNames[0]
			const feeds = {
				[inputName]: new ort.Tensor('float32', preprocessed.data, [1, 3, MODEL_SIZE, MODEL_SIZE]),
			}
			const output = await session.run(feeds)
			const items = parseDetections(output[outputName], video.videoWidth, video.videoHeight, preprocessed)

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
	}, [drawPreview])

	const startCamera = useCallback(async () => {
		try {
			setError(null)
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: { ideal: 'environment' },
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
				audio: false,
			})

			streamRef.current = stream
			if (videoRef.current) {
				videoRef.current.srcObject = stream
				await videoRef.current.play()
			}

			setIsCameraActive(true)
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
	}, [detectFrame, startPreviewLoop, stopCamera])

	useEffect(() => stopCamera, [stopCamera])

	const queenDetections = detections.filter((detection) => detection.class_name.toLowerCase().includes('queen'))
	const statusText = isModelLoading ? <T>Loading queen detector model...</T> : isDetecting ? <T>Detecting frame...</T> : <T>Waiting for next frame</T>

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<div>
					<h2><T>Queen finder</T></h2>
					<p className={styles.description}>
						<T>Use the camera to detect a queen bee directly in the browser. Keep the frame steady and well lit.</T>
					</p>
				</div>
				<div className={styles.actions}>
					<Button href="/warehouse/queens"><T>Back to queens</T></Button>
					{isCameraActive ? (
						<Button color="red" onClick={stopCamera}><T>Stop camera</T></Button>
					) : (
						<Button color="green" onClick={startCamera} loading={isModelLoading}><T>Start camera</T></Button>
					)}
				</div>
			</div>

			<ErrorMsg error={error} />

			{import.meta.env.DEV && (
				<div className={styles.endpointNote}>
					<T>Detector model</T>: <code>{MODEL_URL}</code>
				</div>
			)}

			<div className={styles.cameraPanel}>
				<div className={styles.videoWrap}>
					<video ref={videoRef} className={styles.sourceVideo} muted playsInline />
					<canvas ref={previewCanvasRef} className={styles.previewCanvas} />
					{!isCameraActive && (
						<div className={styles.placeholder}>
							<T>Start the camera to begin queen detection.</T>
						</div>
					)}
				</div>

				<aside className={styles.resultsPanel}>
					<h3><T>Live results</T></h3>
					<div className={styles.statusRow}>
						<span className={isDetecting || isModelLoading ? styles.statusActive : styles.statusIdle} />
						{statusText}
					</div>
					<div className={styles.metric}>
						<strong>{queenDetections.length}</strong>
						<span><T>queen detections</T></span>
					</div>
					{lastUpdatedAt && <p className={styles.updated}><T>Last update</T>: {lastUpdatedAt}</p>}
					<ul className={styles.detectionList}>
						{detections.map((detection, index) => (
							<li key={`${detection.class_name}-${index}`}>
								<span>{detection.class_name}</span>
								<strong>{Math.round(detection.confidence * 100)}%</strong>
							</li>
						))}
						{detections.length === 0 && <li><T>No detections yet.</T></li>}
					</ul>
				</aside>
			</div>

			<canvas ref={inferenceCanvasRef} className={styles.captureCanvas} />
		</div>
	)
}
