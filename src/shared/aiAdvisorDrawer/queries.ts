import { gql } from '@/api'

export const METRICS_QUERY = gql`
	query advisorMetrics(
		$hiveId: ID!
		$timeRangeMin: Int
		$timeFrom: DateTime!
		$timeTo: DateTime!
	) {
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

export const GENERATE_ADVICE_MUTATION = gql`
	mutation generateHiveAdvice(
		$hiveID: ID
		$adviceContext: JSON
		$langCode: String
	) {
		generateHiveAdvice(
			hiveID: $hiveID
			adviceContext: $adviceContext
			langCode: $langCode
		)
	}
`

export const APIARY_ADVISOR_QUERY = gql`
	query advisorApiary($id: ID!) {
		apiary(id: $id) {
			id
			name
			type
			lat
			lng
			hives {
				id
				hiveNumber
				boxCount
				family {
					name
				}
			}
		}
	}
`

export const APIARY_PLACEMENT_QUERY = gql`
	query advisorApiaryPlacement($apiaryId: ID!) {
		hivePlacements(apiaryId: $apiaryId) {
			hiveId
			x
			y
			rotation
		}
		apiaryObstacles(apiaryId: $apiaryId) {
			id
			type
			x
			y
			width
			height
			radius
			rotation
			label
		}
	}
`

export const APIARY_WEATHER_QUERY = gql`
	query advisorApiaryWeather($lat: String!, $lng: String!) {
		weather(lat: $lat, lng: $lng)
	}
`

export const FRAME_SIDE_IMAGE_QUERY = gql`
	query advisorFrameImage($frameSideId: ID!) {
		hiveFrameSideFile(frameSideId: $frameSideId) {
			frameSideId
			file {
				id
				url
				resizes {
					max_dimension_px
					url
				}
			}
		}
	}
`

export const AI_ADVISOR_USAGE_QUERY = gql`
	query aiAdvisorUsage {
		aiAdvisorUsage {
			month
			inputTokensUsed
			outputTokensUsed
			totalTokensUsed
			requestCount
			inputTokensLimit
			outputTokensLimit
			inputUsagePercent
			outputUsagePercent
			percentUsed
		}
	}
`
