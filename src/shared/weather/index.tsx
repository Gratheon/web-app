import {gql, useQuery} from '../../api'
import Loading from '../loader'
import Forecast from './forecast'
import ErrorMsg from '../messageError'
import {isEstonia} from "@/page/apiaryEdit";
import {CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis} from "recharts";

const WEATHER_QUERY = gql`
	query weather($lat: String!, $lng: String!) {
		weather(lat: $lat, lng: $lng)
	}
`

const WEATHER_ESTONIA_QUERY = gql`
	query weather($lat: String!, $lng: String!) {
		weatherEstonia(lat: $lat, lng: $lng)
	}
`

export default function Weather({lat, lng}: { lat: any; lng: any }) {
    if (!lat) return
    if (!lng) return

    if (isEstonia(lat, lng)) {
        let {loading, error, data} = useQuery(WEATHER_ESTONIA_QUERY, {
            variables: {lat: `${lat}`, lng: `${lng}`},
        })

        if (loading) {
            return <Loading/>
        }

        if (!data?.weatherEstonia) {
            return <ErrorMsg error={'could not load weather'}/>
        }

        if (error) {
            return <ErrorMsg error={error}/>
        }

        let formattedTempData = []
        let formattedWindData = []

        data.weatherEstonia.days.map((day: any, i: number) => {
            formattedTempData.push({
                name: day,
                temperature: data.weatherEstonia.temp[i],
            })

            formattedWindData.push({
                name: day,
                wind: data.weatherEstonia.wind[i],
            })
        })
        // console.log(data.weatherEstonia)
        return (
            <div style={{padding: '10px 20px'}}>
                <div style={{display:'flex'}}>
                    <div>
                        <h1>Temperature</h1>
                        <LineChart
                            width={400}
                            height={200}
                            data={formattedTempData}
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
                            <Line
                                type="monotone"
                                dataKey="temperature"
                                stroke="#EEAAAA"
                                activeDot={{r: 2}}
                            />
                        </LineChart>
                    </div>

                    <div>
                        <h1>Wind speed</h1>
                        <LineChart
                            width={400}
                            height={200}
                            data={formattedWindData}
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
                            <Line
                                type="monotone"
                                dataKey="wind"
                                stroke="#EEAAAA"
                                activeDot={{r: 2}}
                            />
                        </LineChart>
                    </div>
                </div>
                <span>Weather data of {data.weatherEstonia.closestLocation} station provided by <a href={'https://www.keskkonnaagentuur.ee/'}>Keskkonnaagentuur</a></span>
            </div>
        )
    }

    let {loading, error, data} = useQuery(WEATHER_QUERY, {
        variables: {lat: `${lat}`, lng: `${lng}`},
    })

    if (loading) {
        return <Loading/>
    }

    if (!data?.weather) {
        return <ErrorMsg error={'could not load weather'}/>
    }

    if (error) {
        return <ErrorMsg error={error}/>
    }

    return (
        <div style={{padding: '0 10px'}}>
            <Forecast data={data}/>
        </div>
    )
}
