import { useState } from "react";

import { gql, useQuery } from "@/components/api";
import ErrorMessage from '@/components/shared/messageError'
import T from "@/components/shared/translate";
import Loader from "@/components/shared/loader";
import DateFormat from "@/components/shared/dateFormat";

export default function TreatmentList({ hiveId, boxId = null }) {
	let {
		loading,
		data,
		error: errorGet,
		errorNetwork
	} = useQuery(gql`	query hive($id: ID!) {
		hive(id: $id) {
			family{
				treatments{
					id
					type
					added
				}
			}
		}
		}`,
		{ variables: { id: +hiveId } })

	if (loading) {
		return <Loader />
	}


	return (
		<>
			<ErrorMessage error={errorGet || errorNetwork} />

			{data.hive.family && data.hive.family.treatments.length == 0 && <p><T>No treatments added yet</T></p>}
			{data.hive.family && data.hive.family.treatments.length > 0 &&
				<table width="100%">
					<thead>
						<tr>
							<th><T>Treatment type</T></th>
							<th width="200"><T>Time</T></th>
						</tr>
					</thead>
					<tbody>
						{data.hive.family.treatments.map((treatment) => (
							<tr key={treatment.id}>
								<td>{treatment.type}</td>
								<td>
									<DateFormat datetime={treatment.added} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			}
		</>
	)
}