import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { gql, useMutation } from '@/components/api'

import Map from '@/components/shared/map'
import VisualForm from '@/components/shared/visualForm'
import ErrorMsg from '@/components/shared/messageError'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import Button from '@/components/shared/button'
import T, { useTranslation } from '@/components/shared/translate'
import metrics from '@/components/metrics'

import style from './style.less'
import LocationMarker from '@/components/icons/locationMarker'

export default function ApiaryEditForm() {
	let navigate = useNavigate()
	let [name, setName] = useState('')
	let [lat, setLat] = useState(0)
	let [lng, setLng] = useState(0)
	let [autoLocate, setAutoLocate] = useState(false)
	let tName = useTranslation('Name')

	let [addApiary, { error, data }] = useMutation(gql`
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
		metrics.trackApiaryCreated()
		navigate('/apiaries', { replace: true })

		return <div>Saved!</div>
	}

	let errorMsg

	if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	return (
		<div>
			{errorMsg}

			<div className={style.apiary}>
				<form onSubmit={onSubmit} style="display:flex">
					<h2 style="width:30%;"><T ctx="this is a headline to create new apiary form">New apiary</T></h2>


					<input
						name="name"
						id="name"
						placeholder={tName}
						style="margin: 0 10px;flex-grow:1;height: 40px;padding: 0 10px;"
						autoFocus
						value={name}
						onInput={(e: any) => {
							setName(e.target.value)
						}}
					/>

					<Button type="submit" color="green">
						<T>Create</T>
					</Button>
					<Button
						onClick={() => {
							setAutoLocate(!autoLocate)
						}}
					>
						<LocationMarker />

						<T>Locate me</T>
					</Button>
				</form>
			</div>

			<Map
				lat={lat}
				lng={lng}
				autoLocate={autoLocate}
				onMarkerSet={(coords) => {
					setLat(coords.lat)
					setLng(coords.lng)
				}}
			/>
		</div>
	)
}
