import { useMemo } from 'react'

import imageURL from '@/assets/thinker.webp'
import MultiHiveEntranceChart from '@/shared/charts/MultiHiveEntranceChart'
import MultiHiveEntranceDetectedChart from '@/shared/charts/MultiHiveEntranceDetectedChart'
import MultiHiveEntranceInteractionsChart from '@/shared/charts/MultiHiveEntranceInteractionsChart'
import MultiHiveEntranceSpeedChart from '@/shared/charts/MultiHiveEntranceSpeedChart'
import MultiHiveEntranceStationaryChart from '@/shared/charts/MultiHiveEntranceStationaryChart'
import MultiHiveTemperatureChart from '@/shared/charts/MultiHiveTemperatureChart'
import MultiHiveWeightChart from '@/shared/charts/MultiHiveWeightChart'
import PopulationChart from '@/shared/charts/PopulationChart'
import { useChartSync } from '@/shared/charts/useChartSync'
import InfoIcon from '@/shared/infoIcon'
import T, { useTranslation as t } from '@/shared/translate'
import type { EnabledCharts } from '../constants'
import styles from '../styles.module.less'
import WeatherSection from './WeatherSection'

type TimeChartsPanelProps = {
	enabledCharts: EnabledCharts
	inspectionsByHive: Record<string, any[]>
	weightDataByHive: Record<string, any>
	temperatureDataByHive: Record<string, any>
	entranceDataByHive: Record<string, any>
	showIdealCurve: boolean
	selectedApiaryId: string | null
	apiaries: Array<{ id: string; name?: string; lat: string; lng: string }>
	timeRangeDays: number
	timeFrom: string
	timeTo: string
}

