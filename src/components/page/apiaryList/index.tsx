import React from 'react'

import { gql, useQuery, useSubscription } from '@/components/api/index'

import Link from '@/components/shared/link'
import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import T from '@/components/shared/translate'

import ApiaryListRow from './apiaryListRow'
import ApiariesPlaceholder from './apiariesPlaceholder'

export default function ApiaryList(props) {
	const { loading, error, data } = useQuery(gql`
		{
			apiaries {
				id
				name

				hives {
					id
					name
					beeCount

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
				<Link href="/apiaries/create"><T ctx="its a button">Setup new apiary</T></Link>
			</div>
		</div>
	)
}
