import HistoricalWeather from '@/shared/weather/historical'
import style from './WeatherSection.module.less'

type WeatherSectionProps = {
	apiaries: Array<{
		id: string
		name?: string
		lat: string
		lng: string
	}>
	days: number
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
	enabledCharts: {
		wind: boolean
		rain: boolean
		solarRadiation: boolean
		cloudCover: boolean
		pollen: boolean
		pollution: boolean
	}
}

export default function WeatherSection({ apiaries, days, chartRefs, syncCharts, enabledCharts }: WeatherSectionProps) {
	if (apiaries.length === 0) return null

	return (
		<div className={style.weatherSection}>
			{apiaries.map(apiary => (
				<div key={apiary.id} className={style.weatherCard}>
					<h3>{apiary.name || `Apiary ${apiary.id}`} Historical Weather</h3>
					<HistoricalWeather
						lat={apiary.lat}
						lng={apiary.lng}
						days={days}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
						enabledCharts={enabledCharts}
					/>
				</div>
			))}
		</div>
	)
}

