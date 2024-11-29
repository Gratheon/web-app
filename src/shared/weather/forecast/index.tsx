//@ts-nocheck
import {format} from 'date-fns'

import {CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis,} from 'recharts'

import style from './index.module.less'

type Humidity = {
    name: string
    humidity: number
    rain: number
}

type HumidityProps = {
    data: any
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

    return (
        <>
            <div className={style.forecast}>
                <div style={"font-size:12px"}>
                    <strong style={"font-size:20px"}>{data.weather?.current_weather.temperature} °C</strong><br/>
                    🌡️Temperature


                    <LineChart
                        width={600}
                        height={200}
                        data={formattedData}
                        margin={{
                            top: 5,
                            right: 10,
                            left: 10,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip/>
                        {/*<Legend/>*/}
                        <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#EEAAAA"
                            activeDot={{r: 2}}
                        />
                    </LineChart>


                </div>

                <div style={"font-size:12px"}>
                    <strong style={"font-size:20px"}>{data.weather?.current_weather.windspeed} km/h</strong><br/>
                    💨Wind speed


                    <LineChart
                        width={600}
                        height={200}
                        data={windData}
                        margin={{
                            top: 5,
                            right: 10,
                            left: 10,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip/>
                        {/*<Legend/>*/}

                        <Line type="monotone" dataKey="wind" stroke="#82ca9d"/>
                    </LineChart>
                </div>
            </div>

            <div className={style.forecast}>
                <LineChart
                    width={600}
                    height={200}
                    data={humidity}
                    margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis yAxisId="left"/>
                    <YAxis yAxisId="right" orientation="right"/>
                    <Tooltip/>
                    {/*<Legend/>*/}
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

                <LineChart
                    width={600}
                    height={200}
                    data={rain}
                    margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis yAxisId="left"/>
                    <YAxis yAxisId="right" orientation="right"/>
                    <Tooltip/>
                    {/*<Legend/>*/}
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
            </div>
        </>
    )
}
