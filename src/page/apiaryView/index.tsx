import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useQuery } from '@/api'
import { getApiary } from '@/models/apiary'
import Loader from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import MessageNotFound from '@/shared/messageNotFound'
import Button from '@/shared/button'
import T from '@/shared/translate'

import HivePlacement from '@/page/apiaryEdit/hivePlacement'
import styles from './index.module.less'

type WeatherSnapshot = {
	temperature: number | null
	windSpeed: number | null
	rain: number | null
}

function formatValue(value: number | null, suffix: string) {
	if (value === null || Number.isNaN(value)) return '--'
	return `${Math.round(value * 10) / 10}${suffix}`
}

function buildMapEmbedUrl(lat: number, lng: number) {
	const delta = 0.02
	const left = lng - delta
	const right = lng + delta
	const top = lat + delta
	const bottom = lat - delta
	return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`
}

export default function ApiaryView() {
	const { id } = useParams()
	const apiary = useLiveQuery(() => getApiary(+id), [id], null)
	const [weather, setWeather] = useState<WeatherSnapshot>({
		temperature: null,
		windSpeed: null,
		rain: null,
	})

	const {
		loading,
		error,
		data,
	} = useQuery(
		gql`
			query apiaryView($id: ID!) {
				apiary(id: $id) {
					id
					name
					lat
					lng
					hives {
						id
						hiveNumber
						boxCount
						family {
							name
						}
					}
				}
			}
		`,
		{ variables: { id } },
	)

	const apiaryFromQuery = data?.apiary
	const name = apiaryFromQuery?.name || apiary?.name || `Apiary #${id}`
	const lat = Number(apiaryFromQuery?.lat || apiary?.lat || 0)
	const lng = Number(apiaryFromQuery?.lng || apiary?.lng || 0)
	const hives = apiaryFromQuery?.hives || []
	const hivesCount = hives.length

	const mapUrl = useMemo(() => {
		if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) return null
		return buildMapEmbedUrl(lat, lng)
	}, [lat, lng])

	useEffect(() => {
		if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) return

		const controller = new AbortController()
		const fetchWeather = async () => {
			try {
				const response = await fetch(
					`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,precipitation`,
					{ signal: controller.signal },
				)
				const payload = await response.json()
				setWeather({
					temperature: payload?.current?.temperature_2m ?? null,
					windSpeed: payload?.current?.wind_speed_10m ?? null,
					rain: payload?.current?.precipitation ?? null,
				})
			} catch (e) {
				if ((e as Error).name !== 'AbortError') {
					setWeather({ temperature: null, windSpeed: null, rain: null })
				}
			}
		}

		fetchWeather()

		return () => controller.abort()
	}, [lat, lng])

	if (apiary === null && loading) {
		return <Loader />
	}

	if (!apiary && loading) {
		return <Loader />
	}

	if (!apiary && !apiaryFromQuery) {
		return (
			<MessageNotFound msg={<T>Apiary not found</T>}>
				<div><T>Apiary was not found.</T></div>
			</MessageNotFound>
		)
	}

	return (
		<div className={styles.page}>
			<ErrorMsg error={error} />

			<section className={styles.hero}>
				{apiary?.photoUrl && <img className={styles.heroImage} src={apiary.photoUrl} alt={name} />}
				<div className={styles.heroOverlay}>
					<div className={styles.heroContent}>
						<div className={styles.heroText}>
							<h1>{name}</h1>
							<div className={styles.heroMeta}>{hivesCount} <T>hives</T></div>
						</div>
						<Button color="green" href={`/apiaries/edit/${id}/placement`}>
							<T>Edit</T>
						</Button>
					</div>
				</div>
			</section>

			<section className={styles.cards}>
				<div className={styles.statCard}>
					<div className={styles.statLabel}><T>Temperature</T></div>
					<div className={styles.statValue}>{formatValue(weather.temperature, '°C')}</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statLabel}><T>Wind</T></div>
					<div className={styles.statValue}>{formatValue(weather.windSpeed, ' m/s')}</div>
				</div>
				<div className={styles.statCard}>
					<div className={styles.statLabel}><T>Rain</T></div>
					<div className={styles.statValue}>{formatValue(weather.rain, ' mm')}</div>
				</div>
			</section>

			<section className={styles.layout}>
				<div className={styles.panel}>
					<div className={styles.panelHead}><T>Hive placement</T></div>
					<HivePlacement apiaryId={id} hives={hives} readOnly />
				</div>
				<div className={styles.panel}>
					<div className={styles.panelHead}><T>Map</T></div>
					{mapUrl ? (
						<iframe className={styles.mapFrame} src={mapUrl} title="Apiary map" loading="lazy" />
					) : (
						<div style={{ padding: 12 }}><T>No coordinates set</T></div>
					)}
				</div>
			</section>
		</div>
	)
}
