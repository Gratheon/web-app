import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import proj4 from 'proj4'
import { getApiary, updateApiary } from '../../models/apiary.ts'

import VisualForm from '../../shared/visualForm'
import { gql, useMutation, useQuery } from '../../api'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import MessageSuccess from '../../shared/messageSuccess'
import Button from '../../shared/button'
import Map from '../../shared/map'
import Weather from '../../shared/weather'
import Plants from './plants'
import MessageNotFound from '../../shared/messageNotFound'
import DeleteIcon from '../../icons/deleteIcon.tsx'
import T from '../../shared/translate'
import HivePlacement from './hivePlacement'

import { Tab, TabBar } from '../../shared/tab'
import LocationMarker from '../../icons/locationMarker.tsx'

// coordinate conversion for PRIA
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");
proj4.defs("EPSG:3301", "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +units=m +no_defs");

function wgs84ToLest97(lat, lon) {
	// Transform the WGS 84 coordinates to L-EST97
	return proj4("EPSG:4326", "EPSG:3301", [lon, lat]);
}


export function isEstonia(lat, lng){
	lng = parseFloat(lng)
	lat = parseFloat(lat)

	let matchesLng = lng >= 21.8 && lng <= 28.2
	let matchesLat = lat >= 57.5 && lat <= 59.5

	return matchesLng && matchesLat
}

export default function ApiaryEditForm() {
	let navigate = useNavigate()
	let { id } = useParams()
	let [autoLocate, setAutoLocate] = useState(false)
	let [name, setName] = useState('')
	let [lat, setLat] = useState(0)
	let [lng, setLng] = useState(0)

	let [mapTab, setMapTab] = useState(0)

	// Model function getApiary now handles invalid IDs
	let apiary = useLiveQuery(() => getApiary(+id), [id]);

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
				hives {
					id
					hiveNumber
					family {
						name
					}
				}
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
			return <MessageNotFound msg={<T>Apiary not found</T>}>
				<div><T ctx="this is a not-found error message">Apiary was either deleted, never existed or we have a navigation or backend error. You can create new apiary from apiary list view</T></div>
			</MessageNotFound>
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

	let estonia_plane_map=null;

	// conditionally show Estonia
	if (isEstonia(lat, lng)) {
		let [y, x] = wgs84ToLest97(lat, lng)
		estonia_plane_map = <Button href={`https://kls.pria.ee/kaart/#map=12/${x}/${y}`}>Estonia PRIA map</Button>
	}

	let satellite_map = <iframe style="width:100%;height:400px; border:0;" src={`https://apps.sentinel-hub.com/eo-browser/?zoom=15&lat=${lat}&lng=${lng}&themeId=DEFAULT-THEME&visualizationUrl=https%3A%2F%2Fservices.sentinel-hub.com%2Fogc%2Fwms%2Fbd86bcc0-f318-402b-a145-015f85b9427e&datasetId=S2L2A&fromTime=2023-09-14T00%3A00%3A00.000Z&toTime=2023-09-14T23%3A59%3A59.999Z&layerId=2_TONEMAPPED_NATURAL_COLOR&demSource3D=%22MAPZEN%22`}></iframe>
	let moisture_map = <iframe style="width:100%;height:400px; border:0;" src={`https://dataspace.copernicus.eu/browser/?zoom=15&lat=${lat}&lng=${lng}&themeId=DEFAULT-THEME&visualizationUrl=https%3A%2F%2Fsh.dataspace.copernicus.eu%2Fogc%2Fwms%2Fa91f72b5-f393-4320-bc0f-990129bd9e63&datasetId=S2_L2A_CDAS&fromTime=2023-10-01T00%3A00%3A00.000Z&toTime=2023-10-01T23%3A59%3A59.999Z&layerId=5-MOISTURE-INDEX1&demSource3D=%22MAPZEN%22&cloudCoverage=30`}></iframe>

	return (
		<div>
			{data && <MessageSuccess title={<T>Apiary saved</T>} />}
			<ErrorMsg error={error || errorGet} />

			<div style="padding:20px;">
				<VisualForm onSubmit={onSubmit.bind(this)}>
					<div>
						<label htmlFor="name" style="width:120px;"><T>Name</T></label>
						<div>
							<input
								name="name"
								id="name"
								style={{width: '100%'}}
								autoFocus
								onInput={onNameChange}
								value={name}
							/>
						</div>
					</div>


					<div>
						<div></div>
						<div style={"display:flex; flex-direction: row-reverse;"}>
							<Button color="red" loading={saving}
									onClick={onDeleteApiary}><DeleteIcon/><span><T>Delete</T></span></Button>
							<Button type="submit" loading={saving} color="green"><T>Save</T></Button>


							<Button
								onClick={() => {
									setAutoLocate(!autoLocate)
								}}
							><LocationMarker/><span><T>Locate me</T></span></Button>

							{estonia_plane_map}

						</div>
					</div>
				</VisualForm>
			</div>
			<TabBar>
				<Tab isSelected={mapTab == 0} onClick={() => {
					setMapTab(0)
				}}><T>Position</T></Tab>
				<Tab isSelected={mapTab == 1} onClick={() => {
					setMapTab(1)
				}}><T>Satellite</T></Tab>
				<Tab isSelected={mapTab == 2} onClick={() => {
					setMapTab(2)
				}}><T>Hive Placement</T></Tab>
				<Tab isSelected={mapTab == 3} onClick={() => {
					setMapTab(3)
				}}><T>Moisture</T></Tab>
			</TabBar>
			<div>
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
				{mapTab == 2 && apiaryGet?.apiary?.hives && (
					<HivePlacement apiaryId={id} hives={apiaryGet.apiary.hives} />
				)}
				{mapTab == 3 && moisture_map}
			</div>

			{/*<div>*/}
			{/*	Metadata: lat={lat}, lng={lng}.*/}
			{/*	<a*/}
			{/*		target="_blank"*/}
			{/*		href={`https://www.google.com/maps/@${lat},${lng},16z/data=!3m1!1e3`}*/}
			{/*		rel="noreferrer"*/}
			{/*	>*/}
			{/*		Google maps*/}
			{/*	</a>*/}

			{/*</div>*/}

			{apiary && <Weather lat={lat} lng={lng} />}
			{apiary && <Plants lat={lat} lng={lng} />}
		</div>
	)
}
