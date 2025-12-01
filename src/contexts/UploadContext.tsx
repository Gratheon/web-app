import { createContext } from 'preact'
import { useContext, useState } from 'preact/hooks'
import { ComponentChildren } from 'preact'

type ImagePreview = {
	file: File
	previewUrl: string
	frameSideId?: number
	uploadProgress?: number
	uploaded?: boolean
	error?: string
}

type UploadContextType = {
	isUploading: boolean
	images: ImagePreview[]
	uploadProgress: number
	boxId: number | null
	hiveId: number | null
	apiaryId: number | null
	startUpload: (boxId: number, hiveId: number, apiaryId: number, images: ImagePreview[]) => void
	updateImageProgress: (index: number, progress: number) => void
	markImageComplete: (index: number, frameSideId: number) => void
	markImageError: (index: number, error: string) => void
	cancelUpload: () => void
	completeUpload: () => void
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: ComponentChildren }) {
	const [isUploading, setIsUploading] = useState(false)
	const [images, setImages] = useState<ImagePreview[]>([])
	const [boxId, setBoxId] = useState<number | null>(null)
	const [hiveId, setHiveId] = useState<number | null>(null)
	const [apiaryId, setApiaryId] = useState<number | null>(null)

	const uploadProgress = images.length > 0
		? images.reduce((sum, img) => sum + (img.uploadProgress || 0), 0) / images.length
		: 0

	const startUpload = (newBoxId: number, newHiveId: number, newApiaryId: number, newImages: ImagePreview[]) => {
		setBoxId(newBoxId)
		setHiveId(newHiveId)
		setApiaryId(newApiaryId)
		setImages(newImages)
		setIsUploading(true)
	}

	const updateImageProgress = (index: number, progress: number) => {
		setImages(prev => {
			const updated = [...prev]
			updated[index] = { ...updated[index], uploadProgress: progress }
			return updated
		})
	}

	const markImageComplete = (index: number, frameSideId: number) => {
		setImages(prev => {
			const updated = [...prev]
			updated[index] = { ...updated[index], uploaded: true, uploadProgress: 100, frameSideId }
			return updated
		})
	}

	const markImageError = (index: number, error: string) => {
		setImages(prev => {
			const updated = [...prev]
			updated[index] = { ...updated[index], error }
			return updated
		})
	}

	const cancelUpload = () => {
		images.forEach(img => URL.revokeObjectURL(img.previewUrl))
		setIsUploading(false)
		setImages([])
		setBoxId(null)
		setHiveId(null)
		setApiaryId(null)
	}

	const completeUpload = () => {
		images.forEach(img => URL.revokeObjectURL(img.previewUrl))
		setIsUploading(false)
		setImages([])
		setBoxId(null)
		setHiveId(null)
		setApiaryId(null)
	}

	return (
		<UploadContext.Provider
			value={{
				isUploading,
				images,
				uploadProgress,
				boxId,
				hiveId,
				apiaryId,
				startUpload,
				updateImageProgress,
				markImageComplete,
				markImageError,
				cancelUpload,
				completeUpload,
			}}
		>
			{children}
		</UploadContext.Provider>
	)
}

export function useUploadContext() {
	const context = useContext(UploadContext)
	if (context === undefined) {
		throw new Error('useUploadContext must be used within an UploadProvider')
	}
	return context
}

