import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'
import type * as Ort from 'onnxruntime-web/wasm'

import type {
	CandidateBox,
	Detection,
	PreprocessedFrame,
	QueenDetectorSession,
} from './queenDetector.types'

export const MODEL_SIZE = 512

const MODEL_URL = '/models/queen-bee-detector/best.onnx'
const CONFIDENCE_THRESHOLD = 0.35
const NMS_IOU_THRESHOLD = 0.45
const MAX_DETECTIONS = 5

function getOutputValue(
	data: Float32Array,
	boxIndex: number,
	fieldIndex: number,
	boxCount: number
) {
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
		const overlapsSelected = selected.some(
			(item) => intersectionOverUnion(candidate, item) > NMS_IOU_THRESHOLD
		)
		if (!overlapsSelected) {
			selected.push(candidate)
		}

		if (selected.length >= MAX_DETECTIONS) break
	}

	return selected.map(({ area, ...detection }) => detection)
}

export function preprocessFrame(
	video: HTMLVideoElement,
	canvas: HTMLCanvasElement
): PreprocessedFrame {
	canvas.width = MODEL_SIZE
	canvas.height = MODEL_SIZE

	const context = canvas.getContext('2d', { willReadFrequently: true })
	if (!context) throw new Error('Canvas is not available')

	const scale = Math.min(
		MODEL_SIZE / video.videoWidth,
		MODEL_SIZE / video.videoHeight
	)
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

export function parseDetections(
	output: Ort.Tensor,
	videoWidth: number,
	videoHeight: number,
	frame: PreprocessedFrame
): Detection[] {
	const data = output.data as Float32Array
	const dimensions = output.dims
	const boxCount = dimensions[2] || dimensions[1]
	const fieldCount = dimensions[1] || 5
	const candidates: CandidateBox[] = []

	if (!boxCount || fieldCount < 5) {
		throw new Error(
			`Unexpected queen detector output shape: ${dimensions.join('x')}`
		)
	}

	for (let index = 0; index < boxCount; index += 1) {
		const confidence = getOutputValue(data, index, 4, boxCount)
		if (confidence < CONFIDENCE_THRESHOLD) continue

		const centerX = getOutputValue(data, index, 0, boxCount)
		const centerY = getOutputValue(data, index, 1, boxCount)
		const width = getOutputValue(data, index, 2, boxCount)
		const height = getOutputValue(data, index, 3, boxCount)
		const x1 = Math.max(0, (centerX - width / 2 - frame.paddingX) / frame.scale)
		const y1 = Math.max(
			0,
			(centerY - height / 2 - frame.paddingY) / frame.scale
		)
		const x2 = Math.min(
			videoWidth,
			(centerX + width / 2 - frame.paddingX) / frame.scale
		)
		const y2 = Math.min(
			videoHeight,
			(centerY + height / 2 - frame.paddingY) / frame.scale
		)
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

export async function createDetectorSession(): Promise<QueenDetectorSession> {
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
