import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { gql, useMutation } from '@/components/api'

import Map from '@/components/shared/map'
import VisualForm from '@/components/shared/visualForm'
import ErrorMsg from '@/components/shared/messageError'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import Button from '@/components/shared/button'
import T from '@/components/shared/translate'
import metrics from '@/components/metrics'

import style from './style.less'

export default function ApiaryEditForm() {
	let navigate = useNavigate()
	let [name, setName] = useState('')
	let [lat, setLat] = useState(0)
	let [lng, setLng] = useState(0)
	let [autoLocate, setAutoLocate] = useState(false)

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

			<h2><T ctx="this is a headline to create new apiary form">New apiary</T></h2>
			<Map
				lat={lat}
				lng={lng}
				autoLocate={autoLocate}
				onMarkerSet={(coords) => {
					setLat(coords.lat)
					setLng(coords.lng)
				}}
			/>

			<div className={style.apiary}>
				<VisualForm onSubmit={onSubmit}>
					<div>
						<label htmlFor="name" style="width:120px;"><T>Name</T></label>
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
							<T>Locate me</T>
						</Button>
						<Button type="submit" color="green">
							<T>Create</T>
						</Button>
					</VisualFormSubmit>
				</VisualForm>
			</div>
		</div>
	)
}
