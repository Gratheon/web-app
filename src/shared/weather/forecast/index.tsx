//@ts-nocheck
import { Chart, AreaSeries, LineSeries, PriceLine } from 'lightweight-charts-react-components'

import ChartHeading from '@/shared/chartHeading'
import { useTranslation as t } from '@/shared/translate'

import style from './index.module.less'

type Humidity = {
    name: string
    humidity: number
    rain: number
}

type HumidityProps = {
    data: any
}

function calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sortedValues = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);

    return sortedValues.length % 2 !== 0
        ? sortedValues[mid]
        : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

export default function Forecast({data}: HumidityProps) {
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

    const averageTemperature = formattedData.reduce((acc, curr) => acc + curr.value, 0) / formattedData.length;
    let temperatureTopColor = '#0000FF';
    let temperatureBottomColor = 'rgba(0, 0, 255, 0.25)';

    if (averageTemperature >= 13 && averageTemperature <= 27) {
        temperatureTopColor = '#00FF00';
        temperatureBottomColor = 'rgba(0, 255, 0, 0.25)';
    } else if (averageTemperature > 27) {
        temperatureTopColor = '#FF0000';
        temperatureBottomColor = 'rgba(255, 0, 0, 0.25)';
    }
    
    const medianRainProbability = calculateMedian(data.weather.hourly.rain);

    const rainChartData = rain.map(item => ({
        time: item.time,
        value: item.rain
    }))

    const humidityChartData = rain.map(item => ({
        time: item.time,
        value: item.humidity
    }))

    const chartOptions = {
        layout: {
            attributionLogo: false,
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
    }

    return (
        <>
            <div className={style.forecast}>
                <div className={style.graph}>
                    <ChartHeading
                        title={t('Temperature') + ' 🌡️'}
                        value={`${data.weather?.current_weather.temperature} °C`}
                        info={t('Too high or low temperature is bad for bees')}/>

                    <Chart options={chartOptions} containerProps={{ style: { width: '100%', height: '300px' } }}>
                        <AreaSeries
                            data={formattedData}
                            options={{
                                topColor: temperatureTopColor,
                                bottomColor: temperatureBottomColor,
                                lineColor: 'black',
                                lineWidth: 2,
                            }}
                        >
                            <PriceLine options={{ price: 13, color: 'blue', lineStyle: 2, lineWidth: 1 }} />
                            <PriceLine options={{ price: 28, color: 'red', lineStyle: 2, lineWidth: 1 }} />
                        </AreaSeries>
                    </Chart>
                </div>

                <div className={style.graph}>
                    <ChartHeading
                        title={t('Wind speed') + ' 💨'}
                        value={`${data.weather?.current_weather.windspeed} km/h`}
                        info={t('High wind speed can collapse hives')}/>

                    <Chart options={chartOptions} containerProps={{ style: { width: '100%', height: '300px' } }}>
                        <AreaSeries
                            data={windData}
                            options={{
                                topColor: 'green',
                                bottomColor: 'rgba(0,128,0,0.4)',
                                lineColor: 'black',
                                lineWidth: 2,
                            }}
                        >
                            <PriceLine options={{ price: 50, color: 'red', lineStyle: 2, lineWidth: 1 }} />
                        </AreaSeries>
                    </Chart>
                </div>

                <div className={style.graph}>
                    <ChartHeading
                        title={t('Rain probability') + ' 🌧️'}
                        value={`${medianRainProbability} %`}
                        info={t('Bees are not flying in the rain')}/>

                    <Chart options={chartOptions} containerProps={{ style: { width: '100%', height: '300px' } }}>
                        <LineSeries
                            data={humidityChartData}
                            options={{
                                color: '#8884d8',
                                lineWidth: 2,
                            }}
                        />
                        <LineSeries
                            data={rainChartData}
                            options={{
                                color: '#82ca9d',
                                lineWidth: 2,
                                priceScaleId: 'right',
                            }}
                        />
                    </Chart>
                </div>
            </div>
        </>
    );
}
