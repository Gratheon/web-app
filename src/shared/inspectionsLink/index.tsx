import { NavLink } from 'react-router-dom'

import InspectionIcon from '@/icons/inspection.tsx'
import T from '../translate/index.tsx'
import styles from './index.module.less'

export default function InspectionsLink({ inspectionCount, inspectionsUrl }) {
	if (inspectionCount === 0) {
		return
	}

	return (
		<div className={styles.submenu}>
			<NavLink
				className={({ isActive }) => (isActive ? styles.active : '')}
				to={inspectionsUrl}
			>
				<T>Inspections</T> ({inspectionCount})
			</NavLink>
		</div>
	)
}
