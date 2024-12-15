import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ReferenceArea,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import {gql, useQuery} from "@/api";

import ChartHeading from '@/shared/chartHeading'
import Loader from "@/shared/loader";
import {formatTime} from "@/shared/dateFormat";
import T, {useTranslation as t} from "@/shared/translate";

const WEIGHT_QUERY = gql`
    query hiveWeight($hiveId: ID!, $timeRangeMin: Int) {
        weightKg(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
            ... on MetricFloatList{
                metrics{ t v }
            }

            ... on TelemetryError{
                message
                code
            }
        }
        temperatureCelsius(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
            ... on MetricFloatList{
                metrics{ t v }
            }

            ... on TelemetryError{
                message
                code
            }
        }
    }
`


const red = 'rgba(255,211,174,0.42)'
const green = 'rgba(126,207,36,0.83)'
const blue = '#8fddff'

export default function HiveWeightGraph({hiveId}) {
    let {
        loading,
        error: errorGet,
        data: weightData,
        errorNetwork,
    } = useQuery(WEIGHT_QUERY, {
        variables: {
            hiveId,
            timeRangeMin: 7 * 60 * 24
        },
    })

    if (loading) {
        return <Loader/>
    }

    if (weightData.weightKg.metrics.length == 0) {
        return <p style="color:#bbb"><T>Hive weight was not reported this week.</T>
            <a style="color:#aaa" href="https://gratheon.com/docs/API/"><T>Start reporting</T></a></p>
    }

    let formattedWeightData = []
    formattedWeightData = weightData.weightKg.metrics.map((row) => {
        return {
            v: Math.round(row.v * 100) / 100,
            t: formatTime(row.t)
        }
    })
    let lastWeight = Math.round(100 * weightData.weightKg.metrics[weightData.weightKg.metrics.length - 1].v) / 100




    let lastTemperature = Math.round(100 * weightData.temperatureCelsius.metrics[weightData.temperatureCelsius.metrics.length - 1].v) / 100
    let minTemperature = Math.min(...weightData.temperatureCelsius.metrics.map((row) => row.v))
    let maxTemperature = Math.max(...weightData.temperatureCelsius.metrics.map((row) => row.v))

    let temperatureColor = green

    if (lastTemperature < 13) {
        temperatureColor = blue
    } else if (lastTemperature > 38) {
        temperatureColor = red
    }

    let formattedTemperatureData = []
    formattedTemperatureData = weightData.temperatureCelsius.metrics.map((row) => {
        return {
            v: Math.round(row.v * 100) / 100,
            t: formatTime(row.t)
        }
    })

    return (
        <>
            <div style="padding-bottom: 20px;">
                <ChartHeading
                    title={t('Hive Weight') + ' ⚖️️'}
                    value={`${lastWeight} kg`}
                    info={t('Drop in hive weight may correlate with swarming or starvation')}/>

                <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                        accessibilityLayer
                        data={formattedWeightData}
                        margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="1 1"/>
                        <XAxis dataKey="t"/>
                        <YAxis unit="kg"/>
                        <Tooltip/>
                        <Bar
                            type="monotone"
                            dataKey="v"
                            stroke="black"
                            fill={green}>
                            {
                                formattedWeightData.map((entry, index) => {
                                    const previousValue = index > 0 ? formattedWeightData[index - 1].v : entry.v;
                                    const fillColor = entry.v < previousValue ? red : green;
                                    return <Cell key={`cell-${index}`} fill={fillColor}/>;
                                })
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style="padding-bottom: 20px;">
                <ChartHeading
                    title={t('Hive internal temperature') + ' 🌡️'}
                    value={`${lastTemperature} °C`}
                    info={t('High or low temperature makes bees inefficient')}/>


                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                        accessibilityLayer
                        data={formattedTemperatureData}
                        margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="1 1"/>
                        <XAxis dataKey="t"/>
                        <YAxis unit="℃"/>
                        <Tooltip/>
                        <Area
                            type="monotone"
                            dataKey="v"
                            stroke="black"
                            fill={temperatureColor}/>

                        <ReferenceArea x1={0} y1={38} y2={maxTemperature+22} fill="red" fillOpacity={0.1}/>
                        <ReferenceArea x1={0} y1={minTemperature-3} y2={13} fill="blue" fillOpacity={0.1}/>
                        {/*<ReferenceLine y={50} label="" stroke="red" strokeDasharray="3 3" />*/}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </>
    )
}