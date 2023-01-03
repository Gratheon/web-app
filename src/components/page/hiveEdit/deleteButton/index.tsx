import React from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../../../shared/button'
import HIVE_DELETE_MUTATION from './hiveDeleteMutation.graphql.js'
import { useMutation } from '../../../api'
import Loading from '../../../shared/loader'
import DeleteIcon from '../../../../icons/deleteIcon'

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
		<Button loading={loading} className="red" onClick={deactivate}>
			<DeleteIcon /> Delete
		</Button>
	)
}
