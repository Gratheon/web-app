import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../../../shared/button'
import HIVE_DELETE_MUTATION from './hiveDeleteMutation.graphql.ts'
import { useMutation } from '../../../api'
import Loading from '../../../shared/loader'

import DeleteIcon from '../../../icons/deleteIcon.js'
import T from '../../../shared/translate'

export default function deactivateButton({ hiveId }) {
	let [updateHive] = useMutation(HIVE_DELETE_MUTATION)
	let navigate = useNavigate()
	const [deleting, setDeleting] = useState(false)

	async function deactivate(e) {
		e.preventDefault()

		if (confirm('Are you sure?')) {
			setDeleting(true)
			await updateHive({
				id: hiveId,
			});
			navigate(`/apiaries`, { replace: true })
			setDeleting(false)
		}
	}

	return (
		<Button loading={deleting} color="red" onClick={deactivate} title="Remove hive">
			<DeleteIcon /><span><T ctx="this is a button">Remove hive</T></span>
		</Button>
	)
}
