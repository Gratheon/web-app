import {useLiveQuery} from "dexie-react-hooks";

import { grafanaUri } from '@/uri'
import {getUser} from "@/models/user";
import T from "@/shared/translate";
import MessageSuccess from "@/shared/messageSuccess";


export default function Grafana() {
	let userStored = useLiveQuery(() =>  getUser(), [], null)

	if(!userStored) return null

	return (
		<>
			{/*{userStored.billingPlan !=='pro' && <MessageSuccess title={<T>You need to have a pro plan to access analytics</T>} isWarning={true} />}*/}
			<iframe width="100%" height="100%" style={{border:0}} src={`${grafanaUri()}dashboards?orgId=1`} />
		</>
	)
}