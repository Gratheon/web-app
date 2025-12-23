import { LineSeries } from 'lightweight-charts-react-components'
import ChartContainer from '@/shared/charts/ChartContainer'
import { useTranslation as t } from '@/shared/translate'

type CloudCoverChartProps = {
	cloudData: {
		cloud_cover_low: Array<{ time: string; value: number | null }>
		cloud_cover_mid: Array<{ time: string; value: number | null }>
		cloud_cover_high: Array<{ time: string; value: number | null }>
	}
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function CloudCoverChart({ cloudData, chartRefs, syncCharts }: CloudCoverChartProps) {
	const lowData = cloudData.cloud_cover_low
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const midData = cloudData.cloud_cover_mid
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const highData = cloudData.cloud_cover_high
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const avgTotal = lowData.length > 0
		? lowData.map((d, i) => (d.value + (midData[i]?.value || 0) + (highData[i]?.value || 0)) / 3).reduce((a, b) => a + b, 0) / lowData.length
		: 0

	return (
		<ChartContainer
			emoji="☁️"
			title={t('Cloud Cover')}
			value={`${avgTotal.toFixed(0)}% ${t('avg')}`}
			info={t('Cloud cover affects temperature and light levels, influencing bee foraging behavior.')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<LineSeries
				data={lowData}
				options={{
					color: '#90CAF9',
					lineWidth: 2,
					title: t('Low Cloud Cover')
				}}
			/>
			<LineSeries
				data={midData}
				options={{
					color: '#64B5F6',
					lineWidth: 2,
					title: t('Mid Cloud Cover')
				}}
			/>
			<LineSeries
				data={highData}
				options={{
					color: '#2196F3',
					lineWidth: 2,
					title: t('High Cloud Cover')
				}}
			/>
		</ChartContainer>
	)
}

