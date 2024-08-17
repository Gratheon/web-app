import { grafanaUri } from '../../uri.ts'
import React from 'react'


export default function Grafana() {
	return (
		<><iframe width="100%" height="100%" style={{border:0}} src={`${grafanaUri()}dashboards?orgId=1`} /></>
	)
}