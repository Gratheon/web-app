import { NavLink } from 'react-router-dom'

import styles from './styles.module.less'

type AIAdvisorBillingNoticeProps = {
	compact?: boolean
}

function HoneyJarIcon({ size = 28 }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="7" y="3.5" width="10" height="3.2" rx="1.2" fill="#f3c95f" stroke="#1f1f1f" strokeWidth="1.3" />
			<rect x="5.2" y="6.2" width="13.6" height="14.3" rx="3.2" fill="#ffe39a" stroke="#1f1f1f" strokeWidth="1.5" />
			<path d="M8.4 12.3C9.6 11 10.8 10.3 12 10.3C13.2 10.3 14.4 11 15.6 12.3" stroke="#1f1f1f" strokeWidth="1.3" strokeLinecap="round" />
			<path d="M8.4 15.5C9.6 14.2 10.8 13.5 12 13.5C13.2 13.5 14.4 14.2 15.6 15.5" stroke="#1f1f1f" strokeWidth="1.3" strokeLinecap="round" />
		</svg>
	)
}

export default function AIAdvisorBillingNotice({ compact = false }: AIAdvisorBillingNoticeProps) {
	return (
		<div className={`${styles.card} ${compact ? styles.compact : ''}`}>
			<div className={styles.iconWrap}>
				<HoneyJarIcon />
			</div>
			<div className={styles.textWrap}>
				<div className={styles.title}>AI Advisor requires Starter plan or higher.</div>
				<NavLink className={styles.link} to="/account/billing">
					Upgrade in Billing to continue
				</NavLink>
			</div>
		</div>
	)
}
