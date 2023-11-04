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
import Plants from './plants'
import MessageNotFound from '@/components/shared/messageNotFound'
import DeleteIcon from '@/icons/deleteIcon'
import T from '@/components/shared/translate'

import style from './style.less'
import PollinationTab from './pollinationTab'


export default function ApiaryEditForm() {
	let navigate = useNavigate()
	let { id } = useParams()
	let [autoLocate, setAutoLocate] = useState(false)
	let [name, setName] = useState('')
	let [lat, setLat] = useState(0)
	let [lng, setLng] = useState(0)

	let [mapTab, setMapTab] = useState(0)

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
		if (loadingGet) {
			return <Loader />
		}
		else {
			return <MessageNotFound msg="Apiary not found" />
		}
	}

	let [deactivateApiary] = useMutation(gql`
		mutation deactivateApiary($id: ID!) {
			deactivateApiary(id: $id)
		}
	`)
	let [updateApiaryNetwork, { error, data }] = useMutation(gql`
		mutation updateApiary($id: ID!, $apiary: ApiaryInput!) {
			updateApiary(id: $id, apiary: $apiary) {
				id
			}
		}
	`)

	// only initial load should set values, otherwise use state
	if (apiary && name == '') {
		setName(apiary.name)

		if (apiary.lat && !isNaN(+apiary.lat)) setLat(+apiary.lat)
		if (apiary.lng && !isNaN(+apiary.lng)) setLng(+apiary.lng)
	}

	if (!apiary) {
		return <Loader />
	}


	const [saving, setSaving] = useState(false)

	async function onDeleteApiary() {
		if (confirm('Are you sure?')) {
			setSaving(true);
			await deactivateApiary({
				id,
			})

			setSaving(false);
			navigate(`/apiaries`, { replace: true })
		}
	}

	function onSubmit(e) {
		e.preventDefault()

		setSaving(true);
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
		setSaving(false);
	}

	function onNameChange(e) {
		setName(e.target.value)
	}

	let estonia_plane_map;

	// conditionally show Estonia
	if (lng > 21 && lng < 28 && lat > 57 && lat < 60) {
		estonia_plane_map = <iframe style="width:100%;height:600px; border:0;" src={`https://kls.pria.ee/kaart/`}></iframe>
	}

	let satellite_map = <iframe style="width:100%;height:600px; border:0;" src={`https://apps.sentinel-hub.com/eo-browser/?zoom=15&lat=${lat}&lng=${lng}&themeId=DEFAULT-THEME&visualizationUrl=https%3A%2F%2Fservices.sentinel-hub.com%2Fogc%2Fwms%2Fbd86bcc0-f318-402b-a145-015f85b9427e&datasetId=S2L2A&fromTime=2023-09-14T00%3A00%3A00.000Z&toTime=2023-09-14T23%3A59%3A59.999Z&layerId=2_TONEMAPPED_NATURAL_COLOR&demSource3D=%22MAPZEN%22`}></iframe>
	let moisture_map = <iframe style="width:100%;height:600px; border:0;" src={`https://dataspace.copernicus.eu/browser/?zoom=15&lat=${lat}&lng=${lng}&themeId=DEFAULT-THEME&visualizationUrl=https%3A%2F%2Fsh.dataspace.copernicus.eu%2Fogc%2Fwms%2Fa91f72b5-f393-4320-bc0f-990129bd9e63&datasetId=S2_L2A_CDAS&fromTime=2023-10-01T00%3A00%3A00.000Z&toTime=2023-10-01T23%3A59%3A59.999Z&layerId=5-MOISTURE-INDEX1&demSource3D=%22MAPZEN%22&cloudCoverage=30`}></iframe>

	return (
		<div>
			{data && <OkMsg />}
			<ErrorMsg error={error || errorGet} />

			<div style="padding:20px;">
				<VisualForm onSubmit={onSubmit.bind(this)}>
					<div>
						<label htmlFor="name" style="width:120px;"><T>Name</T></label>
						<div>
							<input
								name="name"
								id="name"
								style={{ width: '100%' }}
								autoFocus
								onInput={onNameChange}
								value={name}
							/>
						</div>
					</div>

					<VisualFormSubmit>

						<Button className="red" loading={saving} onClick={onDeleteApiary}><DeleteIcon /><span><T>Delete</T></span></Button>
						<Button type="submit" loading={saving} className="green"><T>Save</T></Button>


						<Button
							onClick={() => {
								setAutoLocate(!autoLocate)
							}}
						><T>Locate me</T></Button>

					</VisualFormSubmit>
				</VisualForm>

				<PollinationTab lat={lat} lng={lng} />

				<div className={style.tab} onClick={() => { setMapTab(0) }}>Position</div>
				<div className={style.tab} onClick={() => { setMapTab(1) }}>Satellite</div>
				<div className={style.tab} onClick={() => { setMapTab(3) }}>Moisture</div>
				<div className={style.tab} onClick={() => { setMapTab(2) }}>High resolution</div>

				{mapTab == 0 && <Map
					lat={lat}
					lng={lng}
					autoLocate={autoLocate}
					onMarkerSet={(coords) => {
						setLat(coords.lat)
						setLng(coords.lng)
					}}
				/>}

				{mapTab == 1 && satellite_map}
				{mapTab == 2 && estonia_plane_map}
				{mapTab == 3 && moisture_map}


				<div>
					Metadata: lat={lat}, lng={lng}.
					<a
						target="_blank"
						href={`https://www.google.com/maps/@${lat},${lng},16z/data=!3m1!1e3`}
						rel="noreferrer"
					>
						Google maps
					</a>

				</div>

				{apiary && <Weather lat={lat} lng={lng} />}
				{apiary && <Plants lat={lat} lng={lng} />}
			</div>
		</div>
	)
}
