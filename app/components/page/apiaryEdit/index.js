import React, { useState } from 'react'
import { Component } from 'preact'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router'

import VisualForm from '../../shared/visualForm'
import { gql, useMutation, useQuery } from '../../api'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import OkMsg from '../../shared/messageSuccess'
import VisualFormSubmit from '../../shared/visualForm/VisualFormSubmit'
import Button from '../../shared/button'
import Map from '../../shared/map'
import Weather from '../../shared/weather'
import Plants from '../../shared/plants'
export default class ApiaryEditForm extends Component {
	render() {
		let navigate = useNavigate()
		let { id } = useParams()
		let [autoLocate, setAutoLocate] = useState(false)
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

		let [deactivateApiary] = useMutation(gql`
			mutation deactivateApiary($id: ID!) {
				deactivateApiary(id: $id)
			}
		`)
		let [updateApiary, { loading, error, data }] = useMutation(gql`
			mutation updateApiary($id: ID!, $apiary: ApiaryInput!) {
				updateApiary(id: $id, apiary: $apiary) {
					id
				}
			}
		`)

		if (apiaryGet && !this.state.apiary) {
			this.setState({
				apiary: apiaryGet.apiary,
			})
		}

		const apiary = this.state.apiary

		if (!apiary || loading || loadingGet) {
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

			updateApiary({
				id,
				apiary: {
					name: this.state.apiary.name,
					lat: `${this.state.apiary.lat}`,
					lng: `${this.state.apiary.lng}`,
				},
			})
		}

		if (errorGet) {
			return <ErrorMsg error={errorGet} />
		}

		function onNameChange(e) {
			this.setState({
				apiary: {
					...this.state.apiary,
					name: e.target.value,
				},
			})
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
					lat={apiary.lat}
					lng={apiary.lng}
					autoLocate={autoLocate}
					onMarkerSet={(coords) => {
						this.setState({
							apiary: {
								...apiaryGet.apiary,
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
							value={apiary.name}
							autoFocus
							onInput={onNameChange.bind(this)}
							ref={(input) => {
								this.nameInput = input
							}}
						/>
					</div>
					<div>
						<label htmlFor="name">Location</label>
						<div>
							<a
								target="_blank"
								href={`https://www.google.com/maps/@${apiary.lat},${apiary.lng},16z/data=!3m1!1e3`}
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
						<Button type="submit" class="green">
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

				{apiary && <Weather lat={apiary.lat} lng={apiary.lng} />}
				{apiary && <Plants lat={apiary.lat} lng={apiary.lng} />}
			</div>
		)
	}
}
