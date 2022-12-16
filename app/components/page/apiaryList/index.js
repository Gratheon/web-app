import React from 'react'
import { Component } from 'preact'

import Link from '../../shared/link'
import { gql, useQuery } from '../../api'
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

		if (error) {
			return <ErrorMsg error={error} />
		}

		if (loading) {
			return <Loader />
		}

		const { apiaries } = data

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
