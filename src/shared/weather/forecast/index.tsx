import TemperatureChart from './TemperatureChart'
import WindChart from './WindChart'
import RainHumidityChart, { calculateMedian } from './RainHumidityChart'
import styles from './index.module.less'
import T from '@/shared/translate'

type ForecastProps = {
    data: any
    chartRefs?: React.MutableRefObject<any[]>
    syncCharts?: (sourceChart: any) => void
}

export default function Forecast({ data, chartRefs, syncCharts }: ForecastProps) {
    const formattedData: any[] = []
    const windData: any[] = []
    const rain: any[] = []

    if (!data?.weather?.hourly) {
        return null
    }

    const currentRain = data.weather?.current?.precipitation ?? data.weather?.hourly?.rain?.[0] ?? null
    const currentPressure =
        data.weather?.current?.surface_pressure
        ?? data.weather?.current?.pressure_msl
        ?? data.weather?.hourly?.surface_pressure?.[0]
        ?? data.weather?.hourly?.pressure_msl?.[0]
        ?? null
    const elevation = data.weather?.elevation ?? null

    data.weather.hourly.time.map((hour: any, i: number) => {
        const timeStr = new Date(hour).getTime() / 1000
        formattedData.push({
            time: timeStr,
            value: data.weather.hourly.temperature_2m[i],
        })
        windData.push({
            time: timeStr,
            value: data.weather.hourly.windspeed_10m[i],
        })
        rain.push({
            time: timeStr,
            humidity: data.weather.hourly.relativehumidity_2m[i],
            rain: data.weather.hourly.rain[i],
        })
    })

    const medianRainProbability = calculateMedian(data.weather.hourly.rain)

    const rainChartData = rain.map(item => ({
        time: item.time,
        value: item.rain
    }))

    const humidityChartData = rain.map(item => ({
        time: item.time,
        value: item.humidity
    }))

    return (
        <div className={styles.forecastContainer}>
            <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}><T>Rain now</T></span>
                    <span className={styles.metaValue}>{currentRain === null ? '--' : `${Math.round(currentRain * 10) / 10} mm`}</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}><T>Pressure</T></span>
                    <span className={styles.metaValue}>{currentPressure === null ? '--' : `${Math.round(currentPressure * 10) / 10} hPa`}</span>
                </div>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}><T>Elevation</T></span>
                    <span className={styles.metaValue}>{elevation === null ? '--' : `${Math.round(elevation * 10) / 10} m`}</span>
                </div>
            </div>

            <TemperatureChart
                data={formattedData}
                currentTemperature={data.weather?.current_weather.temperature}
                chartRefs={chartRefs}
                syncCharts={syncCharts}
            />

            <WindChart
                data={windData}
                currentWindSpeed={data.weather?.current_weather.windspeed}
                chartRefs={chartRefs}
                syncCharts={syncCharts}
            />

            <RainHumidityChart
                humidityData={humidityChartData}
                rainData={rainChartData}
                medianRain={medianRainProbability}
                chartRefs={chartRefs}
                syncCharts={syncCharts}
            />
        </div>
    )
}
