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
			<iframe width="100%" height="100%" style={{border:0}} src={`${grafanaUri()}dashboards`} />
		</>
	)
}