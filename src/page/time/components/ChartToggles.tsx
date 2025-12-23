import styles from './ChartToggles.module.less'
import T from '@/shared/translate'

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
}

export default function ChartToggles({
	enabledCharts,
	showIdealCurve,
	onToggleChart,
	onToggleIdealCurve
}: ChartTogglesProps) {
	return (
		<div className={styles.panel}>
			<h3 className={styles.title}><T>Charts</T></h3>
			<div className={styles.chartList}>
				<label className={`${styles.chartToggle} ${enabledCharts.population ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.population}
						onChange={() => onToggleChart('population')}
					/>
					<span>🐝 <T>Population</T></span>
				</label>

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

				<div className={styles.groupTitle}>📊 <T>Scales & Sensors</T></div>

				<label className={`${styles.chartToggle} ${enabledCharts.weight ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.weight}
						onChange={() => onToggleChart('weight')}
					/>
					<span>⚖️ <T>Weight</T></span>
				</label>

				<label className={`${styles.chartToggle} ${enabledCharts.temperature ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.temperature}
						onChange={() => onToggleChart('temperature')}
					/>
					<span>🌡️ <T>Temperature</T></span>
				</label>

				<div className={styles.groupTitle}>🚪 <T>Entrance Observer</T></div>

				<label className={`${styles.chartToggle} ${enabledCharts.entrance ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.entrance}
						onChange={() => onToggleChart('entrance')}
					/>
					<span><T>Entrance Activity</T></span>
				</label>

				<label className={`${styles.chartToggle} ${enabledCharts.entranceSpeed ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.entranceSpeed}
						onChange={() => onToggleChart('entranceSpeed')}
					/>
					<span><T>Bee Speed</T></span>
				</label>

				<label className={`${styles.chartToggle} ${enabledCharts.entranceDetected ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.entranceDetected}
						onChange={() => onToggleChart('entranceDetected')}
					/>
					<span><T>Detected Bees</T></span>
				</label>

				<label className={`${styles.chartToggle} ${enabledCharts.entranceStationary ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.entranceStationary}
						onChange={() => onToggleChart('entranceStationary')}
					/>
					<span><T>Stationary Bees</T></span>
				</label>

				<label className={`${styles.chartToggle} ${enabledCharts.entranceInteractions ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.entranceInteractions}
						onChange={() => onToggleChart('entranceInteractions')}
					/>
					<span><T>Bee Interactions</T></span>
				</label>

				<div className={styles.groupTitle}>🌤️ <T>Weather</T></div>

				<label className={`${styles.chartToggle} ${enabledCharts.weather ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.weather}
						onChange={() => onToggleChart('weather')}
					/>
					<span><T>Weather</T></span>
				</label>

				{enabledCharts.weather && (
					<>
						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.weatherTemperature ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.weatherTemperature}
								onChange={() => onToggleChart('weatherTemperature')}
							/>
							<span>🌡️ <T>Temperature</T></span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.wind ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.wind}
								onChange={() => onToggleChart('wind')}
							/>
							<span>💨 <T>Wind</T></span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.rain ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.rain}
								onChange={() => onToggleChart('rain')}
							/>
							<span>🌧️ <T>Rain</T></span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.solarRadiation ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.solarRadiation}
								onChange={() => onToggleChart('solarRadiation')}
							/>
							<span>☀️ <T>Solar Radiation</T></span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.cloudCover ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.cloudCover}
								onChange={() => onToggleChart('cloudCover')}
							/>
							<span>☁️ <T>Cloud Cover</T></span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.pollen ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.pollen}
								onChange={() => onToggleChart('pollen')}
							/>
							<span>🌸 <T>Pollen</T></span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.pollution ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.pollution}
								onChange={() => onToggleChart('pollution')}
							/>
							<span>🏭 <T>Air Quality</T></span>
						</label>
					</>
				)}
			</div>
		</div>
	)
}
