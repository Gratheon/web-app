import { type ComponentChildren } from 'preact'
import { useLiveQuery } from 'dexie-react-hooks'

import BillingUpgradeNotice from '@/shared/billingUpgradeNotice'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import { getUser } from '@/models/user'
import { isBillingTierAtLeast } from '@/shared/billingTier'

type ProfessionalTierGateProps = {
	children: ComponentChildren
	blockWheel?: boolean
}

export default function ProfessionalTierGate({ children, blockWheel = false }: ProfessionalTierGateProps) {
	const user = useLiveQuery(() => getUser(), [], undefined)

	if (user === undefined) {
		return (
			<div
				style={{
					minHeight: '240px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Loader />
			</div>
		)
	}

	const hasAccess = isBillingTierAtLeast(user?.billingPlan, 'professional')

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
				onWheel={(event) => {
					if (!blockWheel) return
					event.preventDefault()
					event.stopPropagation()
				}}
				onTouchMove={(event) => {
					if (!blockWheel) return
					event.preventDefault()
					event.stopPropagation()
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: '100px',
					left: '50%',
					transform: 'translateX(-50%)',
					width: 'min(460px, calc(100% - 24px))',
					zIndex: 2,
				}}
			>
				<BillingUpgradeNotice title={<T>This section requires Professional plan or higher.</T>} />
			</div>
		</div>
	)
}
