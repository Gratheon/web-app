import type * as Ort from 'onnxruntime-web/wasm'

export type Detection = {
	class_id: number
	class_name: string
	confidence: number
	box: [number, number, number, number]
}

export type QueenDetectorSession = Ort.InferenceSession

export type CandidateBox = Detection & {
	area: number
}

export type PreprocessedFrame = {
	data: Float32Array
	scale: number
	paddingX: number
	paddingY: number
}

export type CapturedVideoFrame = {
	canvas: HTMLCanvasElement
	videoWidth: number
	videoHeight: number
}

export type BestCapture = {
	imageBlob: Blob
	imageUrl: string
	detection: Detection
	confidence: number
	capturedAt: string
	videoWidth: number
	videoHeight: number
}

export type QueenOption = {
	id: string
	name?: string | null
	race?: string | null
	added?: string | null
	color?: string | null
	source: 'HIVE' | 'WAREHOUSE'
}

export type AssignMode = 'existing' | 'new'
