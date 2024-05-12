import InspectionIcon from '@/components/icons/inspection'
import T from '../translate'
import styles from './index.less'
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