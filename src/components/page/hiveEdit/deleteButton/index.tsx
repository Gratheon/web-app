import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/shared/button'
import HIVE_DELETE_MUTATION from './hiveDeleteMutation.graphql'
import { useMutation } from '@/components/api'
import Loading from '@/components/shared/loader'

import DeleteIcon from '@/icons/deleteIcon'

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
		<Button loading={deleting} className="red" onClick={deactivate} title="Remove hive">
			<DeleteIcon /><span>Remove hive</span>
		</Button>
	)
}
