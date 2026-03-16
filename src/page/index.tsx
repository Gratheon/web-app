import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router';

import Menu from '../shared/menu';
import Footer from '../shared/footer';
import MinimizedUploadProgress from '../shared/minimizedUploadProgress';
import AIAdvisorDrawer from '../shared/aiAdvisorDrawer'
import { isLoggedIn } from '../user';
import styles from './index.module.less'

import ApiaryCreate from './apiaryCreate'
import ApiaryEditForm from './apiaryEdit'
import ApiaryView from './apiaryView'
import ApiaryList from './apiaryList'
import HiveCreateForm from './hiveCreate'
import HiveEditView from './hiveEdit'
import HiveGeneralEditPage from './hiveGeneralEdit'
import AccountEdit from './accountEdit'
import AccountBilling from './accountBilling'
import AccountTokens from './accountTokens'
import AccountAuth from './accountAuth'
import AccountRegister from './accountRegister'
import Grafana from './grafana'
import InspectionShare from "./inspectionShare";
import AlertConfig from './alertConfig';
import TimeView from './time';
import AIAdvisorPage from './aiAdvisor'
import DevicesPage from './devices'
import DevicesCreatePage from './devicesCreate'
import DeviceViewPage from './deviceView'
import DeviceEditPage from './deviceEdit'
import WarehousePage from './warehouse'
import WarehouseItemViewPage from './warehouse/itemView'
import WarehouseQueensPage from './warehouse/queens'
import WarehouseBoxSystemsPage from './warehouse/boxSystems'
import ProfessionalTierGate from '@/shared/professionalTierGate'
import HobbyistTierGate from '@/shared/hobbyistTierGate'

function LoggedInPage({ children }) {
	const navigate = useNavigate()

	if(!isLoggedIn()){
		React.useEffect(
			() => {
				// store the current location so we can redirect back after login
				localStorage.setItem('redirect-after-login', window.location.pathname)

				navigate('/account/authenticate', { replace: true })
			},
			[navigate]
		)
		return null
	}

	return PageWithMenu({children})
}

function PageWithMenu({children}) {
	const [isSidebarCollapsed, setSidebarCollapsed] = React.useState(false)

	return <div
		className={isSidebarCollapsed ? `${styles.pageShell} ${styles.pageShellCollapsed}` : styles.pageShell}
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
			<div className={styles.content}>
				{children}
			</div>
			<Footer/>
		</div>
	</div>
}


function LoggedOutPage({children}) {
	const navigate = useNavigate()

	if (isLoggedIn()) {
		useEffect(
			() => {
				// redirect to last attempt as anonymous user
				let path = ""
				Object.assign(path, localStorage.getItem('redirect-after-login'))

				if(path){
					// clear the redirect path
					navigate(path, { replace: true })
					localStorage.removeItem('redirect-after-login')
				} else {
					navigate('/apiaries', { replace: true })
				}
			},
			[navigate]
		)
		return null
	}

	return children
}

