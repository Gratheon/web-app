import React, { useState, useRef, useMemo } from 'react'
import { Icon } from 'leaflet'
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	LayerGroup,
	Circle,
	useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useMap } from 'react-leaflet'

//@ts-ignore
import iconUrl from './images/marker-icon.png'
//@ts-ignore
import iconRetinaUrl from './images/marker-icon-2x.png'

type LocationMarkerProps = {
	onMarkerSet: any
	lat: number
	lng: number
	autoLocate: boolean
}

function LocationMarker({
	onMarkerSet,
	lat,
	lng,
	autoLocate = false,
}: LocationMarkerProps) {
	const [position, setPosition] = useState({
		lat,
		lng,
	})
	const markerRef = useRef(null)
	const map = useMapEvents({
		// click() {
		// 	map.locate()
		// },
		locationfound(e) {
			setPosition(e.latlng)
			map.flyTo(e.latlng, map.getZoom())

			onMarkerSet(e.latlng, map.getZoom())
		},
	})

	useMemo(() => {
		map.locate()
	}, [autoLocate])

	const eventHandlers = useMemo(
		() => ({
			dragend() {
				const marker: any = markerRef.current

				if (typeof marker !== null) {
					setPosition(marker.getLatLng())
					onMarkerSet(marker.getLatLng(), map.getZoom())
				}
			},
		}),
		[]
	)

	return position === null ? null : (
		<Marker
			position={position}
			draggable={true}
			eventHandlers={eventHandlers}
			ref={markerRef}
			icon={
				new Icon({
					iconUrl,
					iconRetinaUrl,
					placement: 'center',
					iconSize: [12, 20],
					iconAnchor: [6, 10],
					popupAnchor: [0, 0],
				})
			}
		>
			<Popup>You are here</Popup>
		</Marker>
	)
}

type MapProps = {
	lat: number
	lng: number
	autoLocate: boolean
	onMarkerSet: CallableFunction
}

const Map = ({ lat = null, lng = null, autoLocate = false, onMarkerSet }) => {
	console.log({lat, lng})
	if (lat === '' || isNaN(lat)) return;
	if (lng === '' || isNaN(lng)) return;

	return (
		<div>
			<MapContainer
				style={{ width: '100%', height: 300 }}
				center={[lat, lng]}
				zoom={15}
				zoomControl={true}
				dragging={true}
				scrollWheelZoom={true}
				whenReady={() => {
					if (typeof window !== 'undefined') {
						window.dispatchEvent(new Event('resize'))
					}
				}}
			>
				<ChangeView center={[lat, lng]} />
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
				<LocationMarker
					autoLocate={autoLocate}
					onMarkerSet={onMarkerSet}
					lat={lat}
					lng={lng}
				/>

				<LayerGroup>
					<Circle
						center={[lat, lng]}
						opacity={0.5}
						fillOpacity={0.3}
						pathOptions={{ fillColor: 'orange', color: 'orange' }}
						radius={1000}
					/>
					<Circle
						center={[lat, lng]}
						opacity={0.5}
						pathOptions={{ fillColor: 'green', color: 'green' }}
						radius={3000}
					/>
				</LayerGroup>
			</MapContainer>
		</div>
	)

}

const ChangeView = ({ center }: { center: any }) => {
	const map = useMap()
	map.setView(center)
	return null
}

export default Map
