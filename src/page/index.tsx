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
	return <div className={styles.pageShell}>
		<Menu isLoggedIn={isLoggedIn()}/>
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

			<Route path="/time" element={<LoggedInPage><TimeView /></LoggedInPage>} />

			<Route path="/apiaries/create" element={<LoggedInPage><ApiaryCreate /></LoggedInPage>} />
			<Route path="/apiaries/:id" element={<LoggedInPage><ApiaryView /></LoggedInPage>} />
			<Route path="/apiaries/edit/:id/:tab?/:hiveId?" element={<LoggedInPage><ApiaryEditForm /></LoggedInPage>} />
			<Route path="/" element={<LoggedInPage><ApiaryList /></LoggedInPage>} />
			<Route path="/apiaries/" element={<LoggedInPage><ApiaryList /></LoggedInPage>} />

			<Route path="/apiaries/:id/hives/add" element={<LoggedInPage><HiveCreateForm /></LoggedInPage>} />

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

			<Route path="/alert-config" element={<LoggedInPage><AlertConfig section="history" /></LoggedInPage>} />
			<Route path="/alert-config/channels" element={<LoggedInPage><AlertConfig section="channels" /></LoggedInPage>} />
			<Route path="/alert-config/rules" element={<LoggedInPage><AlertConfig section="rules" /></LoggedInPage>} />
		</Routes>
	)
}
