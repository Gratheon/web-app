import { gql } from '@/api'

export const HIVES_QUERY = gql`
	query HIVES {
		apiaries {
			id
			name
			lat
			lng
			hives {
				id
				hiveNumber
				notes
				status
				inspectionCount
				collapse_date
				collapse_cause
				family {
					id
				}
			}
		}
	}
`

export function buildMockTelemetryData(activeHives: any[], timeRangeDays: number) {
	if (!activeHives?.length) return null

	const now = new Date()
	const points = Math.max(12, Math.min(36, Math.floor(timeRangeDays / 3)))
	const dayStep = Math.max(1, Math.floor(timeRangeDays / points))
	const data: Record<string, any> = {}

	activeHives.forEach((hive, hiveIndex) => {
		const weightMetrics = []
		const entranceMetrics = []
		const populationMetrics = []

		for (let i = points; i >= 0; i--) {
			const date = new Date(now.getTime() - i * dayStep * 24 * 60 * 60 * 1000)
			const ts = date.toISOString()
			const trend = (points - i) / Math.max(1, points)

			const beesIn = Math.round(120 + hiveIndex * 24 + trend * 80 + Math.sin(i / 2) * 18)
			const beesOut = Math.round(110 + hiveIndex * 21 + trend * 72 + Math.cos(i / 3) * 16)
			const netFlow = beesIn - beesOut
			const avgSpeed = Math.max(1.2, 3.2 + Math.sin(i / 4) * 0.7 + hiveIndex * 0.2)
			const p95Speed = Math.max(avgSpeed + 0.8, avgSpeed * 1.45)
			const detectedBees = Math.max(40, beesIn + beesOut + hiveIndex * 15)
			const stationaryBees = Math.max(8, Math.round(detectedBees * 0.18))
			const beeInteractions = Math.max(4, Math.round(detectedBees * 0.06))

			weightMetrics.push({
				t: ts,
				v: Math.round((28 + hiveIndex * 2.6 + trend * 6 + Math.sin(i / 3) * 1.4) * 100) / 100,
			})

			entranceMetrics.push({
				time: ts,
				beesIn,
				beesOut,
				netFlow,
				avgSpeed: Math.round(avgSpeed * 100) / 100,
				p95Speed: Math.round(p95Speed * 100) / 100,
				stationaryBees,
				detectedBees,
				beeInteractions,
			})

			if (i % Math.max(1, Math.floor(points / 8)) === 0) {
				populationMetrics.push({
					t: ts,
					beeCount: Math.round(14000 + hiveIndex * 1800 + trend * 12000 + Math.sin(i / 2) * 900),
					droneCount: Math.round(400 + hiveIndex * 80 + trend * 300),
					varroaMiteCount: Math.max(0, Math.round(8 + hiveIndex * 2 + Math.cos(i / 3) * 3)),
					inspectionId: `mock-${hive.id}-${i}`,
				})
			}
		}

		data[`hive_${hive.id}_weight`] = { metrics: weightMetrics }
		data[`hive_${hive.id}_temp`] = { metrics: [] }
		data[`hive_${hive.id}_entrance`] = { metrics: entranceMetrics }
		data[`hive_${hive.id}_population`] = { metrics: populationMetrics }
	})

	return data
}

export function buildTelemetryQuery(activeHives: any[]) {
	if (!activeHives.length) return null

	const queries = activeHives.map(hive => `
		hive_${hive.id}_weight: weightKgAggregated(hiveId: "${hive.id}", days: $days, aggregation: DAILY_AVG) {
			... on MetricFloatList {
				metrics { t v }
			}
			... on TelemetryError {
				message
				code
			}
		}
		hive_${hive.id}_temp: temperatureCelsius(hiveId: "${hive.id}", timeRangeMin: $temperatureTimeRangeMin) {
			... on MetricFloatList {
				metrics { t v }
			}
			... on TelemetryError {
				message
				code
			}
		}
		hive_${hive.id}_entrance: entranceMovement(hiveId: "${hive.id}", timeFrom: $timeFrom, timeTo: $timeTo) {
			... on EntranceMovementList {
				metrics {
					time
					beesIn
					beesOut
					netFlow
					avgSpeed
					p95Speed
					stationaryBees
					detectedBees
					beeInteractions
				}
			}
			... on TelemetryError {
				message
				code
			}
		}
		hive_${hive.id}_population: populationMetrics(hiveId: "${hive.id}", days: $days) {
			... on PopulationMetricsList {
				metrics {
					t
					beeCount
					droneCount
					varroaMiteCount
					inspectionId
				}
			}
			... on TelemetryError {
				message
				code
			}
		}
	`).join('\n')

	return gql`
		query MultiHiveTelemetry($days: Int!, $temperatureTimeRangeMin: Int!, $timeFrom: DateTime!, $timeTo: DateTime!) {
			${queries}
		}
	`
}

export function getTelemetryTimeWindow(timeRangeDays: number) {
	const now = new Date()
	const timeFrom = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000)
	const maxTempRangeMin = 7 * 24 * 60

	return {
		timeFrom: timeFrom.toISOString(),
		timeTo: now.toISOString(),
		temperatureTimeRangeMin: Math.min(timeRangeDays * 24 * 60, maxTempRangeMin),
	}
}
