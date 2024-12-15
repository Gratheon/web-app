import {Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {gql, useQuery} from "@/api";
import Loader from "@/shared/loader";
import {formatTime} from "@/shared/dateFormat";
import T from "@/shared/translate";

const WEIGHT_QUERY = gql`
    query hiveWeight($hiveId: ID!) {
        weightKg(hiveId: $hiveId){
            time
            value
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
        variables: { hiveId },
    })

    if (loading) {
        return <Loader />
    }

    console.log({weightData})
    if(weightData.weightKg.length == 0) {
        return <p style="color:#bbb">Hive weight was not yet reported. See <a style="color:#aaa" href="https://gratheon.com/docs/API/">API docs</a> to learn how.</p>
    }

    let formattedWeightData = []
    formattedWeightData = weightData.weightKg.map((v)=>{
        return {
            value: Math.round(v.value*100)/100,
            time: formatTime(v.time)
        }
    })

    return (
        <div>
            <p style="text-align:center;">
                <T>Hive Weight</T>
            </p>

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
                    <XAxis dataKey="time" />
                    <YAxis unit="kg" />
                    <Tooltip/>
                    <Area
                        label
                        type="monotone"
                        dataKey="value"
                        stroke="black"
                        fill="green"/>
                    {/*<ReferenceLine y={50} label="" stroke="red" strokeDasharray="3 3" />*/}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}