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
import {useLiveQuery} from "dexie-react-hooks";
import {getUser} from "@/models/user";

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
    let userStored = useLiveQuery(() =>  getUser(), [], null)

    let {
        loading,
        error: errorGet,
        data,
        errorNetwork,
    } = useQuery(WEIGHT_QUERY, {
        variables: {
            hiveId,
            timeRangeMin: 7 * 60 * 24
        },
    })

    if (loading || !userStored) {
        return <Loader/>
    }

    let weightDiv = null
    let temperatureDiv = null
    let kgLabel = t('kg', "Shortest label for the unit of weight in kilograms")

    if (data.weightKg.metrics.length == 0) {
        weightDiv = <p style="color:#bbb"><T>Hive weight was not reported this week.</T></p>
    }
    else {

        let formattedWeightData = []
        formattedWeightData = data.weightKg.metrics.map((row) => {
            return {
                v: Math.round(row.v * 100) / 100,
                t: formatTime(row.t, userStored.lang)
            }
        })
        let lastWeight = Math.round(100 * data.weightKg.metrics[data.weightKg.metrics.length - 1].v) / 100

        weightDiv = <div style="padding-bottom: 20px;">
                <ChartHeading
                    title={t('Hive Weight') + ' ⚖️️'}
                    value={`${lastWeight} ${kgLabel}`}
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
                        <YAxis unit={kgLabel}/>
                        <Tooltip content={<ValueOnlyBarTooltip unit={kgLabel}  />} />
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
    }


    if (data.temperatureCelsius.metrics.length == 0) {
        temperatureDiv = <p style="color:#bbb"><T>Hive temperature was not reported this week.</T></p>
    }
    else {

        let lastTemperature = Math.round(100 * data.temperatureCelsius.metrics[data.temperatureCelsius.metrics.length - 1].v) / 100
        let minTemperature = Math.min(...data.temperatureCelsius.metrics.map((row) => row.v))
        let maxTemperature = Math.max(...data.temperatureCelsius.metrics.map((row) => row.v))

        let temperatureColor = green

        if (lastTemperature < 13) {
            temperatureColor = blue
        } else if (lastTemperature > 38) {
            temperatureColor = red
        }

        let formattedTemperatureData = []
        formattedTemperatureData = data.temperatureCelsius.metrics.map((row) => {
            console.log({userStored})
            return {
                v: Math.round(row.v * 100) / 100,
                t: formatTime(row.t, userStored.lang)
            }
        })

        temperatureDiv = <div style="padding-bottom: 20px;">
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
                <Tooltip content={<ValueOnlyBarTooltip unit={`°C`} />} />
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
    }


    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
        <>
            {weightDiv}

            {temperatureDiv}
        </>
    )
}

const ValueOnlyBarTooltip = (params) => {
    let { active, payload, unit } = params;
    if (active && payload && payload.length) {
        return (
            <div style="background:white;border-radius:5px;padding:0 10px;">
                {payload[0].value} {unit}
            </div>
        );
    }

    return null;
};