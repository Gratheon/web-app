import { useRef, useCallback } from 'react'

export function useChartSync() {
	const chartRefs = useRef([])
	const syncingRef = useRef(false)

	const syncCharts = useCallback((sourceChart) => {
		if (syncingRef.current) return

		syncingRef.current = true

		try {
			const timeScale = sourceChart.timeScale()
			const visibleRange = timeScale.getVisibleRange()

			if (!visibleRange) return

			chartRefs.current.forEach((chart) => {
				if (chart && chart !== sourceChart) {
					try {
						chart.timeScale().setVisibleRange(visibleRange)
					} catch (e) {
						console.error('Failed to sync chart:', e)
					}
				}
			})
		} finally {
			setTimeout(() => {
				syncingRef.current = false
			}, 10)
		}
	}, [])

	return { chartRefs, syncCharts }
}

