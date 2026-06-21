import type {
	BestCapture,
	CapturedVideoFrame,
	Detection,
	QueenOption,
} from './queenDetector.types'

export function detectionLabel(detection: Detection) {
	const confidence = Math.round(detection.confidence * 100)
	return `${detection.class_name} ${confidence}%`
}

export function captureVideoFrame(
	video: HTMLVideoElement
): CapturedVideoFrame | null {
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

export async function canvasToJpegBlob(
	canvas: HTMLCanvasElement
): Promise<Blob | null> {
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

export async function cropBestCapture(
	capture: BestCapture
): Promise<Blob | null> {
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
	const sx = Math.max(
		0,
		Math.min(imageWidth - cropSize, Math.round(centerX - cropSize / 2))
	)
	const sy = Math.max(
		0,
		Math.min(imageHeight - cropSize, Math.round(centerY - cropSize / 2))
	)

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

export function formatQueenOption(option: QueenOption) {
	const name = option.name || `#${option.id}`
	const year = option.added ? ` (${option.added})` : ''
	const source = option.source === 'HIVE' ? ' — this hive' : ' — warehouse'
	return `${name}${year}${source}`
}
