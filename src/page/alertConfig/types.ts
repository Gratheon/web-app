export type AlertConfigSection = 'history' | 'channels' | 'rules'

export type AlertChannelType = 'SMS' | 'EMAIL' | 'TELEGRAM'

export type AlertChannelConfig = {
	phoneNumber: string
	email: string
	telegramUsername: string
	timeStart: string
	timeEnd: string
	enabled: boolean
}

export type HiveInfo = {
	name: string
	apiaryId: string
	apiaryName: string
}

export type Apiary = {
	id: string
	name: string
	hives?: Array<{
		id: string
		hiveNumber?: string | number | null
	}>
}

export type AlertRule = {
	id: string
	hiveId?: string | null
	apiaryId?: string | null
	metricType?: string | null
	conditionType?: string | null
	thresholdValue?: string | number | null
	durationMinutes?: number | null
	enabled?: boolean | null
}

export type AlertHistoryItem = {
	id: string
	text?: string | null
	date_added?: string | null
	hiveId?: string | null
	metricType?: string | null
	metricValue?: string | number | null
	delivered?: boolean | null
}
