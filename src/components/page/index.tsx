import React, { Children } from 'react'
import { Routes, Route } from 'react-router'

import Menu from '../menu'
import Footer from '../footer'
import { isLoggedIn } from '../user'

import ApiaryCreate from './apiaryCreate'
import ApiaryEditForm from './apiaryEdit'
import ApiaryList from './apiaryList'
import HiveCreateForm from './hiveCreate'
import HiveEditView from './hiveEdit'
import InspectionView from './inspectionView'
import AccountEdit from './accountEdit'
import AccountAuth from './accountAuth'
import AccountRegister from './accountRegister'
import Grafana from './grafana'
import InspectionList from './inspectionList'

function LoggedInPage({ children }) {
	return <div style={{ display: 'flex', flexDirection: 'column', height:"100%" }}>
		<Menu isLoggedIn={isLoggedIn()} />
		<div style={{ flex: 1 }}>
			{children}
		</div>
		<Footer />
	</div>
}

export default function Page() {
	return (
			<Routes>
				<Route path="/account/authenticate" element={<AccountAuth />} />

				<Route path="/account/register" element={<AccountRegister />} />
				<Route path="/apiaries/create" element={<LoggedInPage><ApiaryCreate /></LoggedInPage>} />
				<Route path="/apiaries/edit/:id" element={<LoggedInPage><ApiaryEditForm /></LoggedInPage>} />
				<Route path="/" element={<LoggedInPage><ApiaryList /></LoggedInPage>} />
				<Route path="/apiaries/" element={<LoggedInPage><ApiaryList /></LoggedInPage>} />

				<Route path="/apiaries/:id/hives/add" element={<LoggedInPage><HiveCreateForm /></LoggedInPage>} />
				<Route path="/analytics" element={<LoggedInPage><Grafana /></LoggedInPage>} />
				
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
					element={<LoggedInPage><InspectionView /></LoggedInPage>}
				/>
				<Route path="/account" element={<LoggedInPage><AccountEdit /></LoggedInPage>} />
				<Route path="/account/:stripeStatus" element={<LoggedInPage><AccountEdit /></LoggedInPage>} />
			</Routes>
	)
}
