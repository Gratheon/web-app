import T from '@/shared/translate'
import BillingUpgradeNotice from '@/shared/billingUpgradeNotice'

type AIAdvisorBillingNoticeProps = {
	compact?: boolean
}

export default function AIAdvisorBillingNotice({ compact = false }: AIAdvisorBillingNoticeProps) {
	return (
		<BillingUpgradeNotice
			compact={compact}
			title={<T>AI Advisor requires Starter plan or higher.</T>}
		/>
	)
}
