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

type WeatherTone = 'good' | 'warn' | 'bad' | 'neutral' | 'cold'

type WeatherStatus = {
	tone: WeatherTone
	label: string
	hint: string
	icon: 'sunny' | 'rain' | 'storm' | 'cold' | 'mild' | 'hot' | 'wind-calm' | 'wind-strong'
}

function formatValue(value: number | null, suffix: string) {
	if (value === null || Number.isNaN(value)) return '--'
	return `${Math.round(value * 10) / 10}${suffix}`
}

function classifyTemperature(value: number | null): WeatherStatus {
	if (value === null || Number.isNaN(value)) {
		return { tone: 'neutral', label: 'No data', hint: 'Unable to evaluate bee comfort.', icon: 'mild' }
	}
	if (value < 10) {
		return { tone: 'cold', label: 'Too cold', hint: 'Flight activity is usually very low.', icon: 'cold' }
	}
	if (value < 14) {
		return { tone: 'warn', label: 'Cool', hint: 'Bees may fly less than usual.', icon: 'cold' }
	}
	if (value <= 32) {
		return { tone: 'good', label: 'Bee-friendly', hint: 'Good range for regular foraging.', icon: 'mild' }
	}
	if (value <= 36) {
		return { tone: 'warn', label: 'Hot', hint: 'Colonies may spend energy on cooling.', icon: 'hot' }
	}
	return { tone: 'bad', label: 'Too hot', hint: 'Heat stress risk is elevated.', icon: 'hot' }
}

function classifyWind(value: number | null): WeatherStatus {
	if (value === null || Number.isNaN(value)) {
		return { tone: 'neutral', label: 'No data', hint: 'Unable to evaluate wind impact.', icon: 'wind-calm' }
	}
	if (value <= 4) {
		return { tone: 'good', label: 'Chill breeze', hint: 'Comfortable flying conditions.', icon: 'wind-calm' }
	}
	if (value <= 8) {
		return { tone: 'warn', label: 'Breezy', hint: 'Some flight reduction is possible.', icon: 'wind-calm' }
	}
	return { tone: 'bad', label: 'Strong wind', hint: 'Foraging can drop in gusty conditions.', icon: 'wind-strong' }
}

function classifyRain(value: number | null): WeatherStatus {
	if (value === null || Number.isNaN(value)) {
		return { tone: 'neutral', label: 'No data', hint: 'Unable to evaluate rain impact.', icon: 'sunny' }
	}
	if (value === 0) {
		return { tone: 'good', label: 'Sunny or dry', hint: 'Best chance for active foraging.', icon: 'sunny' }
	}
	if (value <= 1) {
		return { tone: 'warn', label: 'Light rain', hint: 'Flight traffic may slow down.', icon: 'rain' }
	}
	return { tone: 'bad', label: 'Rainy', hint: 'Bees often stay inside the hive.', icon: 'storm' }
}

