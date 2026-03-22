import T from '@/shared/translate'
import WarnIcon from '@/icons/warn'
import styles from './index.module.less'

export default function ServiceDegradedWarning() {
	return (
		<div className={styles.warning} role="status" aria-live="polite">
			<span className={styles.icon} aria-hidden="true">
				<WarnIcon size={18} />
			</span>
			<T>Service is degraded. Some features may be unavailable while we use cached data.</T>
		</div>
	)
}
