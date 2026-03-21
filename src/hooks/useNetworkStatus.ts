import { useEffect, useState } from 'preact/hooks'

export default function useNetworkStatus() {
	const [isOnline, setIsOnline] = useState(() => {
		if (typeof navigator === 'undefined') {
			return true
		}
		return navigator.onLine
	})

	useEffect(() => {
		if (typeof window === 'undefined') {
			return
		}

		const onOnline = () => setIsOnline(true)
		const onOffline = () => setIsOnline(false)

		window.addEventListener('online', onOnline)
		window.addEventListener('offline', onOffline)

		return () => {
			window.removeEventListener('online', onOnline)
			window.removeEventListener('offline', onOffline)
		}
	}, [])

	return isOnline
}
