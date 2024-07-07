import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useQuery } from '@/components/api/index'

import Button from '@/components/shared/button'
import { getUser } from '@/components/models/user'
import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import T from '@/components/shared/translate'

import ApiaryListRow from './apiaryListRow'
import ApiariesPlaceholder from './apiariesPlaceholder'


export default function ApiaryList(props) {
	let user = useLiveQuery(() => getUser(), [], null)
	const { loading, error, data, errorNetwork } = useQuery(gql`
		{
			apiaries {
				id
				name

				hives {
					id
					name
					beeCount
					status

					lastInspection
					isNew

					family{
						id
						age
						lastTreatment
					}

					boxes {
						id
						position
						color
						type
					}
				}
			}
		}
	`)

	if (loading) {
		return <Loader />
	}

	const { apiaries } = data

	return (
		<div>
			<ErrorMsg error={error || errorNetwork} borderRadius={0} />
			<div style={{ maxWidth: 800, paddingLeft: 20 }}>
				{apiaries !== null && apiaries?.length === 0 && <ApiariesPlaceholder />}

				{apiaries &&
					apiaries.map((apiary, i) => (
						<ApiaryListRow key={i} apiary={apiary} user={user} />
					))}

				<div style={{ textAlign: 'center', marginTop: 20 }}>
					<Button 
						color={apiaries && apiaries.length === 0 ? 'green' : 'white'}
						href="/apiaries/create"><T ctx="its a button">Setup new apiary</T></Button>
				</div>
			</div>
		</div>
	)
}