function WeatherIcon({ kind }: { kind: WeatherStatus['icon'] }) {
	if (kind === 'sunny') {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<circle cx="12" cy="12" r="4.5" fill="currentColor" />
				<g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
					<path d="M12 2.4v3" />
					<path d="M12 18.6v3" />
					<path d="M2.4 12h3" />
					<path d="M18.6 12h3" />
					<path d="m5.1 5.1 2.2 2.2" />
					<path d="m16.7 16.7 2.2 2.2" />
					<path d="m18.9 5.1-2.2 2.2" />
					<path d="m7.3 16.7-2.2 2.2" />
				</g>
			</svg>
		)
	}

	if (kind === 'rain' || kind === 'storm') {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d="M7.6 17.4h8.8a3.6 3.6 0 0 0 .2-7.2 4.9 4.9 0 0 0-9.5 1.2A3.2 3.2 0 0 0 7.6 17.4Z"
				/>
				{kind === 'rain' ? (
					<g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
						<path d="m9.5 18.4-.8 2.2" />
						<path d="m12.3 18.4-.8 2.2" />
						<path d="m15.1 18.4-.8 2.2" />
					</g>
				) : (
					<>
						<path fill="currentColor" d="m11 18.1 1.9 0-1 1.9h1.6l-2.4 3.3.5-2h-1.5z" />
						<g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
							<path d="m8.4 18.4-.7 2.2" />
							<path d="m16.2 18.4-.7 2.2" />
						</g>
					</>
				)}
			</svg>
		)
	}

	if (kind === 'hot') {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					fill="currentColor"
					d="M14.8 13.6V6.2a2.8 2.8 0 1 0-5.6 0v7.4a4.8 4.8 0 1 0 5.6 0Zm-2.8 7a2.2 2.2 0 0 1-1.2-4V6.2a1.2 1.2 0 1 1 2.4 0v10.4a2.2 2.2 0 0 1-1.2 4Z"
				/>
				<path fill="currentColor" d="M12 15.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z" />
			</svg>
		)
	}

	if (kind === 'cold') {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
					<path d="M12 3.3v17.4" />
					<path d="m6.2 6.2 11.6 11.6" />
					<path d="m17.8 6.2-11.6 11.6" />
					<path d="M3.3 12h17.4" />
				</g>
			</svg>
		)
	}

	if (kind === 'wind-strong' || kind === 'wind-calm') {
		return (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
					<path d="M3.5 8.2h10.7a2.3 2.3 0 1 0-2.3-2.3" />
					<path d="M2.9 12.3h14.5a2.3 2.3 0 1 1-2.3 2.3" />
					<path d="M4.5 16.4h8.4a2.2 2.2 0 1 1-2.2 2.2" />
				</g>
			</svg>
		)
	}

	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				fill="currentColor"
				d="M14.8 13.6V6.2a2.8 2.8 0 1 0-5.6 0v7.4a4.8 4.8 0 1 0 5.6 0Zm-2.8 7a2.2 2.2 0 0 1-1.2-4V6.2a1.2 1.2 0 1 1 2.4 0v10.4a2.2 2.2 0 0 1-1.2 4Z"
			/>
		</svg>
	)
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
	const temperatureStatus = classifyTemperature(weather.temperature)
	const windStatus = classifyWind(weather.windSpeed)
	const rainStatus = classifyRain(weather.rain)

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
				<div className={`${styles.statCard} ${styles[`${temperatureStatus.tone}Card`]}`}>
					<div className={styles.statTop}>
						<div className={styles.statLabel}><T>Temperature</T></div>
						<div className={styles.statIcon}><WeatherIcon kind={temperatureStatus.icon} /></div>
					</div>
					<div className={styles.statValue}>{formatValue(weather.temperature, '°C')}</div>
					<div className={`${styles.statTag} ${styles[`${temperatureStatus.tone}Tag`]}`}>{temperatureStatus.label}</div>
					<div className={styles.statHint}>{temperatureStatus.hint}</div>
				</div>
				<div className={`${styles.statCard} ${styles[`${windStatus.tone}Card`]}`}>
					<div className={styles.statTop}>
						<div className={styles.statLabel}><T>Wind</T></div>
						<div className={styles.statIcon}><WeatherIcon kind={windStatus.icon} /></div>
					</div>
					<div className={styles.statValue}>{formatValue(weather.windSpeed, ' m/s')}</div>
					<div className={`${styles.statTag} ${styles[`${windStatus.tone}Tag`]}`}>{windStatus.label}</div>
					<div className={styles.statHint}>{windStatus.hint}</div>
				</div>
				<div className={`${styles.statCard} ${styles[`${rainStatus.tone}Card`]}`}>
					<div className={styles.statTop}>
						<div className={styles.statLabel}><T>Rain</T></div>
						<div className={styles.statIcon}><WeatherIcon kind={rainStatus.icon} /></div>
					</div>
					<div className={styles.statValue}>{formatValue(weather.rain, ' mm')}</div>
					<div className={`${styles.statTag} ${styles[`${rainStatus.tone}Tag`]}`}>{rainStatus.label}</div>
					<div className={styles.statHint}>{rainStatus.hint}</div>
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
