export function formatMetricData(metrics: Array<{ t: string; v: number }>) {
	if (!metrics || metrics.length === 0) return []

	return metrics
		.map((row) => ({
			time: Math.floor(new Date(row.t).getTime() / 1000),
			value: Math.round(row.v * 100) / 100,
		}))
		.sort((a, b) => a.time - b.time)
		.reduce((acc, curr) => {
			const lastItem = acc[acc.length - 1]
			if (!lastItem || lastItem.time !== curr.time) {
				acc.push(curr)
			} else {
				acc[acc.length - 1] = curr
			}
			return acc
		}, [])
}

export function formatEntranceMovementData(
	metrics: Array<{ time: string; beesIn?: number; beesOut?: number; netFlow?: number }>
) {
	if (!metrics || metrics.length === 0) return { beesInData: [], beesOutData: [] }

	const aggregatedData = new Map()

	metrics.forEach((row) => {
		const timestamp = Math.floor(new Date(row.time).getTime() / 1000)

		if (!aggregatedData.has(timestamp)) {
			aggregatedData.set(timestamp, {
				beesIn: 0,
				beesOut: 0,
			})
		}

		const entry = aggregatedData.get(timestamp)
		if (row.beesIn != null) entry.beesIn += row.beesIn
		if (row.beesOut != null) entry.beesOut += row.beesOut
	})

	const beesInData = Array.from(aggregatedData.entries())
		.map(([timestamp, data]) => ({
			time: timestamp,
			value: Math.round(data.beesIn * 100) / 100,
		}))
		.filter(item => item.value > 0)
		.sort((a, b) => a.time - b.time)

	const beesOutData = Array.from(aggregatedData.entries())
		.map(([timestamp, data]) => ({
			time: timestamp,
			value: Math.round(data.beesOut * 100) / 100,
		}))
		.filter(item => item.value > 0)
		.sort((a, b) => a.time - b.time)

	return { beesInData, beesOutData }
}

export function formatTableData(data: Array<{ time: number; value: number }>, label: string = 'Value') {
	return data.map(item => ({
		Time: new Date(item.time * 1000).toLocaleString(),
		[label]: item.value
	}))
}

