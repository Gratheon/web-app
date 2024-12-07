//@ts-nocheck
import {format} from 'date-fns'

import {Area, AreaChart, LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine} from 'recharts'

import style from './index.module.less'

type Humidity = {
    name: string
    humidity: number
    rain: number
}

type HumidityProps = {
    data: any
}

function ChartHeading({title, value, info}) {
    return <>
        <div style={{fontSize: '20px', display: 'flex'}}>
            <span style={"flex-grow:1"}>{title}</span>
            <strong>{value}</strong>
        </div>

        <div style={"font-size:10px; color:gray;"}>{info}</div>
    </>
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
    const humidity: Humidity[] = []
    const rain: any[] = []

    if (!data?.weather?.hourly) {
        return null
    }

    data.weather.hourly.time.map((hour: any, i: number) => {
        formattedData.push({
            name: format(new Date(hour), 'hh:mm (dd.MM)'),
            temperature: data.weather.hourly.temperature_2m[i],
        })
        windData.push({
            name: format(new Date(hour), 'hh:mm (dd.MM)'),
            wind: data.weather.hourly.windspeed_10m[i],
        })
        humidity.push({
            name: format(new Date(hour), 'hh:mm (dd.MM)'),
            humidity: data.weather.hourly.relativehumidity_2m[i],
        })
        rain.push({
            name: format(new Date(hour), 'hh:mm (dd.MM)'),
            rain: data.weather.hourly.rain[i],
        })
    })

    const chartMargin = {
        top: 5,
        right: 0,
        left: 0,
        bottom: 5,
    }

    const averageTemperature = formattedData.reduce((acc, curr) => acc + curr.temperature, 0) / formattedData.length;
    let temperatureColor = 'blue'; // Default color

    if (averageTemperature >= 13 && averageTemperature <= 27) {
        temperatureColor = 'green';
    } else if (averageTemperature > 27) {
        temperatureColor = 'red';
    }
    
    const medianRainProbability = calculateMedian(data.weather.hourly.rain);

    return (
        <>
            <div style={{padding: '5px 20px'}}>Weather forecast for next week</div>
            <div className={style.forecast}>
                <div className={style.graph}>
                    <ChartHeading
                        title={'🌡️ Temperature'}
                        value={`${data.weather?.current_weather.temperature} °C`}
                        info={'Too high or low temperature is bad for bees'}/>

                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                            accessibilityLayer
                            data={formattedData}
                            margin={chartMargin}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis/>
                            <Tooltip/>

                            <Area
                                isAnimationActive={true}
                                type="monotone"
                                dataKey="temperature"
                                stroke="black"
                                fill={temperatureColor}/>

                            <ReferenceLine y={13} label="" stroke="blue" strokeDasharray="3 3" />
                            <ReferenceLine y={28} label="" stroke="red" strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>


                </div>

                <div className={style.graph}>
                    <ChartHeading
                        title={'💨 Wind speed'}
                        value={`${data.weather?.current_weather.windspeed} km/h`}
                        info={'High wind speed can collapse hives'}/>


                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                            accessibilityLayer
                            data={windData}
                            margin={chartMargin}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis/>
                            <Tooltip/>
                            <Area
                                type="monotone"
                                dataKey="wind"
                                stroke="black"
                                fill="green"/>
                            <ReferenceLine y={50} label="" stroke="red" strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className={style.graph}>
                    <ChartHeading
                        title={'🌧️ Rain probability'}
                        value={`${medianRainProbability} %`}
                        info={'No flying in the rain'}/>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={rain}
                            margin={chartMargin}
                        >
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis yAxisId="left"/>
                            <YAxis yAxisId="right" orientation="right"/>
                            <Tooltip/>
                            
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="humidity"
                                stroke="#8884d8"
                                activeDot={{r: 2}}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="rain"
                                stroke="#82ca9d"
                                activeDot={{r: 2}}
                            />
                        </LineChart>

                    </ResponsiveContainer>
                </div>
            </div>
        </>
    )
}
