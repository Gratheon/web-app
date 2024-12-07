import {gql, useQuery} from '../../api'
import Loading from '../loader'
import Forecast from './forecast'
import ErrorMsg from '../messageError'

const WEATHER_QUERY = gql`
	query weather($lat: String!, $lng: String!) {
		weather(lat: $lat, lng: $lng)
	}
`

export default function Weather({lat, lng}: { lat: any; lng: any }) {
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
        <Forecast data={data}/>
    )
}
