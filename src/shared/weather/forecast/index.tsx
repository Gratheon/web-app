import TemperatureChart from './TemperatureChart'
import WindChart from './WindChart'
import RainHumidityChart, { calculateMedian } from './RainHumidityChart'

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
        <>
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
        </>
    )
}
