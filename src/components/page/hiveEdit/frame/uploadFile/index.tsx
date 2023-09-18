// @ts-nocheck
import React from 'react'

import { useState } from 'react'

import { useUploadMutation, gql } from '@/components/api'
import ErrorMessage from '@/components/shared/messageError'
import Loader from '@/components/shared/loader'

import UploadIcon from '@/icons/uploadIcon'
import { updateFile } from '@/components/models/files'

import DragAndDrop from './dragDrop'
import styles from './index.less'

export default function UploadFile({ onUpload }) {
	//todo
	//@ts-ignore
	const [uploadFile, { loading, error, data }] = useUploadMutation(gql`
		mutation uploadFrameSide($file: Upload!) {
			uploadFrameSide(file: $file) {
				id
				url
			}
		}
	`)
	const [fileList, setFiles] = useState([])
	async function onFileSelect({
		target: {
			validity,
			files: [file],
		},
	}) {
		if (!validity.valid) {
			return
		}
		//@ts-ignore
		const { data, error } = await uploadFile({ file })

		if (error) {
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

	if (loading) return <Loader />
	if (error) return <ErrorMessage error={error} />

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
		setFiles(fileList)
		await onFileSelect({
			target: {
				validity: {
					valid: true,
				},
				files,
			},
		})
	}

	return (
		<div style={{ border: '1px dotted black', marginTop: 10 }}>
			<ErrorMessage error={error} />
			<DragAndDrop handleDrop={handleDrop}>
				<div className={styles.dropArea}>
					<div style={{ flexGrow: 1 }}></div>
					<div>
						<input
							type="file"
							className={styles.inputfile}
							id="file"
							required
							accept="image/jpg"
							onChange={onFileSelect}
						/>

						<label htmlFor="file" className={styles.fileUploadLabel}>
							<UploadIcon />
							Upload frame photo
						</label>
					</div>

					<div style={{
						flexGrow: 1,
						fontSize: 10,
						paddingTop: 5,
						color: 'gray'
					}}>Detection best works with high-resolution photos (17MP)</div>


					{fileList.map((file, i) => (
						<div key={i}>{file}</div>
					))}
				</div>
			</DragAndDrop>
		</div>
	)
}
