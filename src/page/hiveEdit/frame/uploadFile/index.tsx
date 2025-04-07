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

	// Helper function to process a single file
	async function processFile(file: File | null) {
		setError(null); // Clear previous errors

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

		setLoading(true);
		let uploadResult;
		try {
			//@ts-ignore - Assuming useUploadMutation hook handles types internally or needs specific casting
			uploadResult = await uploadFile({ file });
		} catch (err) {
			setError(err instanceof Error ? err : new Error('Upload failed'));
			setLoading(false);
			return;
		} finally {
			setLoading(false);
		}


		const uploadData = uploadResult?.data?.uploadFrameSide;

		if (uploadResult?.error) {
			setError(uploadResult.error);
			return;
		}

		if (!uploadData) {
			setError(new Error('Upload completed but no data received.'));
			return;
		}

		setFiles([file]); // Update UI state

		// Trigger higher component joining file with hive info
		onUpload(uploadData);

		// Ensure resizes is included and types match
		try {
			await updateFile({
				id: +uploadData.id,
				url: uploadData.url,
				resizes: uploadData.resizes || [], // Pass resizes, default to empty array if missing
			});
		} catch (dbError) {
			console.error("Failed to update file in DB:", dbError);
			// Optionally set an error state here as well
			setError(new Error('Failed to save file details locally.'));
		}
	}

	// Handler for file input change
	async function onFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
		const target = event.target as HTMLInputElement; // Cast target
		const file = target.files?.[0]; // Safely access the first file

		if (target.validity?.valid && file) {
			await processFile(file);
		} else {
			// Handle invalid input or no file selected if necessary
			setError(null); // Clear error if just cancelling selection
		}
		// Reset input value to allow selecting the same file again
        target.value = ''; // Use the cast 'target' variable
	}


	if (data && data.uploadFrameSide !== null) {
		const { uploadFrameSide: uploadData } = data // Use consistent naming

		return (
			<div>
				<img src={uploadData.url} style={{ width: '100%' }} /> {/* Use uploadData */}
			</div>
		)
	}

	// Handler for drag and drop
	const handleDrop = async (droppedFiles: FileList) => {
		if (droppedFiles.length > 0) {
			// Process only the first dropped file for simplicity, matching input behavior
			const fileToProcess = droppedFiles[0];
			await processFile(fileToProcess);
		}
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
								onChange={onFileSelect} // Keep the handler name
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
							<T>Supported types: JPEG, PNG, GIF, WebP</T>. <T>{`Max size: ${MAX_FILE_SIZE_MB}MB`}</T><br />
							<T>Detection best works with high-resolution photos (17MP)</T>
						</div>
					</div>
				</DragAndDrop>
			}
		</div>
	)
}
