import React from 'react'

import { useMutation, gql, uploadClient } from '../../../../../api'
import ErrorMsg from '../../../../../shared/messageError'
import Loader from '../../../../../shared/loader'

import DragAndDrop from './dragDrop'
import { useState } from 'preact/hooks'
import styles from './index.less'
import UploadIcon from '../../../../../../icons/uploadIcon'

const SINGLE_UPLOAD = gql`
	mutation ($file: Upload!) {
		uploadFrameSide(file: $file) {
			id
			url
		}
	}
`

export default ({ onUpload }) => {
	const [uploadFile, { loading, error, data }] = useMutation(SINGLE_UPLOAD, {
		client: uploadClient,
		onCompleted: (v) => {
			onUpload(v.uploadFrameSide)
		},
	})
	const [fileList, setFiles] = useState([])
	const onChange = ({
		target: {
			validity,
			files: [file],
		},
	}) => validity.valid && uploadFile({ variables: { file } })

	if (loading) return <Loader />
	if (error) return <ErrorMsg error={error} />

	if (data) {
		const { uploadFrameSide } = data

		// {JSON.stringify(data)}
		return (
			<div>
				<img src={uploadFrameSide.url} style="width:100%" />
			</div>
		)
	}

	const handleDrop = (files) => {
		for (let i = 0; i < files.length; i++) {
			if (!files[i].name) return
			fileList.push(files[i].name)
		}
		setFiles(fileList)
		onChange({
			target: {
				validity: {
					valid: true,
				},
				files,
			},
		})
	}

	return (
		<div style="border: 1px dotted black;">
			<DragAndDrop handleDrop={handleDrop}>
				<div
					style={{
						minHeight: 300,
						minWidth: 650,
						display: 'flex',
						alignItems: 'center',
					}}
				>
					<input
						type="file"
						className={styles.inputfile}
						id="file"
						required
						accept="image/jpg"
						onChange={onChange}
					/>

					<label htmlFor="file" className={styles.fileUploadLabel}>
						<UploadIcon />
						Upload frame photo
					</label>

					{fileList.map((file, i) => (
						<div key={i}>{file}</div>
					))}
				</div>
			</DragAndDrop>
		</div>
	)
}
