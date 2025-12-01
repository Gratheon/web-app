import { useState } from 'react'
import { useUploadMutation, useMutation, useQuery, gql } from '@/api'
import ErrorMessage from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import styles from './styles.module.less'
import UploadIcon from '@/icons/uploadIcon'

export default function BottomBox({ boxId, hiveId }) {
	const { data: filesData, loading: filesLoading, reexecuteQuery } = useQuery(gql`
		query boxFiles($boxId: ID!) {
			boxFiles(boxId: $boxId) {
				file {
					id
					url
				}
				addedTime
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
		mutation addFileToBox($boxId: ID!, $fileId: ID!, $hiveId: ID!) {
			addFileToBox(boxId: $boxId, fileId: $fileId, hiveId: $hiveId)
		}
	`)

	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)

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
				hiveId: hiveId
			})

			reexecuteQuery({ requestPolicy: 'network-only' })

		} catch (err) {
			setError(err instanceof Error ? err : new Error('Upload failed'))
		} finally {
			setLoading(false)
		}
	}

	if (loading || filesLoading) return <Loader />

	const existingFiles = filesData?.boxFiles || []

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

			{existingFiles.length > 0 && (
				<div className={styles.existingImages}>
					{existingFiles.map((boxFile, index) => (
						<div key={boxFile.file.id} className={styles.uploadedImage}>
							<img src={boxFile.file.url} alt={`Bottom board ${index + 1}`} />
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

