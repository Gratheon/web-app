import React from 'react'

import Link from '../../shared/link'
import { gql, useQuery, useSubscription } from '../../api'
import ApiaryListRow from './apiaryListRow'
import Loader from '../../shared/loader'
import ApiariesPlaceholder from './apiariesPlaceholder'
import ErrorMsg from '../../shared/messageError'

export default function ApiaryList(props) {
	const { loading, error, data } = useQuery(gql`
		{
			apiaries {
				id
				name

				hives {
					id
					name
					boxCount

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

	const { data: apiaryUpdated } = useSubscription(gql`
		subscription onApiaryUpdated {
			onApiaryUpdated {
				id
				name
			}
		}
	`)

	if (error) {
		return <ErrorMsg error={error} />
	}

	if (loading) {
		return <Loader />
	}

	const { apiaries } = data

	return (
		<div style={{ maxWidth: 800, paddingLeft: 20 }}>
			{!apiaries || (apiaries.length === 0 && <ApiariesPlaceholder />)}

			{apiaries &&
				apiaries.map((apiary, i) => (
					<ApiaryListRow key={i} apiary={apiary} selectedId={props.id} />
				))}

			<div style={{ textAlign: 'center', marginTop: 20 }}>
				<Link href="/apiaries/create">Add another apiary</Link>
			</div>
		</div>
	)
}
