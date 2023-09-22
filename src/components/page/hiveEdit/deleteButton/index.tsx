import React from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/shared/button'
import HIVE_DELETE_MUTATION from './hiveDeleteMutation.graphql'
import { useMutation } from '@/components/api'
import Loading from '@/components/shared/loader'

import DeleteIcon from '@/icons/deleteIcon'

export default function deactivateButton({ hiveId }) {
	let [updateHive, { loading }] = useMutation(HIVE_DELETE_MUTATION)
	let navigate = useNavigate()

	function deactivate(e) {
		e.preventDefault()

		if (confirm('Are you sure?')) {
			updateHive({
				id: hiveId,
			}).then(() => {
				navigate(`/apiaries`, { replace: true })
			})
		}
	}

	if (loading) {
		return <Loading />
	}

	return (
		<Button loading={loading} className="red" onClick={deactivate} title="Delete hive">
			<DeleteIcon /><span>Delete hive</span>
		</Button>
	)
}
