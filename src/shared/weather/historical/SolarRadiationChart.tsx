import { LineSeries } from 'lightweight-charts-react-components'
import ChartContainer from '@/shared/charts/ChartContainer'
import { useTranslation as t } from '@/shared/translate'

type SolarRadiationChartProps = {
	solarData: {
		diffuse_radiation: Array<{ time: string; value: number | null }>
		direct_radiation: Array<{ time: string; value: number | null }>
	}
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function SolarRadiationChart({ solarData, chartRefs, syncCharts }: SolarRadiationChartProps) {
	const diffuseData = solarData.diffuse_radiation
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const directData = solarData.direct_radiation
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const avgDirect = directData.length > 0
		? directData.reduce((acc, curr) => acc + curr.value, 0) / directData.length
		: 0

	return (
		<ChartContainer
			emoji="☀️"
			title={t('Solar Radiation')}
			value={`${avgDirect.toFixed(0)} W/m² ${t('avg direct')}`}
			info={t('Solar radiation affects hive temperature and bee activity. High radiation can lead to overheating.')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<LineSeries
				data={directData}
				options={{
					color: '#FFA726',
					lineWidth: 2,
					title: t('Direct Radiation')
				}}
			/>
			<LineSeries
				data={diffuseData}
				options={{
					color: '#FFD54F',
					lineWidth: 2,
					title: t('Diffuse Radiation')
				}}
			/>
		</ChartContainer>
	)
}

