import React, { useState, useRef } from 'react'
import { gql, useUploadMutation, useMutation } from '@/api'
import { useConfirm } from '@/hooks/useConfirm'
import { updateFile } from '@/models/files.ts'
import { updateFrameSideFile } from '@/models/frameSideFile.ts'
import ErrorMessage from '@/shared/messageError'
import Modal from '@/shared/modal'
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

type BulkUploadProps = {
	hiveId: number
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

export default function BulkUpload({ hiveId, frames, onComplete }: BulkUploadProps) {
	const { confirm, ConfirmDialog } = useConfirm()
	const [isOpen, setIsOpen] = useState(false)
	const [images, setImages] = useState<ImagePreview[]>([])
	const [error, setError] = useState<Error | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [uploadComplete, setUploadComplete] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const dragCounter = useRef(0)

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
				previewUrl: URL.createObjectURL(file)
			})
		}

		if (errorMsg) {
			setError(new Error(errorMsg))
		} else {
			setError(null)
		}

		setImages(prev => [...prev, ...validFiles].slice(0, maxImages))
	}

	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounter.current++
	}

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounter.current--
	}

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
	}

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

		setIsUploading(true)
		setError(null)

		const updatedImages = [...images]

		for (let i = 0; i < images.length; i++) {
			const image = images[i]
			const frameSide = availableFrameSides[i]

			if (!frameSide) {
				updatedImages[i] = { ...image, error: 'No available frame side' }
				continue
			}

			try {
				updatedImages[i] = { ...image, uploadProgress: 10 }
				setImages([...updatedImages])

				//@ts-ignore
				const uploadResult = await uploadFile({ file: image.file })
				const uploadData = uploadResult?.data?.uploadFrameSide

				if (uploadResult?.error || !uploadData) {
					updatedImages[i] = { ...image, error: 'Upload failed' }
					continue
				}

				updatedImages[i] = { ...image, uploadProgress: 50 }
				setImages([...updatedImages])

				await updateFile({
					id: +uploadData.id,
					url: uploadData.url,
					resizes: uploadData.resizes || []
				})

				updatedImages[i] = { ...image, uploadProgress: 70 }
				setImages([...updatedImages])

				const linkResult = await linkFrameSideToFileMutation({
					frameSideId: String(frameSide.frameSideId),
					fileId: String(uploadData.id),
					hiveId: String(hiveId)
				})

				if (linkResult?.error) {
					updatedImages[i] = { ...image, error: 'Failed to link file' }
					continue
				}

				updatedImages[i] = { ...image, uploadProgress: 90 }
				setImages([...updatedImages])

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

				updatedImages[i] = { ...image, uploadProgress: 100, uploaded: true, frameSideId: frameSide.frameSideId }
				setImages([...updatedImages])

				metrics.trackFramePhotoUploaded()
			} catch (err) {
				updatedImages[i] = { ...image, error: err instanceof Error ? err.message : 'Upload failed' }
			}
		}

		setIsUploading(false)
		setUploadComplete(true)

		if (onComplete) {
			setTimeout(() => {
				onComplete()
			}, 1000)
		}
	}

	const handleClose = async () => {
		if (isUploading && !uploadComplete) {
			const confirmed = await confirm(
				'Upload is in progress. Are you sure you want to close?',
				{ confirmText: 'Close', cancelText: 'Continue Upload', isDangerous: true }
			)

			if (!confirmed) {
				return
			}
		}
		images.forEach(img => URL.revokeObjectURL(img.previewUrl))
		setImages([])
		setError(null)
		setIsUploading(false)
		setUploadComplete(false)
		setIsOpen(false)
	}

	const canUpload = images.length > 0 && !isUploading

	if (maxImages === 0) {
		return null
	}

	return (
		<>
			<Button onClick={() => setIsOpen(true)}>
				<UploadIcon />
				<span><T>Bulk upload frame photos</T></span>
			</Button>

			{isOpen && (
				<Modal onClose={handleClose} title={<T>Bulk Upload Frame Photos</T>}>
					<div className={styles.bulkUpload}>
						<ErrorMessage error={error} />

						<div className={styles.info}>
							<p>
								<T>Available frame sides without photos</T>: {maxImages}
								{images.length > 0 && (
									<>
										<br />
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
								{images.length > 0 && images.length < maxImages && !isUploading && (
									<>
										<br />
										<span className={styles.warning}>
											⚠️ <T>You have fewer images than available frame sides</T>.
										</span>
									</>
								)}
							</p>
						</div>

						{images.length === 0 && !isUploading && (
							<div
								className={styles.dropZone}
								onDragEnter={handleDragEnter}
								onDragLeave={handleDragLeave}
								onDragOver={handleDragOver}
								onDrop={handleDrop}
							>
								<input
									ref={fileInputRef}
									type="file"
									multiple
									accept={SUPPORTED_IMAGE_TYPES_STRING}
									onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files)}
									className={styles.fileInput}
								/>
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
							<div className={styles.previewGrid}>
								{images.map((image, index) => (
									<div key={index} className={styles.previewItem}>
										<img src={image.previewUrl} alt={`Preview ${index + 1}`} />
										<div className={styles.previewOverlay}>
											<span className={styles.previewNumber}>{index + 1}</span>
											{!isUploading && (
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
											{image.uploadProgress !== undefined && (
												<div className={styles.progressBar}>
													<div
														className={styles.progressFill}
														style={{ width: `${image.uploadProgress}%` }}
													/>
												</div>
											)}
											{image.uploaded && (
												<div className={styles.uploadedBadge}>✓</div>
											)}
											{image.error && (
												<div className={styles.errorBadge}>{image.error}</div>
											)}
										</div>
										{availableFrameSides[index] && (
											<div className={styles.frameSideInfo}>
												<T>Frame</T> {availableFrameSides[index].position} • {availableFrameSides[index].side}
											</div>
										)}
									</div>
								))}
							</div>
						)}

						<div className={styles.actions}>
							{!isUploading && !uploadComplete && images.length > 0 && (
								<Button onClick={() => {
									images.forEach(img => URL.revokeObjectURL(img.previewUrl))
									setImages([])
								}}>
									<T>Clear all</T>
								</Button>
							)}
							{!uploadComplete && (
								<Button
									onClick={handleUpload}
									disabled={!canUpload}
									color="green"
								>
									<T>Upload</T> {images.length} {images.length === 1 ? <T>image</T> : <T>images</T>}
								</Button>
							)}
							{uploadComplete && (
								<Button onClick={handleClose} color="green">
									<T>Done</T>
								</Button>
							)}
						</div>
					</div>
				</Modal>
			)}
			{ConfirmDialog}
		</>
	)
}

