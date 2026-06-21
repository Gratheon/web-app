import React, { Suspense, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router'

import { isLoggedIn } from '../user'
import styles from './index.module.less'

import ProfessionalTierGate from '@/shared/professionalTierGate'
import HobbyistTierGate from '@/shared/hobbyistTierGate'

const Menu = React.lazy(() => import('../shared/menu'))
const Footer = React.lazy(() => import('../shared/footer'))
const MinimizedUploadProgress = React.lazy(
	() => import('../shared/minimizedUploadProgress')
)
const AIAdvisorDrawer = React.lazy(() => import('../shared/aiAdvisorDrawer'))

const ApiaryCreate = React.lazy(() => import('./apiaryCreate'))
const ApiaryEditForm = React.lazy(() => import('./apiaryEdit'))
const ApiaryView = React.lazy(() => import('./apiaryView'))
const ApiaryList = React.lazy(() => import('./apiaryList'))
const HiveCreateForm = React.lazy(() => import('./hiveCreate'))
const HiveEditView = React.lazy(() => import('./hiveEdit'))
const CanvasEditView = React.lazy(
	() => import('./hiveEdit/frame/canvasEditView')
)
const HiveGeneralEditPage = React.lazy(() => import('./hiveGeneralEdit'))
const AccountEdit = React.lazy(() => import('./accountEdit'))
const AccountBilling = React.lazy(() => import('./accountBilling'))
const AccountTokens = React.lazy(() => import('./accountTokens'))
const AccountAuth = React.lazy(() => import('./accountAuth'))
const AccountRegister = React.lazy(() => import('./accountRegister'))
const AccountForgotPassword = React.lazy(
	() => import('./accountForgotPassword')
)
const AccountResetPassword = React.lazy(() => import('./accountResetPassword'))
const InspectionShare = React.lazy(() => import('./inspectionShare'))
const AlertConfig = React.lazy(() => import('./alertConfig'))
const TimeView = React.lazy(() => import('./time'))
const CalendarPage = React.lazy(() => import('./calendar'))
const AIAdvisorPage = React.lazy(() => import('./aiAdvisor'))
const DevicesPage = React.lazy(() => import('./devices'))
const DevicesCreatePage = React.lazy(() => import('./devicesCreate'))
const DeviceViewPage = React.lazy(() => import('./deviceView'))
const DeviceEditPage = React.lazy(() => import('./deviceEdit'))
const WarehousePage = React.lazy(() => import('./warehouse'))
const WarehouseItemViewPage = React.lazy(() => import('./warehouse/itemView'))
const WarehouseQueensPage = React.lazy(() => import('./warehouse/queens'))
const WarehouseQueenDetectorPage = React.lazy(
	() => import('./warehouse/queenDetector')
)
const WarehouseQueensCreatePage = React.lazy(
	() => import('./warehouse/queensCreate')
)
const WarehouseBoxSystemsPage = React.lazy(
	() => import('./warehouse/boxSystems')
)
const WarehouseBoxSystemCreatePage = React.lazy(
	() => import('./warehouse/boxSystemCreate')
)
const WarehouseBoxSystemEditPage = React.lazy(
	() => import('./warehouse/boxSystemEdit')
)

function LoggedInPage({ children }) {
	const navigate = useNavigate()

	if (!isLoggedIn()) {
		React.useEffect(() => {
			// store the current location so we can redirect back after login
			localStorage.setItem('redirect-after-login', window.location.pathname)

			navigate('/account/authenticate', { replace: true })
		}, [navigate])
		return null
	}

	return PageWithMenu({ children })
}

function PageWithMenu({ children }) {
	const [isSidebarCollapsed, setSidebarCollapsed] = React.useState(false)

	return (
		<div
			className={
				isSidebarCollapsed
					? `${styles.pageShell} ${styles.pageShellCollapsed}`
					: styles.pageShell
			}
			data-sidebar-collapsed={isSidebarCollapsed ? 'true' : 'false'}
		>
			<Menu
				isLoggedIn={isLoggedIn()}
				isSidebarCollapsed={isSidebarCollapsed}
				onSidebarToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
			/>
			<MinimizedUploadProgress />
			<AIAdvisorDrawer />
			<div className={styles.mainColumn}>
				<div className={styles.content}>{children}</div>
				<Footer />
			</div>
		</div>
	)
}

function LoggedOutPage({ children }) {
	const navigate = useNavigate()

	if (isLoggedIn()) {
		useEffect(() => {
			// redirect to last attempt as anonymous user
			let path = ''
			Object.assign(path, localStorage.getItem('redirect-after-login'))

			if (path) {
				// clear the redirect path
				navigate(path, { replace: true })
				localStorage.removeItem('redirect-after-login')
			} else {
				navigate('/apiaries', { replace: true })
			}
		}, [navigate])
		return null
	}

	return children
}

function RouteFallback() {
	return <div style={{ minHeight: '100vh', background: 'white' }} />
}

export default function Page() {
	return (
		<Suspense fallback={<RouteFallback />}>
			<Routes>
				<Route
					path="/account/authenticate"
					element={
						<LoggedOutPage>
							<AccountAuth />
						</LoggedOutPage>
					}
				/>
				<Route
					path="/account/register"
					element={
						<LoggedOutPage>
							<AccountRegister />
						</LoggedOutPage>
					}
				/>
				<Route
					path="/account/forgot-password"
					element={
						<LoggedOutPage>
							<AccountForgotPassword />
						</LoggedOutPage>
					}
				/>
				<Route
					path="/account/reset-password"
					element={
						<LoggedOutPage>
							<AccountResetPassword />
						</LoggedOutPage>
					}
				/>

				<Route
					path="/calendar"
					element={
						<LoggedInPage>
							<CalendarPage />
						</LoggedInPage>
					}
				/>
				<Route
					path="/insights"
					element={
						<LoggedInPage>
							<ProfessionalTierGate blockWheel>
								<TimeView />
							</ProfessionalTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/devices"
					element={
						<LoggedInPage>
							<ProfessionalTierGate>
								<DevicesPage />
							</ProfessionalTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/devices/add"
					element={
						<LoggedInPage>
							<ProfessionalTierGate>
								<DevicesCreatePage />
							</ProfessionalTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/devices/:id/edit"
					element={
						<LoggedInPage>
							<ProfessionalTierGate>
								<DeviceEditPage />
							</ProfessionalTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/devices/:id"
					element={
						<LoggedInPage>
							<ProfessionalTierGate>
								<DeviceViewPage />
							</ProfessionalTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/warehouse"
					element={
						<LoggedInPage>
							<HobbyistTierGate>
								<WarehousePage />
							</HobbyistTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/warehouse/queens"
					element={
						<LoggedInPage>
							<HobbyistTierGate>
								<WarehouseQueensPage />
							</HobbyistTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/warehouse/queens/detect"
					element={
						<LoggedInPage>
							<WarehouseQueenDetectorPage />
						</LoggedInPage>
					}
				/>
				<Route
					path="/warehouse/queens/create"
					element={
						<LoggedInPage>
							<HobbyistTierGate>
								<WarehouseQueensCreatePage />
							</HobbyistTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/warehouse/box-systems"
					element={
						<LoggedInPage>
							<HobbyistTierGate>
								<WarehouseBoxSystemsPage />
							</HobbyistTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/warehouse/box-systems/create"
					element={
						<LoggedInPage>
							<HobbyistTierGate>
								<WarehouseBoxSystemCreatePage />
							</HobbyistTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/warehouse/box-systems/:id"
					element={
						<LoggedInPage>
							<HobbyistTierGate>
								<WarehouseBoxSystemEditPage />
							</HobbyistTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/warehouse/:moduleType"
					element={
						<LoggedInPage>
							<HobbyistTierGate>
								<WarehouseItemViewPage />
							</HobbyistTierGate>
						</LoggedInPage>
					}
				/>

				<Route
					path="/apiaries/create"
					element={
						<LoggedInPage>
							<ApiaryCreate />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/:id"
					element={
						<LoggedInPage>
							<ApiaryView />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/edit/:id/:tab?/:hiveId?"
					element={
						<LoggedInPage>
							<ApiaryEditForm />
						</LoggedInPage>
					}
				/>
				<Route
					path="/"
					element={
						<LoggedInPage>
							<ApiaryList />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/"
					element={
						<LoggedInPage>
							<ApiaryList />
						</LoggedInPage>
					}
				/>

				<Route
					path="/apiaries/:id/hives/add"
					element={
						<LoggedInPage>
							<HiveCreateForm />
						</LoggedInPage>
					}
				/>

				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/edit"
					element={
						<LoggedInPage>
							<HiveGeneralEditPage />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId"
					element={
						<LoggedInPage>
							<HiveEditView />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/treatments/"
					element={
						<LoggedInPage>
							<HiveEditView />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/inspections/"
					element={
						<LoggedInPage>
							<HiveEditView />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/metrics/"
					element={
						<LoggedInPage>
							<HiveEditView />
						</LoggedInPage>
					}
				/>
				<Route
					path="/ai-advisor"
					element={
						<LoggedInPage>
							<AIAdvisorPage />
						</LoggedInPage>
					}
				/>

				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/box/:boxId"
					element={
						<LoggedInPage>
							<HiveEditView />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/box/:boxId/frame/:frameId"
					element={
						<LoggedInPage>
							<HiveEditView />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/box/:boxId/frame/:frameId/:frameSideId"
					element={
						<LoggedInPage>
							<HiveEditView />
						</LoggedInPage>
					}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/box/:boxId/frame/:frameId/:frameSideId/canvas-edit"
					element={
						<LoggedInPage>
							<CanvasEditView />
						</LoggedInPage>
					}
				/>

				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/inspections/:inspectionId"
					element={
						<LoggedInPage>
							<HiveEditView />
						</LoggedInPage>
					}
				/>

				{/* Render InspectionShare directly without the standard Menu/Footer */}
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/inspections/:inspectionId/share/:shareToken"
					element={<InspectionShare />}
				/>

				<Route
					path="/account"
					element={
						<LoggedInPage>
							<AccountEdit />
						</LoggedInPage>
					}
				/>
				<Route
					path="/account/billing"
					element={
						<LoggedInPage>
							<AccountBilling />
						</LoggedInPage>
					}
				/>
				<Route
					path="/account/billing/:stripeStatus"
					element={
						<LoggedInPage>
							<AccountBilling />
						</LoggedInPage>
					}
				/>
				<Route
					path="/account/tokens"
					element={
						<LoggedInPage>
							<AccountTokens />
						</LoggedInPage>
					}
				/>
				<Route
					path="/account/:stripeStatus"
					element={
						<LoggedInPage>
							<AccountBilling />
						</LoggedInPage>
					}
				/>

				<Route
					path="/alert-config"
					element={
						<LoggedInPage>
							<ProfessionalTierGate>
								<AlertConfig section="history" />
							</ProfessionalTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/alert-config/channels"
					element={
						<LoggedInPage>
							<ProfessionalTierGate>
								<AlertConfig section="channels" />
							</ProfessionalTierGate>
						</LoggedInPage>
					}
				/>
				<Route
					path="/alert-config/rules"
					element={
						<LoggedInPage>
							<ProfessionalTierGate>
								<AlertConfig section="rules" />
							</ProfessionalTierGate>
						</LoggedInPage>
					}
				/>
			</Routes>
		</Suspense>
	)
}
