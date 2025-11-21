import styles from './ChartToggles.module.less'

interface ChartTogglesProps {
	enabledCharts: {
		population: boolean
		weight: boolean
		temperature: boolean
		entrance: boolean
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
			</div>
		</div>
	)
}
