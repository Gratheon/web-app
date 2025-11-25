import {gql, useQuery} from '@/api'
import Loading from '@/shared/loader'
import Forecast from './forecast'
import ErrorMsg from '@/shared/messageError'

const WEATHER_QUERY = gql`
	query weather($lat: String!, $lng: String!) {
		weather(lat: $lat, lng: $lng)
	}
`

type WeatherProps = {
    lat: any
    lng: any
    chartRefs?: React.MutableRefObject<any[]>
    syncCharts?: (sourceChart: any) => void
}

export default function Weather({lat, lng, chartRefs, syncCharts}: WeatherProps) {
    if (!lat) return
    if (!lng) return

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
        <Forecast data={data} chartRefs={chartRefs} syncCharts={syncCharts}/>
    )
}
