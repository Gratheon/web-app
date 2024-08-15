import InspectionIcon from '../../icons/inspection.tsx'
import T from '../translate'
import styles from './index.module.less'
import { NavLink } from 'react-router-dom'

export default function SubMenu({ inspectionCount, currentUrl, inspectionsUrl }) {
	if (inspectionCount === 0) {
		return
	}

	return <div className={styles.submenu}>
		<NavLink
			className={({ isActive }) => isActive ? styles.active : ""}
			to={inspectionsUrl}>
				<InspectionIcon />
				<T>Inspection Timeline</T> ({inspectionCount})</NavLink>
	</div>
}