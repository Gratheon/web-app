import { useState, useMemo, useEffect, useRef } from 'react'
import { useUploadMutation, useMutation, useQuery, useSubscription, gql } from '@/api'
import ErrorMessage from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import Button from '@/shared/button'
import styles from './styles.module.less'
import UploadIcon from '@/icons/uploadIcon'
import DrawingCanvas from '@/page/hiveEdit/frame/drawingCanvas'
import BillingUpgradeNotice from '@/shared/billingUpgradeNotice'
import { getUser } from '@/models/user'
import { useLiveQuery } from 'dexie-react-hooks'
import { isBillingTierLessThan } from '@/shared/billingTier'

export default function BottomBox({ boxId, hiveId }) {
	const user = useLiveQuery(() => getUser(), [], null)
	const isVarroaMonitoringLocked = isBillingTierLessThan(user?.billingPlan, 'starter')

	const { data: filesData, loading: filesLoading, reexecuteQuery: refetchFiles } = useQuery(gql`
		query boxFiles($boxId: ID!) {
			boxFiles(boxId: $boxId) {
				file {
					id
					url
					resizes {
						id
						url
						max_dimension_px
					}
				}
				addedTime
			}
		}
	`, { variables: { boxId } })

	const { data: detectionsData, loading: detectionsLoading, reexecuteQuery: refetchDetections } = useQuery(gql`
		query varroaBottomDetections($boxId: ID!) {
			varroaBottomDetections(boxId: $boxId) {
				id
				fileId
				varroaCount
				detections
				processedAt
			}
		}
	`, { variables: { boxId } })
	//@ts-ignore
	const [uploadFile, {data}] = useUploadMutation(gql`
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

	//@ts-ignore
	const [addFileToBoxMutation] = useMutation(gql`
		mutation addFileToBox($boxId: ID!, $fileId: ID!, $hiveId: ID!, $boxType: String) {
			addFileToBox(boxId: $boxId, fileId: $fileId, hiveId: $hiveId, boxType: $boxType)
		}
	`)

	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [isDetecting, setIsDetecting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		setIsUploading(false)
		setIsDetecting(false)
		setError(null)
	}, [boxId])

	useSubscription(
		gql`
			subscription onBoxVarroaDetected($boxId: String) {
				onBoxVarroaDetected(boxId: $boxId) {
					fileId
					boxId
					varroaCount
					detections
					isComplete
				}
			}
		`,
		{ boxId: String(boxId) },
		async (_, response) => {
			if (response?.onBoxVarroaDetected?.isComplete) {
				setIsDetecting(false)
				refetchFiles({ requestPolicy: 'network-only' })
				refetchDetections({ requestPolicy: 'network-only' })
			}
		}
	)

	const transformedDetections = useMemo(() => {
		if (!detectionsData?.varroaBottomDetections?.detections) {
			return []
		}

		const detections = detectionsData.varroaBottomDetections.detections

		if (typeof detections === 'string') {
			return JSON.parse(detections)
		}

		return detections
	}, [detectionsData])

	async function onFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
		if (isVarroaMonitoringLocked) return

		const target = event.target as HTMLInputElement
		const file = target.files?.[0]
		if (!file) return
		target.value = ''

		await processFile(file)
	}

	async function processFile(file: File) {
		if (isVarroaMonitoringLocked) return

		if (!file.type.startsWith('image/')) {
			setError(new Error('Unsupported file type. Please upload an image.'))
			return
		}

		setLoading(true)
		setIsUploading(true)
		setError(null)

		try {
			//@ts-ignore
			const uploadResult = await uploadFile({ file })
			if (uploadResult?.error) {
				setError(uploadResult.error)
				setIsUploading(false)
				return
			}

			const uploadData = uploadResult?.data?.uploadFrameSide
			if (!uploadData) {
				setError(new Error('Upload failed - no data received'))
				setIsUploading(false)
				return
			}

			await addFileToBoxMutation({
				boxId: boxId,
				fileId: uploadData.id,
				hiveId: hiveId,
				boxType: "BOTTOM"
			})

			setIsUploading(false)
			setIsDetecting(true)
			refetchFiles({ requestPolicy: 'network-only' })

		} catch (err) {
			setError(err instanceof Error ? err : new Error('Upload failed'))
			setIsUploading(false)
		} finally {
			setLoading(false)
		}
	}

	async function onDrop(event: React.DragEvent<HTMLDivElement>) {
		if (isVarroaMonitoringLocked) return

		event.preventDefault()
		const file = event.dataTransfer?.files?.[0]
		if (!file) return
		await processFile(file)
	}

	if (loading || filesLoading || detectionsLoading) return <Loader />

	const existingFiles = filesData?.boxFiles || []
	const hasFiles = existingFiles.length > 0
	const varroaCount = detectionsData?.varroaBottomDetections?.varroaCount || 0
	const hasDetections = varroaCount > 0

	return (
		<div className={styles.bottomBoxWrap}>
			<div className={`${styles.previewContainer} ${isVarroaMonitoringLocked ? styles.previewLocked : ''}`}>
				<h3>
					<T>Bottom board - Varroa monitoring</T>
				</h3>
				<p>
					<T ctx="description of hive bottom board feature">
						Upload an image of the bottom board to count varroa mites. The white slideable panel should be visible in the photo.
					</T>
				</p>

				<ErrorMessage error={error} />

				{isUploading && (
					<div className={styles.uploadingState}>
						<Loader size={0} stroke="#1976D2" />
						<span><T>Uploading image...</T></span>
					</div>
				)}

				{isDetecting && (
					<div className={styles.detectingState}>
						<Loader size={0} stroke="#F57C00" />
						<span><T>Detecting varroa mites...</T></span>
					</div>
				)}

				{hasDetections && (
					<div className={styles.detectionCount}>
						<strong><T>Detected varroa mites</T>: {varroaCount}</strong>
					</div>
				)}

				{existingFiles.length > 0 && (
					<div className={styles.existingImages}>
						{existingFiles.map((boxFile, index) => (
							<div key={boxFile.file.id} className={styles.uploadedImage}>
								<DrawingCanvas
									imageUrl={boxFile.file.url}
									resizes={boxFile.file.resizes || []}
									detectedVarroa={transformedDetections}
									strokeHistory={[]}
									onStrokeHistoryUpdate={() => {}}
									frameSideFile={{
										isVarroaDetectionComplete: hasDetections
									}}
									hideControls={true}
								/>
							</div>
						))}
					</div>
				)}

				{!hasFiles && (
					<div className={styles.uploadArea}>
						<div
							className={styles.dropZone}
							onDragEnter={e => e.preventDefault()}
							onDragLeave={e => e.preventDefault()}
							onDragOver={e => e.preventDefault()}
							onDrop={onDrop}
							onClick={() => !isVarroaMonitoringLocked && fileInputRef.current?.click()}
						>
							<div className={styles.dropZoneContent}>
								<div className={styles.uploadButtonWrap}>
									<Button
										color="green"
										disabled={isVarroaMonitoringLocked}
										onClick={() => !isVarroaMonitoringLocked && fileInputRef.current?.click()}
									>
										<UploadIcon />
										<span><T>Upload bottom board image</T></span>
									</Button>
								</div>
								<p className={styles.dropZoneHint}>
									<T>Drag and drop image here or click to select</T>
								</p>
							</div>
						</div>
						<input
							ref={fileInputRef}
							id={`bottom-upload-${boxId}`}
							type="file"
							accept="image/*"
							onChange={onFileSelect}
							className={styles.fileInput}
							disabled={isVarroaMonitoringLocked || isUploading || isDetecting}
						/>
					</div>
				)}

				{isVarroaMonitoringLocked && <div className={styles.previewOverlay} />}
				{isVarroaMonitoringLocked && (
					<div className={styles.previewOverlayNotice}>
						<BillingUpgradeNotice
							compact
							title={<T>Varroa monitoring requires Starter plan or higher.</T>}
						/>
					</div>
				)}
			</div>
		</div>
	)
}
