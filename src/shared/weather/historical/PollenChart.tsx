import { LineSeries } from 'lightweight-charts-react-components'
import ChartContainer from '@/shared/charts/ChartContainer'

type PollenChartProps = {
	pollenData: {
		ragweed_pollen: Array<{ time: string; value: number | null }>
		alder_pollen: Array<{ time: string; value: number | null }>
		birch_pollen: Array<{ time: string; value: number | null }>
		grass_pollen: Array<{ time: string; value: number | null }>
		mugwort_pollen: Array<{ time: string; value: number | null }>
		olive_pollen: Array<{ time: string; value: number | null }>
	}
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function PollenChart({ pollenData, chartRefs, syncCharts }: PollenChartProps) {
	const transformData = (data: Array<{ time: string; value: number | null }>) =>
		data
			.filter(d => d.value !== null && d.value > 0)
			.map(d => ({
				time: new Date(d.time).getTime() / 1000 as any,
				value: d.value
			}))

	const birchData = transformData(pollenData.birch_pollen)
	const grassData = transformData(pollenData.grass_pollen)
	const ragweedData = transformData(pollenData.ragweed_pollen)
	const alderData = transformData(pollenData.alder_pollen)
	const mugwortData = transformData(pollenData.mugwort_pollen)
	const oliveData = transformData(pollenData.olive_pollen)

	const hasData = [birchData, grassData, ragweedData, alderData, mugwortData, oliveData].some(d => d.length > 0)

	if (!hasData) {
		return null
	}

	const maxPollen = Math.max(
		...birchData.map(d => d.value),
		...grassData.map(d => d.value),
		...ragweedData.map(d => d.value),
		...alderData.map(d => d.value),
		...mugwortData.map(d => d.value),
		...oliveData.map(d => d.value)
	)

	return (
		<ChartContainer
			emoji="🌸"
			title="Pollen Levels"
			value={`${maxPollen.toFixed(0)} max grains/m³`}
			info="Pollen availability is crucial for bee nutrition. Different plants bloom at different times."
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			{birchData.length > 0 && (
				<LineSeries
					data={birchData}
					options={{
						color: '#8BC34A',
						lineWidth: 2,
						title: 'Birch'
					}}
				/>
			)}
			{grassData.length > 0 && (
				<LineSeries
					data={grassData}
					options={{
						color: '#4CAF50',
						lineWidth: 2,
						title: 'Grass'
					}}
				/>
			)}
			{ragweedData.length > 0 && (
				<LineSeries
					data={ragweedData}
					options={{
						color: '#FFC107',
						lineWidth: 2,
						title: 'Ragweed'
					}}
				/>
			)}
			{alderData.length > 0 && (
				<LineSeries
					data={alderData}
					options={{
						color: '#795548',
						lineWidth: 2,
						title: 'Alder'
					}}
				/>
			)}
			{mugwortData.length > 0 && (
				<LineSeries
					data={mugwortData}
					options={{
						color: '#9C27B0',
						lineWidth: 2,
						title: 'Mugwort'
					}}
				/>
			)}
			{oliveData.length > 0 && (
				<LineSeries
					data={oliveData}
					options={{
						color: '#607D8B',
						lineWidth: 2,
						title: 'Olive'
					}}
				/>
			)}
		</ChartContainer>
	)
}

