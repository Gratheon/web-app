import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'

import { getApiary, updateApiary } from '@/components/models/apiary'

import VisualForm from '@/components/shared/visualForm'
import { gql, useMutation, useQuery } from '@/components/api'
import Loader from '@/components/shared/loader'
import ErrorMsg from '@/components/shared/messageError'
import OkMsg from '@/components/shared/messageSuccess'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import Button from '@/components/shared/button'
import Map from '@/components/shared/map'
import Weather from '@/components/shared/weather'
import Plants from '@/components/page/apiaryEdit/plants'

export default function ApiaryEditForm() {
	let navigate = useNavigate()
	let { id } = useParams()
	let [autoLocate, setAutoLocate] = useState(false)
	let [name, setName] = useState('')
	let [lat, setLat] = useState(0)
	let [lng, setLng] = useState(0)

	let apiary = useLiveQuery(() => getApiary(+id), [id])

	let {
		loading: loadingGet,
		error: errorGet,
		data: apiaryGet,
	} = useQuery(
		gql`
		query apiary($id: ID!) {
			apiary(id: $id) {
				id
				name
				lat
				lng
			}
		}
	`,
		{ variables: { id } }
	)

	if (!apiary) {
		if(loadingGet){
			return <Loader />
		}
		
		updateApiary({
			id: +apiaryGet.apiary.id,
			name: apiaryGet.apiary.name,
			lat: `${apiaryGet.apiary.lat}`,
			lng: `${apiaryGet.apiary.lng}`,
		})

		return <Loader />
	}

	let [deactivateApiary] = useMutation(gql`
		mutation deactivateApiary($id: ID!) {
			deactivateApiary(id: $id)
		}
	`)
	let [updateApiaryNetwork, { loading, error, data }] = useMutation(gql`
		mutation updateApiary($id: ID!, $apiary: ApiaryInput!) {
			updateApiary(id: $id, apiary: $apiary) {
				id
			}
		}
	`)

	// only initial load should set values, otherwise use state
	if (apiary && name == '') {
		setName(apiary.name)
		setLat(+apiary.lat)
		setLng(+apiary.lng)
	}

	if (!apiary || loading) {
		return <Loader />
	}

	async function onDeleteApiary() {
		await deactivateApiary({
			id,
		})

		navigate(`/apiaries`, { replace: true })
	}
	function onSubmit(e) {
		e.preventDefault()

		updateApiaryNetwork({
			id,
			apiary: {
				name,
				lat: `${lat}`,
				lng: `${lng}`,
			},
		})

		updateApiary({
			id: +id,
			name,
			lat: `${lat}`,
			lng: `${lng}`,
		})

	}

	// if (errorGet) {
	// 	return <ErrorMsg error={errorGet} />
	// }

	function onNameChange(e) {
		setName(e.target.value)
	}

	let errorMsg
	let okMsg

	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	if (data) {
		okMsg = <OkMsg />
	}

	return (
		<div>
			{okMsg}
			{errorMsg}

			<Map
				lat={lat}
				lng={lng}
				autoLocate={autoLocate}
				onMarkerSet={(coords) => {
					this.setState({
						apiary: {
							...apiary,
							...coords,
						},
					})
				}}
			/>

			<VisualForm style="padding:20px;" onSubmit={onSubmit.bind(this)}>
				<div>
					<label htmlFor="name">Name</label>
					<input
						name="name"
						id="name"
						style={{ width: '100%' }}
						autoFocus
						onInput={onNameChange}
						value={name}
					/>
				</div>
				<div>
					<label htmlFor="name">Location</label>
					<div>
						<a
							target="_blank"
							href={`https://www.google.com/maps/@${lat},${lng},16z/data=!3m1!1e3`}
							rel="noreferrer"
						>
							Google maps
						</a>
						<Button
							style="margin-left:20px"
							onClick={() => {
								setAutoLocate(!autoLocate)
							}}
						>
							Locate me
						</Button>
					</div>
				</div>

				<VisualFormSubmit>
					<Button type="submit" className="green">
						Update
					</Button>
					<Button
						style="margin-left:5px;"
						className="red"
						onClick={onDeleteApiary}
					>
						Delete
					</Button>
				</VisualFormSubmit>
			</VisualForm>

			{apiary && <Weather lat={lat} lng={lng} />}
			{apiary && <Plants lat={lat} lng={lng} />}
		</div>
	)
}
