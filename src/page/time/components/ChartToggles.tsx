import styles from './ChartToggles.module.less'
import T from '@/shared/translate'
import type { ReactNode } from 'react'

interface ChartTogglesProps {
	enabledCharts: {
		population: boolean
		weight: boolean
		temperature: boolean
		entrance: boolean
		entranceSpeed: boolean
		entranceDetected: boolean
		entranceStationary: boolean
		entranceInteractions: boolean
		weather: boolean
		weatherTemperature: boolean
		wind: boolean
		rain: boolean
		solarRadiation: boolean
		cloudCover: boolean
		pollen: boolean
		pollution: boolean
	}
	showIdealCurve: boolean
	onToggleChart: (chartName: string) => void
	onToggleIdealCurve: (show: boolean) => void
	group: 'population' | 'scales' | 'entrance' | 'weather'
}

export default function ChartToggles({
	enabledCharts,
	showIdealCurve,
	onToggleChart,
	onToggleIdealCurve,
	group
}: ChartTogglesProps) {
	const Toggle = ({
		name,
		label,
		checked,
		isSubOption = false
	}: {
		name: string
		label: ReactNode
		checked: boolean
		isSubOption?: boolean
	}) => (
		<label
			className={`${styles.chartToggle} ${checked ? styles.enabled : ''} ${isSubOption ? styles.subOption : ''}`}
		>
			<input
				type="checkbox"
				checked={checked}
				onChange={() => onToggleChart(name)}
			/>
			<span>{label}</span>
		</label>
	)

	if (group === 'population') {
		return (
			<div className={styles.panel}>
				<h3 className={styles.title}>🐝 <T>Population</T></h3>
				<div className={styles.chartList}>
					<Toggle
						name="population"
						label={<><T>Population</T></>}
						checked={enabledCharts.population}
					/>
					{enabledCharts.population && (
						<label className={`${styles.chartToggle} ${styles.subOption} ${showIdealCurve ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={showIdealCurve}
								onChange={e => onToggleIdealCurve((e.target as HTMLInputElement).checked)}
							/>
							<span><T>Ideal Curve</T></span>
						</label>
					)}
				</div>
			</div>
		)
	}

	if (group === 'scales') {
		return (
			<div className={styles.panel}>
				<h3 className={styles.title}>📊 <T>Scales & Sensors</T></h3>
				<div className={styles.chartList}>
					<Toggle
						name="weight"
						label={<><T>Weight</T></>}
						checked={enabledCharts.weight}
					/>
					<Toggle
						name="temperature"
						label={<><T>Temperature</T></>}
						checked={enabledCharts.temperature}
					/>
				</div>
			</div>
		)
	}

	if (group === 'entrance') {
		return (
			<div className={styles.panel}>
				<h3 className={styles.title}>🚪 <T>Entrance Observer</T></h3>
				<div className={styles.chartList}>
					<Toggle
						name="entrance"
						label={<><T>Entrance Activity</T></>}
						checked={enabledCharts.entrance}
					/>
					<Toggle
						name="entranceSpeed"
						label={<><T>Bee Speed</T></>}
						checked={enabledCharts.entranceSpeed}
					/>
					<Toggle
						name="entranceDetected"
						label={<><T>Detected Bees</T></>}
						checked={enabledCharts.entranceDetected}
					/>
					<Toggle
						name="entranceStationary"
						label={<><T>Stationary Bees</T></>}
						checked={enabledCharts.entranceStationary}
					/>
					<Toggle
						name="entranceInteractions"
						label={<><T>Bee Interactions</T></>}
						checked={enabledCharts.entranceInteractions}
					/>
				</div>
			</div>
		)
	}

	return (
			<div className={styles.panel}>
				<h3 className={styles.title}>🌤️ <T>Weather</T></h3>
				<div className={styles.chartList}>
					<Toggle
						name="weather"
						label={<><T>Weather</T></>}
						checked={enabledCharts.weather}
					/>
					{enabledCharts.weather && (
						<>
							<Toggle
								name="weatherTemperature"
								label={<><T>Temperature</T></>}
								checked={enabledCharts.weatherTemperature}
								isSubOption
							/>
							<Toggle
								name="wind"
								label={<><T>Wind</T></>}
								checked={enabledCharts.wind}
								isSubOption
							/>
							<Toggle
								name="rain"
								label={<><T>Rain</T></>}
								checked={enabledCharts.rain}
								isSubOption
							/>
							<Toggle
								name="solarRadiation"
								label={<><T>Solar Radiation</T></>}
								checked={enabledCharts.solarRadiation}
								isSubOption
							/>
							<Toggle
								name="cloudCover"
								label={<><T>Cloud Cover</T></>}
								checked={enabledCharts.cloudCover}
								isSubOption
							/>
							<Toggle
								name="pollen"
								label={<><T>Pollen</T></>}
								checked={enabledCharts.pollen}
								isSubOption
							/>
							<Toggle
								name="pollution"
								label={<><T>Air Quality</T></>}
								checked={enabledCharts.pollution}
								isSubOption
							/>
						</>
					)}
				</div>
			</div>
	)
}
