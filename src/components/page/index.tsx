import React from 'react'
import { Routes, Route } from 'react-router'

import ApiaryCreate from './apiaryCreate'
import ApiaryEditForm from './apiaryEdit'
import ApiaryList from './apiaryList'
import HiveCreateForm from './hiveCreate'
import HiveEditView from './hiveEdit'
import InspectionView from './inspectionView'
import AccountEdit from './accountEdit'
import AccountAuth from './accountAuth'
import AccountRegister from './accountRegister'

export default function Page() {
	return (
		<div style={{ flexGrow: 1 }}>
			<Routes>
				<Route path="/account/authenticate" element={<AccountAuth />} />
				<Route path="/account/register" element={<AccountRegister />} />

				<Route path="/apiaries/create" element={<ApiaryCreate />} />
				<Route path="/apiaries/edit/:id" element={<ApiaryEditForm />} />
				<Route path="/" element={<ApiaryList />} />
				<Route path="/apiaries/" element={<ApiaryList />} />

				<Route path="/apiaries/:id/hives/add" element={<HiveCreateForm />} />
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId"
					element={<HiveEditView />}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/box/:boxSelected"
					element={<HiveEditView />}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/box/:boxSelected/frame/:frameSelected"
					element={<HiveEditView />}
				/>
				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/box/:boxSelected/frame/:frameSelected/:frameSide"
					element={<HiveEditView />}
				/>

				<Route
					path="/apiaries/:apiaryId/hives/:hiveId/inspections/:inspectionId"
					element={<InspectionView />}
				/>
				<Route path="/account" element={<AccountEdit />} />
				<Route path="/account/:stripeStatus" element={<AccountEdit />} />
			</Routes>
		</div>
	)
}
