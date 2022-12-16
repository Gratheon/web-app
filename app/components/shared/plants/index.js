import React from 'react'

import { gql, useQuery } from '../../api'
import Loading from '../loader'
import ErrorMsg from '../messageError'

export default function Plants({ lat, lng }) {
	let { loading, error, data } = useQuery(
		gql`
			query plants($lat: String!, $lng: String!) {
				plants(lat: $lat, lng: $lng){
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

	console.log(data);
	return (
		<div style="padding:0 30px;">
			<h3>Local plants</h3>
			<div style="display:flex;">
				<div style="min-width:200px; font-size:10px;">
					{data.plants.map((plant) => {
						return <div><a href={plant.URL}>{plant.scientificName}</a></div>
					})}
				</div>

				<div style="flex-grow:7">
					{data.plants.map((plant) => {
						return <div style="display:inline;">{plant.images.map((image) => {
							return <img src={image.URL} title={image.title} style="height:100px" />
						})}</div>
					})}
				</div>
			</div>
			{data.plants && 
						<div style="font-size:10px; color:gray;">
							Results are based on dataset by AFFOUARD A, JOLY A, LOMBARDO J, CHAMP J, GOEAU H, BONNET P (2022) et al.
							Pl@ntNet automatically identified occurrences.
							Version 1.3. Pl@ntNet. via <i>GBIF.org (31 October 2022) GBIF Occurrence Download https://doi.org/10.15468/dl.dn88uh</i>
						</div>
			}
		</div>
	)
}