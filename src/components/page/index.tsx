import React, { Children } from 'react'
import { Routes, Route, useNavigate } from 'react-router'

import Menu from '../menu'
import Footer from '../footer'
import { isLoggedIn } from '../user'

import ApiaryCreate from './apiaryCreate'
import ApiaryEditForm from './apiaryEdit'
import ApiaryList from './apiaryList'
import HiveCreateForm from './hiveCreate'
import HiveEditView from './hiveEdit'
import AccountEdit from './accountEdit'
import AccountAuth from './accountAuth'
import AccountRegister from './accountRegister'
import Grafana from './grafana'
import InspectionList from './inspectionList'

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

	return <div style={{ display: 'flex', flexDirection: 'column', height: "100%" }}>
		<Menu isLoggedIn={isLoggedIn()} />
		<div style={{ flex: 1 }}>
			{children}
		</div>
		<Footer />
	</div>
}


function LoggedOutPage({ children }) {
	const navigate = useNavigate()

	if(isLoggedIn()){
		React.useEffect(
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


			<Route path="/apiaries/create" element={<LoggedInPage><ApiaryCreate /></LoggedInPage>} />
			<Route path="/apiaries/edit/:id" element={<LoggedInPage><ApiaryEditForm /></LoggedInPage>} />
			<Route path="/" element={<LoggedInPage><ApiaryList /></LoggedInPage>} />
			<Route path="/apiaries/" element={<LoggedInPage><ApiaryList /></LoggedInPage>} />

			<Route path="/apiaries/:id/hives/add" element={<LoggedInPage><HiveCreateForm /></LoggedInPage>} />

			<Route
				path="/apiaries/:apiaryId/hives/:hiveId"
				element={<LoggedInPage><HiveEditView /></LoggedInPage>}
			/>

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
				path="/apiaries/:apiaryId/hives/:hiveId/inspections/"
				element={<LoggedInPage><InspectionList /></LoggedInPage>}
			/>

			<Route
				path="/apiaries/:apiaryId/hives/:hiveId/inspections/:inspectionId"
				element={<LoggedInPage><InspectionList /></LoggedInPage>}
			/>

			<Route path="/apiaries/:apiaryId/hives/:hiveId/inspections/:inspectionId/share/:shareId" 
				element={<LoggedOutPage>SHARED INSPECTION VIEW</LoggedOutPage>} />

			<Route path="/account" element={<LoggedInPage><AccountEdit /></LoggedInPage>} />
			<Route path="/account/:stripeStatus" element={<LoggedInPage><AccountEdit /></LoggedInPage>} />

			<Route path="/insights" element={<LoggedInPage><Grafana /></LoggedInPage>} />
		</Routes>
	)
}
