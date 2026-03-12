import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useQuery } from '../../api'

import Button from '../../shared/button'
import { getUser } from '@/models/user'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import T from '../../shared/translate'

import ApiaryListRow from './apiaryListRow'
import ApiariesPlaceholder from './apiariesPlaceholder'
import PagePaddedCentered from '@/shared/pagePaddedCentered/index'


export default function ApiaryList(props) {
	let user = useLiveQuery(() => getUser(), [], null)

	const [hiveSortBy, setHiveSortBy] = React.useState('HIVE_NUMBER')
	const [hiveSortOrder, setHiveSortOrder] = React.useState('ASC')

	const handleHiveSortChange = React.useCallback((sortBy) => {
		if (hiveSortBy === sortBy) {
			setHiveSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'))
			return
		}

		setHiveSortBy(sortBy)
		setHiveSortOrder('ASC')
	}, [hiveSortBy])

	const { loading, error, data, errorNetwork } = useQuery(gql`
		query apiaries($hiveSortBy: HiveSortBy, $hiveSortOrder: SortOrder) {
			apiaries {
				id
				name

				hives(sortBy: $hiveSortBy, sortOrder: $hiveSortOrder) {
					id
					hiveNumber
					beeCount
					status

					lastInspection
					isNew

					family{
						id
						name
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
	`, {
		variables: {
			hiveSortBy,
			hiveSortOrder,
		},
	})

	if (loading) {
		return <Loader />
	}

	const { apiaries } = data

	return (
		<PagePaddedCentered>
			<ErrorMsg error={error || errorNetwork} borderRadius={0} />
			{apiaries !== null && apiaries?.length === 0 && <ApiariesPlaceholder />}

			{apiaries &&
				apiaries.map((apiary, i) => (
					<ApiaryListRow
						key={i}
						apiary={apiary}
						user={user}
						sortBy={hiveSortBy}
						sortOrder={hiveSortOrder}
						onSortChange={handleHiveSortChange}
					/>
				))}

			<div style="text-align:center; margin: 15px 0;">
				<Button 
					color={apiaries && apiaries.length === 0 ? 'green' : 'white'}
					href="/apiaries/create"><T ctx="its a button">Setup new apiary</T></Button>
			</div>
		</PagePaddedCentered>
	)
}
