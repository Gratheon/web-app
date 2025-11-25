import styles from './ChartToggles.module.less'

interface ChartTogglesProps {
	enabledCharts: {
		population: boolean
		weight: boolean
		temperature: boolean
		entrance: boolean
		weather: boolean
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
			<h3 className={styles.title}>Charts</h3>
			<div className={styles.chartList}>
				<label className={`${styles.chartToggle} ${enabledCharts.population ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.population}
						onChange={() => onToggleChart('population')}
					/>
					<span>🐝 Population</span>
				</label>

				{enabledCharts.population && (
					<label className={`${styles.chartToggle} ${styles.subOption} ${showIdealCurve ? styles.enabled : ''}`}>
						<input
							type="checkbox"
							checked={showIdealCurve}
							onChange={e => onToggleIdealCurve((e.target as HTMLInputElement).checked)}
						/>
						<span>Ideal Curve</span>
					</label>
				)}

				<label className={`${styles.chartToggle} ${enabledCharts.weight ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.weight}
						onChange={() => onToggleChart('weight')}
					/>
					<span>⚖️ Weight</span>
				</label>

				<label className={`${styles.chartToggle} ${enabledCharts.temperature ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.temperature}
						onChange={() => onToggleChart('temperature')}
					/>
					<span>🌡️ Temperature</span>
				</label>

				<label className={`${styles.chartToggle} ${enabledCharts.entrance ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.entrance}
						onChange={() => onToggleChart('entrance')}
					/>
					<span>🚪 Entrance Activity</span>
				</label>

				<label className={`${styles.chartToggle} ${enabledCharts.weather ? styles.enabled : ''}`}>
					<input
						type="checkbox"
						checked={enabledCharts.weather}
						onChange={() => onToggleChart('weather')}
					/>
					<span>🌤️ Weather</span>
				</label>

				{enabledCharts.weather && (
					<>
						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.wind ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.wind}
								onChange={() => onToggleChart('wind')}
							/>
							<span>💨 Wind</span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.rain ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.rain}
								onChange={() => onToggleChart('rain')}
							/>
							<span>🌧️ Rain</span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.solarRadiation ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.solarRadiation}
								onChange={() => onToggleChart('solarRadiation')}
							/>
							<span>☀️ Solar Radiation</span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.cloudCover ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.cloudCover}
								onChange={() => onToggleChart('cloudCover')}
							/>
							<span>☁️ Cloud Cover</span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.pollen ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.pollen}
								onChange={() => onToggleChart('pollen')}
							/>
							<span>🌸 Pollen</span>
						</label>

						<label className={`${styles.chartToggle} ${styles.subOption} ${enabledCharts.pollution ? styles.enabled : ''}`}>
							<input
								type="checkbox"
								checked={enabledCharts.pollution}
								onChange={() => onToggleChart('pollution')}
							/>
							<span>🏭 Air Quality</span>
						</label>
					</>
				)}
			</div>
		</div>
	)
}
