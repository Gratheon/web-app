// @ts-nocheck
import React from 'react'

import { useState } from 'react'

import { useUploadMutation, gql } from '../../../../api'
import ErrorMessage from '../../../../shared/messageError'
import Loader from '../../../../shared/loader'

import UploadIcon from '../../../../icons/uploadIcon.tsx'
import { updateFile } from '../../../../models/files.ts'

import DragAndDrop from './dragDrop.tsx'
import styles from './index.module.less'
import T from '../../../../shared/translate'

// Define supported image types (adjust if needed based on backend capabilities)
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_IMAGE_TYPES_STRING = SUPPORTED_IMAGE_TYPES.join(', ');
const MAX_FILE_SIZE_MB = 30;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function UploadFile({ onUpload }) {
	//todo
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

	const [fileList, setFiles] = useState([])
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)


	async function onFileSelect({
		target: {
			validity,
			files: [file],
		},
	}) {
		setError(null); // Clear previous errors

		if (!validity.valid) {
			return
		}

		// Validate file type
		if (!file || !SUPPORTED_IMAGE_TYPES.includes(file.type)) {
			setError(new Error(`Unsupported file type: ${file?.type || 'unknown'}. Please upload one of the following: ${SUPPORTED_IMAGE_TYPES_STRING}`));
			setLoading(false);
			return;
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE_BYTES) {
			setError(new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`));
			setLoading(false);
			return;
		}

		setLoading(true)
		//@ts-ignore
		const {data, error: uploadError} = await uploadFile({ file })

		setLoading(false)

		setFiles([
			file
		])

		if (uploadError) {
			setError(uploadError)
			return;
		}

		if (!data.uploadFrameSide) {
			return;
		}

		//trigger higher component joining file with hive info
		onUpload(data.uploadFrameSide)

		await updateFile({
			id: +data.uploadFrameSide.id,
			url: data.uploadFrameSide.url
		});
	}

	if (data && data.uploadFrameSide !== null) {
		const { uploadFrameSide } = data

		return (
			<div>
				<img src={uploadFrameSide.url} style={{ width: '100%' }} />
			</div>
		)
	}

	const handleDrop = async (files) => {
		for (let i = 0; i < files.length; i++) {
			if (!files[i].name) return
			fileList.push(files[i].name)
		}

		await onFileSelect({
			target: {
				validity: {
					valid: true,
				},
				files,
			},
		})
	}


	if (loading) return <Loader />

	return (
		<div style={{ border: '1px dotted black', borderRadius: 3, marginTop: 10 }}>
			<ErrorMessage error={error} />

			{fileList?.length > 0 && <div>
				{fileList.map((file, i) => (
					<div key={i}>{file}</div>
				))}
			</div>}

			{!fileList?.length &&
				<DragAndDrop handleDrop={handleDrop}>
					<div className={styles.dropArea}>
						<div style={{ flexGrow: 1 }}></div>
						<div>
							<input
								type="file"
								className={styles.inputfile}
								id="file"
								required
								accept={SUPPORTED_IMAGE_TYPES_STRING}
								onChange={onFileSelect}
							/>

							<label htmlFor="file" className={styles.fileUploadLabel}>
								<UploadIcon />
								<T ctx="this is a button which allows to select and upload a photo of a beehive frame">Upload frame photo</T>
							</label>
						</div>

						<div style={{
							flexGrow: 1,
							fontSize: 14,
							paddingTop: 5,
							color: 'gray'
						}}>
							<T>Supported types: JPEG, PNG, GIF, WebP. Max size: {MAX_FILE_SIZE_MB}MB. Detection best works with high-resolution photos (17MP).</T>
						</div>
					</div>
				</DragAndDrop>
			}
		</div>
	)
}
