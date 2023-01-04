import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { gql, useMutation } from '../../api'

import Map from '../../shared/map'
import VisualForm from '../../shared/visualForm'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import VisualFormSubmit from '../../shared/visualForm/VisualFormSubmit'
import Button from '../../shared/button'

export default function ApiaryEditForm() {
	let navigate = useNavigate()
	let [name, setName] = useState('')
	let [lat, setLat] = useState(0)
	let [lng, setLng] = useState(0)
	let [autoLocate, setAutoLocate] = useState(false)

	let [addApiary, { loading, error, data }] = useMutation(gql`
		mutation addApiary($apiary: ApiaryInput!) {
			addApiary(apiary: $apiary) {
				id
				name
				lat
				lng
			}
		}
	`)

	function onSubmit(e) {
		e.preventDefault()

		addApiary({
			apiary: {
				name,
				lat: `${lat}`,
				lng: `${lng}`,
			},
		})
	}

	if (data) {
		navigate('/apiaries', { replace: true })

		return <div>Saved!</div>
	}

	if (loading) {
		return <Loader />
	}

	let errorMsg

	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	return (
		<div style={{padding:20}}>
			{errorMsg}

			<h2 style={{marginBottom:10}}>New apiary</h2>
			<VisualForm onSubmit={onSubmit}>
				<Map
					lat={lat}
					lng={lng}
					autoLocate={autoLocate}
					onMarkerSet={(coords) => {
						setLat(coords.lat)
						setLng(coords.lng)
					}}
				/>
				<div>
					<label htmlFor="name">Name</label>
					<input
						name="name"
						id="name"
						style={{ width: '100%' }}
						autoFocus
						value={name}
						onInput={(e: any) => {
							setName(e.target.value)
						}}
					/>
				</div>

				<VisualFormSubmit>
					<Button
						onClick={() => {
							setAutoLocate(!autoLocate)
						}}
					>
						Locate me
					</Button>
					<Button type="submit" className="green">
						Create
					</Button>
				</VisualFormSubmit>
			</VisualForm>
		</div>
	)
}