export default function Page() {
	return (
		<Routes>
			<Route path="/account/authenticate" element={<LoggedOutPage><AccountAuth /></LoggedOutPage>} />
			<Route path="/account/register" element={<LoggedOutPage><AccountRegister /></LoggedOutPage>} />

			<Route path="/time" element={<LoggedInPage><ProfessionalTierGate blockWheel><TimeView /></ProfessionalTierGate></LoggedInPage>} />
			<Route path="/devices" element={<LoggedInPage><ProfessionalTierGate><DevicesPage /></ProfessionalTierGate></LoggedInPage>} />
			<Route path="/devices/add" element={<LoggedInPage><ProfessionalTierGate><DevicesCreatePage /></ProfessionalTierGate></LoggedInPage>} />
			<Route path="/devices/:id/edit" element={<LoggedInPage><ProfessionalTierGate><DeviceEditPage /></ProfessionalTierGate></LoggedInPage>} />
			<Route path="/devices/:id" element={<LoggedInPage><ProfessionalTierGate><DeviceViewPage /></ProfessionalTierGate></LoggedInPage>} />
			<Route path="/warehouse" element={<LoggedInPage><HobbyistTierGate><WarehousePage /></HobbyistTierGate></LoggedInPage>} />
			<Route path="/warehouse/queens" element={<LoggedInPage><HobbyistTierGate><WarehouseQueensPage /></HobbyistTierGate></LoggedInPage>} />
			<Route path="/warehouse/box-systems" element={<LoggedInPage><HobbyistTierGate><WarehouseBoxSystemsPage /></HobbyistTierGate></LoggedInPage>} />
			<Route path="/warehouse/:moduleType" element={<LoggedInPage><HobbyistTierGate><WarehouseItemViewPage /></HobbyistTierGate></LoggedInPage>} />

			<Route path="/apiaries/create" element={<LoggedInPage><ApiaryCreate /></LoggedInPage>} />
			<Route path="/apiaries/:id" element={<LoggedInPage><ApiaryView /></LoggedInPage>} />
			<Route path="/apiaries/edit/:id/:tab?/:hiveId?" element={<LoggedInPage><ApiaryEditForm /></LoggedInPage>} />
			<Route path="/" element={<LoggedInPage><ApiaryList /></LoggedInPage>} />
			<Route path="/apiaries/" element={<LoggedInPage><ApiaryList /></LoggedInPage>} />

			<Route path="/apiaries/:id/hives/add" element={<LoggedInPage><HiveCreateForm /></LoggedInPage>} />

			<Route path="/apiaries/:apiaryId/hives/:hiveId/edit" element={<LoggedInPage><HiveGeneralEditPage /></LoggedInPage>} />
			<Route path="/apiaries/:apiaryId/hives/:hiveId" element={<LoggedInPage><HiveEditView /></LoggedInPage>} />
			<Route path="/apiaries/:apiaryId/hives/:hiveId/treatments/" element={<LoggedInPage><HiveEditView /></LoggedInPage>} />
			<Route path="/apiaries/:apiaryId/hives/:hiveId/inspections/" element={<LoggedInPage><HiveEditView /></LoggedInPage>} />
			<Route path="/apiaries/:apiaryId/hives/:hiveId/metrics/" element={<LoggedInPage><HiveEditView /></LoggedInPage>} />
			<Route path="/ai-advisor" element={<LoggedInPage><AIAdvisorPage /></LoggedInPage>} />

			<Route
				path="/apiaries/:apiaryId/hives/:hiveId/box/:boxId"
				element={<LoggedInPage><HiveEditView /></LoggedInPage>}
			/>
			<Route
				path="/apiaries/:apiaryId/hives/:hiveId/box/:boxId/frame/:frameId"
				element={<LoggedInPage><HiveEditView /></LoggedInPage>}
			/>
			<Route
				path="/apiaries/:apiaryId/hives/:hiveId/box/:boxId/frame/:frameId/:frameSideId"
				element={<LoggedInPage><HiveEditView /></LoggedInPage>}
			/>

			<Route
				path="/apiaries/:apiaryId/hives/:hiveId/inspections/:inspectionId"
				element={<LoggedInPage><HiveEditView /></LoggedInPage>}
			/>

			{/* Render InspectionShare directly without the standard Menu/Footer */}
			<Route path="/apiaries/:apiaryId/hives/:hiveId/inspections/:inspectionId/share/:shareToken"
				element={<InspectionShare />} />

			<Route path="/account" element={<LoggedInPage><AccountEdit /></LoggedInPage>} />
			<Route path="/account/billing" element={<LoggedInPage><AccountBilling /></LoggedInPage>} />
			<Route path="/account/billing/:stripeStatus" element={<LoggedInPage><AccountBilling /></LoggedInPage>} />
			<Route path="/account/tokens" element={<LoggedInPage><AccountTokens /></LoggedInPage>} />
			<Route path="/account/:stripeStatus" element={<LoggedInPage><AccountBilling /></LoggedInPage>} />

			<Route path="/insights" element={<LoggedInPage><Grafana /></LoggedInPage>} />

			<Route path="/alert-config" element={<LoggedInPage><ProfessionalTierGate><AlertConfig section="history" /></ProfessionalTierGate></LoggedInPage>} />
			<Route path="/alert-config/channels" element={<LoggedInPage><ProfessionalTierGate><AlertConfig section="channels" /></ProfessionalTierGate></LoggedInPage>} />
			<Route path="/alert-config/rules" element={<LoggedInPage><ProfessionalTierGate><AlertConfig section="rules" /></ProfessionalTierGate></LoggedInPage>} />
		</Routes>
	)
}