export default function TimeChartsPanel({
	enabledCharts,
	inspectionsByHive,
	weightDataByHive,
	temperatureDataByHive,
	entranceDataByHive,
	showIdealCurve,
	selectedApiaryId,
	apiaries,
	timeRangeDays,
	timeFrom,
	timeTo,
}: TimeChartsPanelProps) {
	const { chartRefs, syncCharts } = useChartSync()

	const chartDataAvailability = useMemo(() => {
		const hasPopulationData = Object.values(inspectionsByHive).some((entries: any[]) =>
			entries.some(entry => entry.population && entry.population > 0)
		)

		const hasWeightData = Object.values(weightDataByHive).some((hiveData: any) =>
			!hiveData?.data?.code && Array.isArray(hiveData?.data?.metrics) && hiveData.data.metrics.length > 0
		)

		const hasTemperatureData = Object.values(temperatureDataByHive).some((hiveData: any) =>
			!hiveData?.data?.code && Array.isArray(hiveData?.data?.metrics) && hiveData.data.metrics.length > 0
		)

		const hasEntranceData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.beesIn ?? 0) > 0)
		)

		const hasEntranceSpeedData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.avgSpeed ?? 0) > 0 || (m.p95Speed ?? 0) > 0)
		)

		const hasEntranceDetectedData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.detectedBees ?? 0) > 0)
		)

		const hasEntranceStationaryData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.stationaryBees ?? 0) > 0)
		)

		const hasEntranceInteractionsData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.beeInteractions ?? 0) > 0)
		)

		return {
			population: hasPopulationData,
			weight: hasWeightData,
			temperature: hasTemperatureData,
			entrance: hasEntranceData,
			entranceSpeed: hasEntranceSpeedData,
			entranceDetected: hasEntranceDetectedData,
			entranceStationary: hasEntranceStationaryData,
			entranceInteractions: hasEntranceInteractionsData,
		}
	}, [inspectionsByHive, weightDataByHive, temperatureDataByHive, entranceDataByHive])

	const missingSelectedCharts = useMemo(() => {
		const chartDefinitions = [
			{ key: 'population', label: t('Colony Population') },
			{ key: 'weight', label: t('Hive Weight Comparison') },
			{ key: 'temperature', label: t('Hive Temperature Comparison') },
			{ key: 'entrance', label: t('Hive Entrance Activity Comparison') },
			{ key: 'entranceSpeed', label: t('Bee Speed Comparison') },
			{ key: 'entranceDetected', label: t('Detected Bees Comparison') },
			{ key: 'entranceStationary', label: t('Stationary Bees Comparison') },
			{ key: 'entranceInteractions', label: t('Bee Interactions Comparison') },
		]

		return chartDefinitions
			.filter(chart => enabledCharts[chart.key] && !chartDataAvailability[chart.key])
			.map(chart => chart.label)
	}, [enabledCharts, chartDataAvailability])

	return (
		<main className={styles.chartsContainer}>
			{missingSelectedCharts.length > 0 && (
				<div className={styles.groupedNoDataPlaceholder}>
					<img src={imageURL} alt="Thinker placeholder" draggable={false} />
					<p className={styles.groupedNoDataTitle}>
						<strong><T>No data available for selected charts.</T></strong>
						<InfoIcon>
							<p style={{ margin: '0 0 8px 0' }}>
								<strong><T>How to get data here:</T></strong>
							</p>
							<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
								<li><T>For population charts: add inspections and fill in bee count</T></li>
								<li><T>For telemetry charts: connect sensors/cameras and send metrics via API</T></li>
								<li><T>Documentation:</T> <a href="https://gratheon.com/docs/API/REST" target="_blank" rel="noopener noreferrer">gratheon.com/docs/API/REST</a></li>
							</ol>
						</InfoIcon>
					</p>
					<p className={styles.groupedNoDataSubtitle}><T>Currently missing data for:</T></p>
					<ul className={styles.groupedNoDataList}>
						{missingSelectedCharts.map(chartName => (
							<li key={chartName}>{chartName}</li>
						))}
					</ul>
				</div>
			)}

			{enabledCharts.population && chartDataAvailability.population && (
				<div data-chart-type="population">
					<PopulationChart
						inspectionsByHive={inspectionsByHive}
						showIdealCurve={showIdealCurve}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
						timeFrom={new Date(timeFrom)}
						timeTo={new Date(timeTo)}
					/>
				</div>
			)}

			{enabledCharts.weight && chartDataAvailability.weight && (
				<div data-chart-type="weight">
					<MultiHiveWeightChart
						weightDataByHive={weightDataByHive}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
						selectedApiaryId={selectedApiaryId}
					/>
				</div>
			)}

			{enabledCharts.temperature && chartDataAvailability.temperature && (
				<div data-chart-type="temperature">
					<MultiHiveTemperatureChart
						temperatureDataByHive={temperatureDataByHive}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
						selectedApiaryId={selectedApiaryId}
					/>
				</div>
			)}

			{enabledCharts.entrance && chartDataAvailability.entrance && (
				<div data-chart-type="entrance">
					<MultiHiveEntranceChart
						entranceDataByHive={entranceDataByHive}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
					/>
				</div>
			)}

			{enabledCharts.entranceSpeed && chartDataAvailability.entranceSpeed && (
				<div data-chart-type="entranceSpeed">
					<MultiHiveEntranceSpeedChart
						entranceDataByHive={entranceDataByHive}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
					/>
				</div>
			)}

			{enabledCharts.entranceDetected && chartDataAvailability.entranceDetected && (
				<div data-chart-type="entranceDetected">
					<MultiHiveEntranceDetectedChart
						entranceDataByHive={entranceDataByHive}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
					/>
				</div>
			)}

			{enabledCharts.entranceStationary && chartDataAvailability.entranceStationary && (
				<div data-chart-type="entranceStationary">
					<MultiHiveEntranceStationaryChart
						entranceDataByHive={entranceDataByHive}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
					/>
				</div>
			)}

			{enabledCharts.entranceInteractions && chartDataAvailability.entranceInteractions && (
				<div data-chart-type="entranceInteractions">
					<MultiHiveEntranceInteractionsChart
						entranceDataByHive={entranceDataByHive}
						chartRefs={chartRefs}
						syncCharts={syncCharts}
					/>
				</div>
			)}

			{enabledCharts.weather && (
				<WeatherSection
					apiaries={apiaries}
					days={timeRangeDays}
					enabledCharts={{
						temperature: enabledCharts.weatherTemperature,
						wind: enabledCharts.wind,
						rain: enabledCharts.rain,
						solarRadiation: enabledCharts.solarRadiation,
						cloudCover: enabledCharts.cloudCover,
						pollen: enabledCharts.pollen,
						pollution: enabledCharts.pollution,
					}}
				/>
			)}
		</main>
	)
}
