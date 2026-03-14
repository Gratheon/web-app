import { type ComponentChildren } from 'preact'
import { useLiveQuery } from 'dexie-react-hooks'

import BillingUpgradeNotice from '@/shared/billingUpgradeNotice'
import T from '@/shared/translate'
import { getUser } from '@/models/user'
import { isBillingTierAtLeast } from '@/shared/billingTier'

type HobbyistTierGateProps = {
	children: ComponentChildren
}

export default function HobbyistTierGate({ children }: HobbyistTierGateProps) {
	const user = useLiveQuery(() => getUser(), [], null)
	const hasAccess = isBillingTierAtLeast(user?.billingPlan, 'hobbyist')

	if (hasAccess) {
		return <>{children}</>
	}

	return (
		<div style={{ position: 'relative' }}>
			<div aria-hidden="true">{children}</div>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'rgba(235, 235, 235, 0.35)',
					cursor: 'not-allowed',
					zIndex: 1,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: 'min(460px, calc(100% - 24px))',
					zIndex: 2,
				}}
			>
				<BillingUpgradeNotice title={<T>Warehouse requires Hobbyist plan or higher.</T>} />
			</div>
		</div>
	)
}
