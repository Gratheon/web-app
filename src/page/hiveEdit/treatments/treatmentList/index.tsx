import { useState } from 'react'

import { gql, useQuery } from '../../../../api'
import ErrorMessage from '../../../../shared/messageError'
import T from '../../../../shared/translate'
import Loader from '../../../../shared/loader'
import DateTimeFormat from '../../../../shared/dateTimeFormat'

export default function TreatmentList({ hiveId, boxId = null }) {
	let {
		loading,
		data,
		error: errorGet,
		errorNetwork,
	} = useQuery(
		gql`
			query hive($id: ID!) {
				hive(id: $id) {
					__typename
					id
					family {
						__typename
						id
						treatments {
							__typename
							id
							type
							added
						}
					}
				}
			}
		`,
		{ variables: { id: +hiveId } }
	)

	if (loading) {
		return <Loader />
	}

	return (
		<>
			<ErrorMessage error={errorGet || errorNetwork} />

			{data.hive.family && data.hive.family.treatments.length == 0 && (
				<div>
					<T>Not treated</T>
				</div>
			)}
			{data.hive.family && data.hive.family.treatments.length > 0 && (
				<table style={{ width: '100%' }}>
					<thead>
						<tr>
							<th>
								<T>Treatment type</T>
							</th>
							<th style={{ width: '200px' }}>
								<T>Time</T>
							</th>
						</tr>
					</thead>
					<tbody>
						{data.hive.family.treatments.map((treatment) => (
							<tr key={treatment.id}>
								<td>{treatment.type}</td>
								<td>
									<DateTimeFormat datetime={treatment.added} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</>
	)
}
