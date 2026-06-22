export function getChartTypeFromMetricType(
	metricType: string | null | undefined
): string | null {
	if (!metricType) return null

	const metricTypeMap: Record<string, string> = {
		WEIGHT: 'weight',
		TEMPERATURE: 'temperature',
		ENTRANCE_MOVEMENT: 'entrance',
		ENTRANCE_SPEED: 'entranceSpeed',
		ENTRANCE_DETECTED: 'entranceDetected',
		ENTRANCE_STATIONARY: 'entranceStationary',
		ENTRANCE_INTERACTIONS: 'entranceInteractions',
	}

	return metricTypeMap[metricType] || null
}
