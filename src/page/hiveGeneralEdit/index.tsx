import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '@/api'
import HIVE_QUERY from '@/page/hiveEdit/_api/hiveQuery.graphql.ts'
import HiveTopEditForm from '@/page/hiveEdit/hiveTopInfo/hiveTopEditForm'

import { getApiary } from '@/models/apiary'
import { getHive } from '@/models/hive'

import Loader from '@/shared/loader'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import ErrorGeneral from '@/shared/messageErrorGlobal'
import MessageNotFound from '@/shared/messageNotFound'
import BreadCrumbs from '@/shared/breadcrumbs'
import T from '@/shared/translate'
import HiveIcon from '@/icons/hive'

import hiveStyles from '@/page/hiveEdit/styles.module.less'

export default function HiveGeneralEditPage() {
	const navigate = useNavigate()
	const { apiaryId, hiveId } = useParams()

	const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId], null)
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)

	const {
		loading,
		error: errorGet,
		errorNetwork,
	} = useQuery(HIVE_QUERY, {
		variables: { id: +hiveId, apiaryId: +apiaryId },
	})

	if (apiary === null || hive === null || loading) {
		return <Loader />
	}

	if (!apiary || !hive) {
		return (
			<MessageNotFound msg={<T>Hive not found</T>}>
				<div>
					<T ctx="this is a not-found error message">
						Hive was either deleted, never existed or we have a navigation or
						backend error. You can create new hive from apiary list view
					</T>
				</div>
			</MessageNotFound>
		)
	}

	const breadcrumbs = [
		{
			name: (
				<>
					«{apiary.name}» <T>apiary</T>
				</>
			),
			uri: `/apiaries/${apiaryId}`,
		},
		{
			icon: <HiveIcon size={12} />,
			name: <>{hive.hiveNumber ? `#${hive.hiveNumber}` : <T>Hive</T>}</>,
			uri: `/apiaries/${apiaryId}/hives/${hiveId}`,
		},
		{
			name: <T>Edit</T>,
			uri: `/apiaries/${apiaryId}/hives/${hiveId}/edit`,
		},
	]

	return (
		<>
			<ErrorGeneral />
			<ErrorMsg error={errorGet || errorNetwork} />

			<BreadCrumbs items={breadcrumbs} className={hiveStyles.breadcrumbsSky} />

			<HiveTopEditForm
				apiaryId={apiaryId}
				hiveId={hiveId}
				buttons={
					<Button
						color="green"
						onClick={() => navigate(`/apiaries/${apiaryId}/hives/${hiveId}`)}
					>
						<T>Complete</T>
					</Button>
				}
			/>
		</>
	)
}
