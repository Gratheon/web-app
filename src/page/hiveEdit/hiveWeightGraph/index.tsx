import {Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {gql, useQuery} from "@/api";
import Loader from "@/shared/loader";
import {formatTime} from "@/shared/dateFormat";
import T from "@/shared/translate";

const WEIGHT_QUERY = gql`
    query hiveWeight($hiveId: ID!, $timeRangeMin: Int) {
        weightKg(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
            t
            v
        }
        temperatureCelsius(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
            t
            v
        }
    }
`


export default function HiveWeightGraph({hiveId}) {
    let {
        loading,
        error: errorGet,
        data: weightData,
        errorNetwork,
    } = useQuery(WEIGHT_QUERY, {
        variables: {
            hiveId,
            timeRangeMin: 7*60*24
        },
    })

    if (loading) {
        return <Loader />
    }

    console.log({weightData})
    if(weightData.weightKg.length == 0) {
        return <p style="color:#bbb"><T>Hive weight was not reported this week.</T>
            <a style="color:#aaa" href="https://gratheon.com/docs/API/"><T>Start reporting</T></a></p>
    }

    let formattedWeightData = []
    formattedWeightData = weightData.weightKg.map((row)=>{
        return {
            v: Math.round(row.v*100)/100,
            t: formatTime(row.t)
        }
    })

    return (
        <div>
            <h3>
                ⚖️ <T>Hive Weight</T>
            </h3>

            <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                    accessibilityLayer
                    data={formattedWeightData}
                    margin={{
                        top: 5,
                        right: 20,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="t" />
                    <YAxis unit="kg" />
                    <Tooltip/>
                    <Area
                        label
                        type="monotone"
                        dataKey="v"
                        stroke="black"
                        fill="green"/>
                    {/*<ReferenceLine y={50} label="" stroke="red" strokeDasharray="3 3" />*/}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}