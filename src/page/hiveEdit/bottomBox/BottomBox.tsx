import { useState, useMemo } from 'react'
import { useUploadMutation, useMutation, useQuery, gql } from '@/api'
import ErrorMessage from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import styles from './styles.module.less'
import UploadIcon from '@/icons/uploadIcon'
import DrawingCanvas from '@/page/hiveEdit/frame/drawingCanvas'

export default function BottomBox({ boxId, hiveId }) {
	const { data: filesData, loading: filesLoading, reexecuteQuery } = useQuery(gql`
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

	const { data: detectionsData, loading: detectionsLoading } = useQuery(gql`
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
		const target = event.target as HTMLInputElement
		const file = target.files?.[0]
		if (!file) return

		setLoading(true)
		setError(null)

		try {
			//@ts-ignore
			const uploadResult = await uploadFile({ file })
			if (uploadResult?.error) {
				setError(uploadResult.error)
				return
			}

			const uploadData = uploadResult?.data?.uploadFrameSide
			if (!uploadData) {
				setError(new Error('Upload failed - no data received'))
				return
			}

			await addFileToBoxMutation({
				boxId: boxId,
				fileId: uploadData.id,
				hiveId: hiveId,
				boxType: "BOTTOM"
			})

			reexecuteQuery({ requestPolicy: 'network-only' })

		} catch (err) {
			setError(err instanceof Error ? err : new Error('Upload failed'))
		} finally {
			setLoading(false)
		}
	}

	if (loading || filesLoading || detectionsLoading) return <Loader />

	const existingFiles = filesData?.boxFiles || []
	const varroaCount = detectionsData?.varroaBottomDetections?.varroaCount || 0
	const hasDetections = varroaCount > 0

	return (
		<div className={styles.bottomBoxWrap}>
			<h3>
				<T>Bottom board - Varroa monitoring</T>
			</h3>
			<p>
				<T ctx="description of hive bottom board feature">
					Upload an image of the bottom board to count varroa mites. The white slideable panel should be visible in the photo.
				</T>
			</p>

			<ErrorMessage error={error} />

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

			<div className={styles.uploadArea}>
				<label htmlFor={`bottom-upload-${boxId}`} className={styles.uploadLabel}>
					<UploadIcon />
					<span>
						<T>Upload bottom board image</T>
					</span>
				</label>
				<input
					id={`bottom-upload-${boxId}`}
					type="file"
					accept="image/*"
					onChange={onFileSelect}
					className={styles.fileInput}
				/>
			</div>
		</div>
	)
}

