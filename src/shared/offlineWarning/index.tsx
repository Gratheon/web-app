import T from '@/shared/translate'
import useNetworkStatus from '@/hooks/useNetworkStatus'
import WifiOffIcon from '@/icons/wifiOff'
import styles from './index.module.less'

export default function OfflineWarning() {
	const isOnline = useNetworkStatus()

	if (isOnline) {
		return null
	}

	return (
		<div className={styles.warning} role="status" aria-live="polite">
			<span className={styles.icon} aria-hidden="true">
				<WifiOffIcon size={18} />
			</span>
			<T>You are offline. Some features may be unavailable until your connection is restored.</T>
		</div>
	)
}
