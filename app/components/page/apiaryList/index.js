import React from 'react'
import { Component } from 'preact'

import Link from '../../shared/link'
import { gql, useQuery, useSubscription } from '../../api'
import ApiaryListRow from './apiaryListRow'
import Loader from '../../shared/loader'
import ApiariesPlaceholder from './apiariesPlaceholder'
import ErrorMsg from '../../shared/messageError'

export default class ApiaryList extends Component {
	constructor() {
		super()
		this.state = {
			loaded: false,
			loading: true,
			error: '',
		}
	}

	render(props) {
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
							position
							color
							type
						}
					}
				}
			}
		`)

		const { data: apiaryUpdated, loading: apiaryLoading } = useSubscription(gql`
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

		console.log({ apiaryUpdated })
		console.log({ apiaries })

		return (
			<div style="max-width:800px;padding-left:20px;">
				{!apiaries || (apiaries.length === 0 && <ApiariesPlaceholder />)}

				{apiaries &&
					apiaries.map((apiary, i) => (
						<ApiaryListRow key={i} apiary={apiary} selectedId={props.id} />
					))}

				<div style="text-align: center;margin-top: 20px;">
					<Link href="/apiaries/create">Add another apiary</Link>
				</div>
			</div>
		)
	}
}
