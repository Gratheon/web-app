import { useState, useRef } from 'preact/hooks'
import { gql, useUploadMutation, useMutation } from '@/api'
import { updateFile } from '@/models/files.ts'
import { updateFrameSideFile } from '@/models/frameSideFile.ts'
import { useUploadContext } from '@/contexts/UploadContext'
import ErrorMessage from '@/shared/messageError'
import Button from '@/shared/button'
import T from '@/shared/translate'
import UploadIcon from '@/icons/uploadIcon.tsx'
import styles from './index.module.less'
import metrics from '@/metrics.tsx'

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const SUPPORTED_IMAGE_TYPES_STRING = SUPPORTED_IMAGE_TYPES.join(', ')
const MAX_FILE_SIZE_MB = 30
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

type ImagePreview = {
	file: File
	previewUrl: string
	frameSideId?: number
	uploadProgress?: number
	uploaded?: boolean
	error?: string
}

type BulkUploadInlineProps = {
	hiveId: number
	boxId: number
	apiaryId: number
	frames: Array<{
		id: number
		leftId: number
		rightId: number
		position: number
		leftSide?: { frameSideFile?: any }
		rightSide?: { frameSideFile?: any }
	}>
	onComplete?: () => void
}

export default function BulkUploadInline({ hiveId, boxId, apiaryId, frames, onComplete }: BulkUploadInlineProps) {
	const [images, setImages] = useState<ImagePreview[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isExpanded, setIsExpanded] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const dragCounter = useRef(0)
	const uploadContext = useUploadContext()

	const [uploadFile] = useUploadMutation(gql`
		mutation uploadFrameSide($file: Upload!) {
			uploadFrameSide(file: $file) {
				__typename
				id
				url
				resizes {
					__typename
					id
					url
					max_dimension_px
				}
			}
		}
	`)

	const [linkFrameSideToFileMutation] = useMutation(gql`
		mutation addFileToFrameSide($frameSideId: ID!, $fileId: ID!, $hiveId: ID!) { 
			addFileToFrameSide(frameSideId: $frameSideId, fileId: $fileId, hiveId: $hiveId)
		}
	`)

	const availableFrameSides = frames.flatMap(frame => {
		const sides = []
		if (!frame.leftSide?.frameSideFile) {
			sides.push({ frameSideId: frame.leftId, position: frame.position, side: 'left' })
		}
		if (!frame.rightSide?.frameSideFile) {
			sides.push({ frameSideId: frame.rightId, position: frame.position, side: 'right' })
		}
		return sides
	}).sort((a, b) => {
		if (a.position !== b.position) return a.position - b.position
		return a.side === 'left' ? -1 : 1
	})

	const maxImages = availableFrameSides.length

	const handleFileSelect = (files: FileList | null) => {
		if (!files) return

		const fileArray = Array.from(files)
		const validFiles: ImagePreview[] = []
		let errorMsg = ''

		for (const file of fileArray) {
			if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
				errorMsg = `Unsupported file type: ${file.type}`
				continue
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				errorMsg = `File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
				continue
			}

			validFiles.push({
				file,
				previewUrl: URL.createObjectURL(file),
				uploadProgress: 0
			})
		}

		if (errorMsg) {
			setError(new Error(errorMsg))
		} else {
			setError(null)
		}

		setImages(prev => [...prev, ...validFiles].slice(0, maxImages))
		setIsExpanded(true)
	}

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounter.current++
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounter.current--
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounter.current = 0
		handleFileSelect(e.dataTransfer.files)
	}

	const removeImage = (index: number) => {
		setImages(prev => {
			const newImages = [...prev]
			URL.revokeObjectURL(newImages[index].previewUrl)
			newImages.splice(index, 1)
			return newImages
		})
	}

	const moveImage = (fromIndex: number, toIndex: number) => {
		setImages(prev => {
			const newImages = [...prev]
			const [moved] = newImages.splice(fromIndex, 1)
			newImages.splice(toIndex, 0, moved)
			return newImages
		})
	}

	const handleUpload = async () => {
		if (images.length === 0) return

		setIsExpanded(true)
		uploadContext.startUpload(boxId, hiveId, apiaryId, images)

		for (let i = 0; i < images.length; i++) {
			const image = images[i]
			const frameSide = availableFrameSides[i]

			if (!frameSide) {
				uploadContext.markImageError(i, 'No available frame side')
				continue
			}

			try {
				uploadContext.updateImageProgress(i, 10)

				const uploadResult = await uploadFile({ file: image.file })
				const uploadData = uploadResult?.data?.uploadFrameSide

				if (uploadResult?.error || !uploadData) {
					uploadContext.markImageError(i, 'Upload failed')
					continue
				}

				uploadContext.updateImageProgress(i, 50)

				await updateFile({
					id: +uploadData.id,
					url: uploadData.url,
					resizes: uploadData.resizes || []
				})

				uploadContext.updateImageProgress(i, 70)

				const linkResult = await linkFrameSideToFileMutation({
					frameSideId: String(frameSide.frameSideId),
					fileId: String(uploadData.id),
					hiveId: String(hiveId)
				})

				if (linkResult?.error) {
					uploadContext.markImageError(i, 'Failed to link file')
					continue
				}

				uploadContext.updateImageProgress(i, 90)

				await updateFrameSideFile({
					id: +frameSide.frameSideId,
					fileId: +uploadData.id,
					frameSideId: +frameSide.frameSideId,
					strokeHistory: [],
					detectedBees: [],
					detectedCells: [],
					detectedQueenCups: [],
					detectedVarroa: [],
					counts: [],
					detectedQueenCount: 0,
					detectedWorkerBeeCount: 0,
					detectedDroneCount: 0,
					varroaCount: 0
				})

				uploadContext.markImageComplete(i, frameSide.frameSideId)
				metrics.trackFramePhotoUploaded()
			} catch (err) {
				uploadContext.markImageError(i, err instanceof Error ? err.message : 'Upload failed')
			}
		}

		setImages([])
		setIsExpanded(false)

		if (onComplete) {
			setTimeout(() => {
				onComplete()
				uploadContext.completeUpload()
			}, 2000)
		}
	}

	const handleClear = () => {
		images.forEach(img => URL.revokeObjectURL(img.previewUrl))
		setImages([])
		setError(null)
	}

	const canUpload = images.length > 0 && !uploadContext.isUploading

	if (maxImages === 0) {
		return null
	}

	return (
		<div className={styles.bulkUploadInline}>
			<div className={styles.header}>
				<div className={styles.buttonContainer}>
					<Button
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadContext.isUploading}
						color="green"
					>
						<UploadIcon />
						<span><T>Bulk upload frame photos</T></span>
					</Button>
					{maxImages > 0 && !isExpanded && (
						<div className={styles.fileCountHint}>
							<T>Pick up to</T> {maxImages} <T>images</T>
						</div>
					)}
				</div>
				{isExpanded && !uploadContext.isUploading && (
					<button
						className={styles.collapseButton}
						onClick={() => setIsExpanded(false)}
					>
						▼
					</button>
				)}
			</div>

			<input
				ref={fileInputRef}
				type="file"
				multiple
				accept={SUPPORTED_IMAGE_TYPES_STRING}
				onChange={(e) => handleFileSelect(e.target.files)}
				style={{ display: 'none' }}
			/>

			{isExpanded && (
				<div className={styles.expandedContent}>
					<ErrorMessage error={error} />

					<div className={styles.info}>
						<T>Available frame sides without photos</T>: {maxImages}
						{images.length > 0 && (
							<>
								{' • '}
								<T>Selected images</T>: {images.length}
							</>
						)}
						{images.length > maxImages && (
							<>
								<br />
								<span className={styles.warning}>
									⚠️ <T>Too many images selected. Only first</T> {maxImages} <T>will be uploaded</T>.
								</span>
							</>
						)}
						{images.length > 0 && images.length < maxImages && !uploadContext.isUploading && (
							<>
								<br />
								<span className={styles.warning}>
									⚠️ <T>You have fewer images than available frame sides</T>.
								</span>
							</>
						)}
					</div>

					{images.length === 0 && !uploadContext.isUploading && (
						<div
							className={styles.dropZone}
							onDragEnter={handleDragEnter}
							onDragLeave={handleDragLeave}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							onClick={() => fileInputRef.current?.click()}
						>
							<div className={styles.dropZoneContent}>
								<UploadIcon />
								<p><T>Drag and drop images here or click to select</T></p>
								<p className={styles.dropZoneHint}>
									<T>Supported: JPEG, PNG, GIF, WebP</T> • <T>Max</T> {MAX_FILE_SIZE_MB}MB <T>per file</T>
								</p>
							</div>
						</div>
					)}

					{images.length > 0 && (
						<>
							<div className={styles.previewGrid}>
								{images.map((image, index) => {
									const contextImage = uploadContext.images[index]
									const displayImage = contextImage || image

									return (
										<div key={index} className={styles.previewItem}>
											<img src={image.previewUrl} alt={`Preview ${index + 1}`} />
											<div className={styles.previewOverlay}>
												<span className={styles.previewNumber}>{index + 1}</span>
												{!uploadContext.isUploading && (
													<div className={styles.previewActions}>
														{index > 0 && (
															<button onClick={() => moveImage(index, index - 1)}>↑</button>
														)}
														{index < images.length - 1 && (
															<button onClick={() => moveImage(index, index + 1)}>↓</button>
														)}
														<button onClick={() => removeImage(index)}>×</button>
													</div>
												)}
												{displayImage.uploadProgress !== undefined && displayImage.uploadProgress > 0 && (
													<div className={styles.progressBar}>
														<div
															className={styles.progressFill}
															style={{ width: `${displayImage.uploadProgress}%` }}
														/>
													</div>
												)}
												{displayImage.uploaded && (
													<div className={styles.uploadedBadge}>✓</div>
												)}
												{displayImage.error && (
													<div className={styles.errorBadge}>{displayImage.error}</div>
												)}
											</div>
											{availableFrameSides[index] && (
												<div className={styles.frameSideInfo}>
													<T>Frame</T> {availableFrameSides[index].position} • {availableFrameSides[index].side}
												</div>
											)}
										</div>
									)
								})}
							</div>

							<div className={styles.actions}>
								{!uploadContext.isUploading && (
									<Button onClick={handleClear}>
										<T>Clear all</T>
									</Button>
								)}
								<Button
									onClick={handleUpload}
									disabled={!canUpload}
									color="green"
								>
									<T>Upload</T> {images.length} {images.length === 1 ? <T>image</T> : <T>images</T>}
								</Button>
								{uploadContext.isUploading && (
									<Button onClick={() => uploadContext.cancelUpload()} color="red">
										<T>Cancel upload</T>
									</Button>
								)}
							</div>
						</>
					)}
				</div>
			)}
		</div>
	)
}

