import { useMemo } from 'react'

import { gql, useQuery } from '@/api'

import Loader from '@/shared/loader'
import { useLiveQuery } from 'dexie-react-hooks'
import { getUser } from '@/models/user'
import ErrorMsg from '@/shared/messageError'
import WeightChart from './WeightChart'
import TemperatureChart from './TemperatureChart'
import EntranceMovementChart from './EntranceMovementChart'
import { useChartSync } from '@/shared/charts/useChartSync'

const WEIGHT_QUERY = gql`
	query hiveWeight($hiveId: ID!, $timeRangeMin: Int, $timeFrom: DateTime!, $timeTo: DateTime!) {
		weightKg(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
			... on MetricFloatList {
				metrics {
					t
					v
				}
			}

			... on TelemetryError {
				message
				code
			}
		}
		temperatureCelsius(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
			... on MetricFloatList {
				metrics {
					t
					v
				}
			}

			... on TelemetryError {
				message
				code
			}
		}
		entranceMovement(hiveId: $hiveId, timeFrom: $timeFrom, timeTo: $timeTo) {
			... on EntranceMovementList {
				metrics {
					time
					beesIn
					beesOut
					netFlow
				}
			}

			... on TelemetryError {
				message
				code
			}
		}
	}
`

export default function HiveWeightGraph({ hiveId }) {
	let userStored = useLiveQuery(() => getUser(), [], null)
	const { chartRefs, syncCharts } = useChartSync()

	const { now, weekAgo } = useMemo(() => {
		const now = new Date()
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
		return { now, weekAgo }
	}, [])

	let {
		loading,
		error: errorGet,
		data,
		errorNetwork,
	} = useQuery(WEIGHT_QUERY, {
		variables: {
			hiveId,
			timeRangeMin: 7 * 60 * 24,
			timeFrom: weekAgo.toISOString(),
			timeTo: now.toISOString(),
		},
	})

	if (loading || !userStored) {
		return <Loader />
	}

	if (errorGet || errorNetwork || !data) {
		return <ErrorMsg error={{ message: 'Failed to load metrics data', code: 'NETWORK_ERROR' }} />
	}

	return (
		<>
			<WeightChart
				weightData={data.weightKg}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>
			<TemperatureChart
				temperatureData={data.temperatureCelsius}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>
			<EntranceMovementChart
				movementData={data.entranceMovement}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>
		</>
	)
}
