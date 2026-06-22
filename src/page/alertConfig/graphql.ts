import { gql } from '@/api'

export const ALERTS_SERVICE_LIVENESS_QUERY = gql`
	query alertsServiceLiveness {
		alertChannels {
			id
		}
	}
`

export const ALERT_CHANNELS_QUERY = gql`
	query alertChannels {
		alertChannels {
			id
			channelType
			phoneNumber
			email
			telegramUsername
			timeStart
			timeEnd
			enabled
		}
		alerts {
			id
			text
			date_added
			hiveId
			metricType
			metricValue
			delivered
		}
		alertRules {
			id
			hiveId
			apiaryId
			metricType
			conditionType
			thresholdValue
			durationMinutes
			enabled
			createdAt
			updatedAt
		}
		apiaries {
			id
			name
			hives {
				id
				hiveNumber
			}
		}
	}
`

export const CREATE_ALERT_RULE_MUTATION = gql`
	mutation createAlertRule($rule: AlertRuleInput!) {
		createAlertRule(rule: $rule) {
			id
			hiveId
			metricType
			conditionType
			thresholdValue
			durationMinutes
			enabled
		}
	}
`

export const UPDATE_ALERT_RULE_MUTATION = gql`
	mutation updateAlertRule($id: ID!, $rule: AlertRuleInput!) {
		updateAlertRule(id: $id, rule: $rule) {
			id
			hiveId
			metricType
			conditionType
			thresholdValue
			durationMinutes
			enabled
		}
	}
`

export const DELETE_ALERT_RULE_MUTATION = gql`
	mutation deleteAlertRule($id: ID!) {
		deleteAlertRule(id: $id)
	}
`

export const SET_ALERT_CHANNEL_MUTATION = gql`
	mutation setAlertChannel($config: AlertChannelInput!) {
		setAlertChannel(config: $config) {
			id
			channelType
			phoneNumber
			email
			telegramUsername
			timeStart
			timeEnd
			enabled
		}
	}
`

export const DELETE_ALERT_CHANNEL_MUTATION = gql`
	mutation deleteAlertChannel($channelType: String!) {
		deleteAlertChannel(channelType: $channelType)
	}
`
