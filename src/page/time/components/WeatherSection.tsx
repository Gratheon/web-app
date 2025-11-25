import Weather from '@/shared/weather'
import style from './WeatherSection.module.less'

type WeatherSectionProps = {
	apiaries: Array<{
		id: string
		name?: string
		lat: string
		lng: string
	}>
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function WeatherSection({ apiaries, chartRefs, syncCharts }: WeatherSectionProps) {
	if (apiaries.length === 0) return null

	return (
		<div className={style.weatherSection}>
			{apiaries.map(apiary => (
				<div key={apiary.id} className={style.weatherCard}>
					<h3>{apiary.name || `Apiary ${apiary.id}`} Weather Forecast</h3>
					<Weather lat={apiary.lat} lng={apiary.lng} chartRefs={chartRefs} syncCharts={syncCharts} />
				</div>
			))}
		</div>
	)
}

