import React from 'react'

import { gql, useQuery } from '../../../api'
import Loading from '../../../shared/loader'
import ErrorMsg from '../../../shared/messageError'

type PlantsProps = {
	lat: number
	lng: number
}

type Plant = {
	gbifID: string
	URL: string
	scientificName: string
	distance: number

	images: PlantImage[]
}

type PlantImage = {
	URL: string
	title: string
	source: string
	created: string
	creator: string
}

export default function Plants({ lat, lng }: PlantsProps) {
	if(!lat) return
	if(!lng) return
	
	let { loading, error, data } = useQuery(
		gql`
			query plants($lat: String!, $lng: String!) {
				plants(lat: $lat, lng: $lng) {
					gbifID
					URL
					scientificName
					distance
					images {
						URL
						title
						source
						created
						creator
					}
				}
			}
		`,
		{ variables: { lat: `${lat}`, lng: `${lng}` } }
	)

	if (loading) {
		return <Loading />
	}

	if (!data?.plants) {
		return <ErrorMsg error={'could not load local plants'} />
	}

	if (error) {
		return <ErrorMsg error={error} />
	}

	if (!data.plants || data.plants.length == 0) {
		return
	}

	return (
		<div style={{ padding: '0 30px' }}>
			<h3>Local plants</h3>

			<div style={{ display: 'flex' }}>
				<div style={{ minWidth: 200, fontSize: 10 }}>
					{data.plants.map((plant: Plant) => {
						return (
							<div>
								<a href={plant.URL}>{plant.scientificName}</a>
							</div>
						)
					})}
				</div>

				<div style={{ flexGrow: 7 }}>
					{data.plants.map((plant: Plant) => {
						return (
							<div style={{ display: 'inline' }}>
								{plant.images.map((image) => {
									return (
										<img
											src={image.URL}
											title={image.title}
											style={{ height: 100 }}
										/>
									)
								})}
							</div>
						)
					})}
				</div>
			</div>

			<div style={{ fontSize: 10, color: 'gray' }}>
				Results are based on dataset by AFFOUARD A, JOLY A, LOMBARDO J, CHAMP
				J, GOEAU H, BONNET P (2022) et al. Pl@ntNet automatically identified
				occurrences. Version 1.3. Pl@ntNet. via{' '}
				<i>
					GBIF.org (31 October 2022) GBIF Occurrence Download
					https://doi.org/10.15468/dl.dn88uh
				</i>
			</div>
		</div>
	)
}
